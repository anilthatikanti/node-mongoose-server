const { TickerType, ActionType } = require('../models/types');
const { Response, TickerResponse } = require('../models/messages');
const yahooFinance = require('yahoo-finance2').default;

class SubscriptionService {
    static instance = null;

    static getInstance() {
        if (!SubscriptionService.instance) {
            SubscriptionService.instance = new SubscriptionService();
        }
        return SubscriptionService.instance;
    }

    constructor() {
        if (SubscriptionService.instance) {
            throw new Error('SubscriptionService is a singleton. Use getInstance() instead.');
        }

        // Initialize service state
        this.clients = new Map(); // Map of WebSocket clients to their subscriptions
        this.subscribedStocks = new Map(); // Map of stock symbols to subscriber count
        this.subscriptionIntervals = new Map(); // Map of stock symbols to their update intervals
        this.stockData = new Map(); // Cache for stock data
        this.lastSent = new Map(); // Map<client, Map<symbol, Map<type, lastValue>>>
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        console.log('Initializing SubscriptionService...');
        
        try {
            // Test Yahoo Finance API
            console.log('Testing Yahoo Finance API...');
            const testQuote = await yahooFinance.quote('ABCAPITAL.BO');
            // console.log('Yahoo Finance API test successful:', testQuote);
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize Yahoo Finance API:', error);
            throw error;
        }
    }

    initializeClient(client) {
        if (!this.clients.has(client)) {
            this.clients.set(client, {
                symbols: new Set(),
                dataTypes: new Map()
            });
        }
    }

    subscribe(client, symbols, dataType) {
        console.log(`Subscribing client to symbols: ${symbols.join(', ')} with type: ${dataType}`);
        
        if (!Array.isArray(symbols) || symbols.length === 0) {
            console.log('Invalid symbols array');
            return new Response(ActionType.STATUS, [], dataType);
        }

        this.initializeClient(client);
        const clientData = this.clients.get(client);
        const newSymbols = [];
        const subscribedSymbols = [];

        for (const symbol of symbols) {
            console.log(`Processing subscription for symbol: ${symbol}`);
            
            // Skip if already subscribed with the same type
            if (clientData.dataTypes.has(symbol) && clientData.dataTypes.get(symbol) === dataType) {
                console.log(`Client already subscribed to ${symbol} with type ${dataType}`);
                subscribedSymbols.push(symbol);
                continue;
            }

            // Check if already subscribed with a different type
            if (clientData.dataTypes.has(symbol)) {
                const existingType = clientData.dataTypes.get(symbol);
                if (existingType !== dataType) {
                    clientData.dataTypes.set(symbol, dataType);
                    console.log(`Client updated subscription type for ${symbol}: ${existingType} -> ${dataType}`);
                    // Send immediate update with new data type
                    this.sendImmediateUpdate(client, symbol, dataType);
                    subscribedSymbols.push(symbol);
                }
                continue;
            }

            // Add new subscription
            clientData.symbols.add(symbol);
            clientData.dataTypes.set(symbol, dataType);
            subscribedSymbols.push(symbol);

            // Update global subscription count
            const count = this.subscribedStocks.get(symbol) || 0;
            if (count === 0) {
                newSymbols.push(symbol);
            }
            this.subscribedStocks.set(symbol, count + 1);
        }

        // Start subscription for new symbols
        if (newSymbols.length > 0) {
            console.log(`Starting new subscriptions for symbols: ${newSymbols.join(', ')}`);
            this.startStockSubscription(newSymbols, dataType);
        }

        return new Response(ActionType.SUBSCRIBED, subscribedSymbols, dataType);
    }

