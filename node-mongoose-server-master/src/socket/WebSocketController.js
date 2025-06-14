const WebSocket = require('ws');
const { Message } = require('../models/messages');
const { ActionType } = require('../models/types');
const subscriptionService = require('../services/SubscriptionService');
const {admin} = require('../../admin-setup/firebase-initialize');
const ism = require('@zero65tech/indian-stock-market');

class WebSocketController {
    constructor(server) {
        console.log('Creating WebSocket server...');
        this.wss = new WebSocket.Server({ server });
        this.setupWebSocket();
        console.log('WebSocket server created and setup complete');
    }

    formatStockData(quote) {
        return {
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
    }

    setupWebSocket() {
        this.wss.on('connection', async (ws, req) => {
            console.log('New client connected');

            // --- JWT Verification ---
            let token = null;
            if (req.headers['sec-websocket-protocol']) {
                token = req.headers['sec-websocket-protocol'];
                if (Array.isArray(token)) token = token[0];
            }
            if (!token) {
                ws.close(4001, 'Token missing or invalid');
                return;
            }

            try {
                const decodedToken = await admin.auth().verifyIdToken(token);
                console.log('decodedToken:', decodedToken);
                ws.user = decodedToken;
                
                // Get the subscription data from the initial message
                const initialMessage = req.url.split('?')[1];
                if (initialMessage) {
                    const params = new URLSearchParams(initialMessage);
                    const symbols = params.get('symbols')?.split(',') || [];
                    const type = params.get('type') || 'ltp';
                    
                    if (symbols.length > 0) {
                        const msg = new Message('subscribe', symbols, type);
                        this.handleMessage(ws, msg);
                    }
                }
            } catch (error) {
                console.error('Error verifying token:', error);
                ws.close(4002, 'Invalid Firebase token');
                return;
            }
            
            // --- End JWT Verification ---

            ws.on('message', (message) => {
                try {
                    if (!ws.user) {
                        ws.send(JSON.stringify({ 
                            action: ActionType.STATUS, 
                            error: 'Not authenticated',
                            type: 'error'
                        }));
                        return;
                    }
                    const data = JSON.parse(message);
                    const msg = Message.fromJSON(data);
                    this.handleMessage(ws, msg);
                } catch (error) {
                    console.error('Error processing message:', error);
                    ws.send(JSON.stringify({
                        action: ActionType.STATUS,
                        error: 'Invalid message format',
                        type: 'error'
                    }));
                }
            });

            ws.on('close', () => {
                console.log('Client disconnected');
                subscriptionService.removeClient(ws);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                subscriptionService.removeClient(ws);
            });
        });
    }

    isMarketOpenIST() {
        const now = new Date();
        const istOffset = 5.5 * 60; // IST is UTC+5:30
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istTime = new Date(utc + (istOffset * 60000));
    
        const hours = istTime.getHours();
        const minutes = istTime.getMinutes();
    
        // Market open after 9:10 AM and before 3:30 PM
        const afterOpen = hours > 9 || (hours === 9 && minutes >= 10);
        const beforeClose = hours < 15 || (hours === 15 && minutes <= 30);
    
        return afterOpen && beforeClose;
    }

    handleMessage(ws, message) {
        // if (ism.isHoliday()||!ism.isOpen()) {
        //     ws.send(JSON.stringify({
        //         action: ActionType.STATUS,
        //         message: ism.isHoliday() ? "Market is closed due to a holiday or weekend. Regular trading will resume on the next business day.": 'Market is closed. Try between 9:10 AM and 3:30 PM IST.',
        //         type: 'closed'
        //     }));
        //     return;
        // }
    
        switch (message.action) {
            case ActionType.SUBSCRIBE:
                if (!Array.isArray(message.variables)) {
                    console.log('Invalid symbols format:', message.variables);
                    ws.send(JSON.stringify({
                        action: ActionType.STATUS,
                        error: 'Invalid symbols format',
                        type: 'error'
                    }));
                    return;
                }
                console.log('Processing subscription for:', message.variables);
                const subscribeResponse = subscriptionService.subscribe(
                    ws,
                    message.variables,
                    message.type
                );
                console.log('Sending subscription response:', subscribeResponse);
                ws.send(JSON.stringify({
                    ...subscribeResponse,
                    message: `Successfully subscribed to ${message.variables.join(', ')}`
                }));
                break;

            case ActionType.UNSUBSCRIBE:
                if (!Array.isArray(message.variables)) {
                    console.log('Invalid symbols format:', message.variables);
                    ws.send(JSON.stringify({
                        action: ActionType.STATUS,
                        error: 'Invalid symbols format',
                        type: 'error'
                    }));
                    return;
                }
                console.log('Processing unsubscription for:', message.variables);
                const unsubscribeResponse = subscriptionService.unsubscribe(
                    ws,
                    message.variables
                );
                console.log('Sending unsubscription response:', unsubscribeResponse);
                ws.send(JSON.stringify(unsubscribeResponse));
                break;

            default:
                console.log('Unknown action:', message.action);
                ws.send(JSON.stringify({
                    action: ActionType.STATUS,
                    error: 'Unknown action',
                    type: 'error'
                }));
        }
    }
}

module.exports = WebSocketController; 