    async sendImmediateUpdate(client, symbol, dataType) {
        try {
            // Add delay before request
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log(`Sending immediate update for ${symbol} with type ${dataType}`);
            const quote = await yahooFinance.quote(symbol);
            if (!quote) {
                console.error(`No quote data received for ${symbol}`);
                return;
            }

            const formattedData = {
                id: quote.symbol,
                exchange: quote.fullExchangeName || 'NSE',
                quoteType: 1,
                price: quote.regularMarketPrice || 0,
                timestamp: quote.regularMarketTime || Date.now(),
                marketHours: quote.marketState === 'REGULAR' ? 1 : 0,
                changePercent: quote.regularMarketChangePercent || 0,
                dayVolume: quote.regularMarketVolume || 0,
                change: quote.regularMarketChange || 0,
                priceHint: 2
            };

            if (client.readyState === 1) {
                console.log(`Sending response for ${symbol}:`, formattedData);
                client.send(JSON.stringify(formattedData));
            } else {
                console.error(`Client not ready for ${symbol}, state: ${client.readyState}`);
            }
        } catch (error) {
            console.error(`Error sending immediate update for ${symbol}:`, error);
            if (error.message.includes('Too Many Requests')) {
                // Retry after delay if rate limited
                setTimeout(async () => {
                    try {
                        const quote = await yahooFinance.quote(symbol);
                        if (quote && client.readyState === 1) {
                            const formattedData = {
                                id: quote.symbol,
                                exchange: quote.fullExchangeName || 'NSE',
                                quoteType: 1,
                                price: quote.regularMarketPrice || 0,
                                timestamp: quote.regularMarketTime || Date.now(),
                                marketHours: quote.marketState === 'REGULAR' ? 1 : 0,
                                changePercent: quote.regularMarketChangePercent || 0,
                                dayVolume: quote.regularMarketVolume || 0,
                                change: quote.regularMarketChange || 0,
                                priceHint: 2
                            };
                            client.send(JSON.stringify(formattedData));
                        }
                    } catch (retryError) {
                        console.error(`Error in retry for ${symbol}:`, retryError);
                    }
                }, 5000);
            }
        }
    }

    formatTickerData(quote, dataType) {
        try {
            switch (dataType) {
                case TickerType.LTP:
                    return {
                        price: quote.regularMarketPrice,
                        change: quote.regularMarketChange,
                        changePercent: quote.regularMarketChangePercent,
                        currency: quote.currency
                    };
                case TickerType.OHLC:
                    return {
                        open: quote.regularMarketOpen,
                        high: quote.regularMarketDayHigh,
                        low: quote.regularMarketDayLow,
                        close: quote.regularMarketPrice
                    };
                case TickerType.FULL:
                    return quote;
                default:
                    console.error(`Unknown data type: ${dataType}`);
                    return null;
            }
        } catch (error) {
            console.error(`Error formatting data for type ${dataType}:`, error);
            return null;
        }
    }

    unsubscribe(client, symbols) {
        console.log(`Unsubscribing client from symbols: ${symbols.join(', ')}`);
        
        if (!this.clients.has(client)) {
            console.log('Client not found');
            return new Response(ActionType.UNSUBSCRIBED, symbols);
        }

        if (!Array.isArray(symbols) || symbols.length === 0) {
            console.log('Invalid symbols array');
            return new Response(ActionType.STATUS, [], null);
        }

        const clientData = this.clients.get(client);
        const unsubscribedSymbols = [];
        const stocksToUnsubscribe = [];

        for (const symbol of symbols) {
            console.log(`Processing unsubscription for symbol: ${symbol}`);
            if (clientData.symbols.has(symbol)) {
                clientData.symbols.delete(symbol);
                clientData.dataTypes.delete(symbol);
                unsubscribedSymbols.push(symbol);

                const count = this.subscribedStocks.get(symbol) - 1;
                if (count <= 0) {
                    this.subscribedStocks.delete(symbol);
                    stocksToUnsubscribe.push(symbol);
                } else {
                    this.subscribedStocks.set(symbol, count);
                }
            }
        }

        if (clientData.symbols.size === 0) {
            console.log('Client has no more subscriptions, removing client');
            this.clients.delete(client);
        }

        if (stocksToUnsubscribe.length > 0) {
            console.log(`Stopping subscriptions for symbols: ${stocksToUnsubscribe.join(', ')}`);
            this.stopStockSubscription(stocksToUnsubscribe);
        }

        return new Response(ActionType.UNSUBSCRIBED, unsubscribedSymbols);
    }

    startStockSubscription(symbols, dataType) {
        for (const symbol of symbols) {
            if (!this.subscriptionIntervals.has(symbol)) {
                console.log(`Starting interval for ${symbol}`);
                const interval = setInterval(async () => {
                    try {
                        // Add delay between requests to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        console.log(`Fetching data for ${symbol}...`);
                        const quote = await yahooFinance.quote(symbol);
                        if (!quote) {
                            console.error(`No quote data received for ${symbol}`);
                            return;
                        }
                        this.stockData.set(symbol, quote);
                        this.broadcastUpdate(symbol, quote);
                    } catch (error) {
                        console.error(`Error fetching data for ${symbol}:`, error);
                        // If we hit rate limit, increase the delay
                        if (error.message.includes('Too Many Requests')) {
                            console.log('Rate limit hit, increasing delay...');
                            clearInterval(this.subscriptionIntervals.get(symbol));
                            this.subscriptionIntervals.set(symbol, 
                                setInterval(async () => {
                                    try {
                                        await new Promise(resolve => setTimeout(resolve, 5000));
                                        const quote = await yahooFinance.quote(symbol);
                                        if (quote) {
                                            this.stockData.set(symbol, quote);
                                            this.broadcastUpdate(symbol, quote);
                                        }
                                    } catch (err) {
                                        console.error(`Error in delayed fetch for ${symbol}:`, err);
                                    }
                                }, 10000) // Increase interval to 10 seconds
                            );
                        }
                    }
                }, 5000); // Increase base interval to 5 seconds

                this.subscriptionIntervals.set(symbol, interval);
            }
        }
    }

    broadcastUpdate(symbol, quote) {
        if (!quote) {
            console.error(`No quote data for ${symbol}`);
            return;
        }

        const formattedData = {
            id: quote.symbol,
            exchange: quote.fullExchangeName || 'NSE',
            quoteType: 1, // 1 for equity
            price: quote.regularMarketPrice || 0,
            timestamp: quote.regularMarketTime || Date.now(),
            marketHours: quote.marketState === 'REGULAR' ? 1 : 0,
            changePercent: quote.regularMarketChangePercent || 0,
            dayVolume: quote.regularMarketVolume || 0,
            change: quote.regularMarketChange || 0,
            priceHint: 2 // Default to 2 decimal places
        };

        for (const [client, clientData] of this.clients.entries()) {
            if (clientData.symbols.has(symbol) && client.readyState === 1) {
                try {
                    client.send(JSON.stringify(formattedData));
                } catch (error) {
                    console.error(`Error broadcasting update for ${symbol}:`, error);
                }
            }
        }
    }

    removeClient(client) {
        console.log('Removing client');
        if (this.clients.has(client)) {
            const clientData = this.clients.get(client);
            for (const symbol of clientData.symbols) {
                const count = this.subscribedStocks.get(symbol) - 1;
                if (count <= 0) {
                    this.subscribedStocks.delete(symbol);
                    this.stopStockSubscription([symbol]);
                } else {
                    this.subscribedStocks.set(symbol, count);
                }
            }
            this.clients.delete(client);
        }
    }

    stopStockSubscription(symbols) {
        for (const symbol of symbols) {
            const interval = this.subscriptionIntervals.get(symbol);
            if (interval) {
                console.log(`Stopping interval for ${symbol}`);
                clearInterval(interval);
                this.subscriptionIntervals.delete(symbol);
                this.stockData.delete(symbol);
            }
        }
    }
}

module.exports = SubscriptionService.getInstance(); 