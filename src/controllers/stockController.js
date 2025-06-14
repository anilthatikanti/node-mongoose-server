const yahooFinance = require("yahoo-finance2").default;
const { admin } = require("../../admin-setup/firebase-initialize");

// Cache for date calculations
const dateCache = new Map();

// Optimized date conversion function with caching
const getDateRange = (period) => {
  const cacheKey = `${period}_${new Date().toISOString().split("T")[0]}`;
  if (dateCache.has(cacheKey)) {
    return dateCache.get(cacheKey);
  }

  const now = new Date();
  let from;

  const value = parseInt(period.slice(0, -1));
  const unit = period.slice(-1).toLowerCase();

  switch (unit) {
    case "d":
      from = new Date(now.setDate(now.getDate() - value));
      break;
    case "w":
      from = new Date(now.setDate(now.getDate() - value * 7));
      break;
    case "m":
      from = new Date(now.setMonth(now.getMonth() - value));
      break;
    case "y":
      from = new Date(now.setFullYear(now.getFullYear() - value));
      break;
    default:
      // Default to 1 day if invalid period
      from = new Date(now.setDate(now.getDate() - 1));
  }

  dateCache.set(cacheKey, from);
  return from;
};

// Pre-define the data structure keys to avoid object creation in the loop
const DATA_KEYS = {
  DATETIME: "Datetime",
  OPEN: "Open",
  HIGH: "High",
  LOW: "Low",
  CLOSE: "Close",
  VOLUME: "Volume",
  DIVIDENDS: "Dividends",
  STOCK_SPLITS: "Stock Splits",
};

const getStockHistory = async (req, res) => {
  try {
    const { symbol, period = "1d", interval = "1m" } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: "Symbol is required" });
    }

    // Get date range based on period
    const from = getDateRange(period);

    // Get stock data from Yahoo Finance using chart()
    const quote = await yahooFinance.chart(symbol, {
      period1: from,
      period2: new Date(),
      interval,
    });

    // Optimize data transformation
    const formattedData = quote.quotes.reduce((acc, item) => {
      if (
        item.open != null &&
        item.high != null &&
        item.low != null &&
        item.close != null &&
        item.volume != null
      ) {
        acc.push({
          [DATA_KEYS.DATETIME]: item.date.toISOString(),
          [DATA_KEYS.OPEN]: item.open,
          [DATA_KEYS.HIGH]: item.high,
          [DATA_KEYS.LOW]: item.low,
          [DATA_KEYS.CLOSE]: item.close,
          [DATA_KEYS.VOLUME]: item.volume,
          [DATA_KEYS.DIVIDENDS]: item.dividends || 0,
          [DATA_KEYS.STOCK_SPLITS]: item.stockSplits || 0,
        });
      }
      return acc;
    }, []);

    res.status(200).json({
      status: "success",
      payload: formattedData,
      message: "Stock history fetched successfully",
    });
  } catch (error) {
    console.error("Error in getStockHistory:", error);
    res.status(500).json({ error: error.message });
  }
};

const getNifty50 = async (req, res) => {
  try {
    // Nifty 50 symbols
    const nifty50Symbols = [
      "ADANIENT.NS",
      "ADANIPORTS.NS",
      "APOLLOHOSP.NS",
      "ASIANPAINT.NS",
      "AXISBANK.NS",
      "BAJAJ-AUTO.NS",
      "BAJFINANCE.NS",
      "BAJAJFINSV.NS",
      "BEL.NS",
      "BHARTIARTL.NS",
      "BPCL.NS",
      "BRITANNIA.NS",
      "CIPLA.NS",
      "COALINDIA.NS",
      "DRREDDY.NS",
      "EICHERMOT.NS",
      "GRASIM.NS",
      "HCLTECH.NS",
      "HDFCBANK.NS",
      "HDFCLIFE.NS",
      "HEROMOTOCO.NS",
      "HINDALCO.NS",
      "HINDUNILVR.NS",
      "ICICIBANK.NS",
      "INDUSINDBK.NS",
      "INFY.NS",
      "IOC.NS",
      "ITC.NS",
      "JSWSTEEL.NS",
      "KOTAKBANK.NS",
      "LT.NS",
      "M&M.NS",
      "MARUTI.NS",
      "NESTLEIND.NS",
      "NTPC.NS",
      "ONGC.NS",
      "POWERGRID.NS",
      "RELIANCE.NS",
      "SBIN.NS",
      "SBILIFE.NS",
      "SHRIRAMFIN.NS",
      "SUNPHARMA.NS",
      "TATACONSUM.NS",
      "TATAMOTORS.NS",
      "TATASTEEL.NS",
      "TCS.NS",
      "TECHM.NS",
      "TITAN.NS",
      "ULTRACEMCO.NS",
      "WIPRO.NS",
    ];

    const niftyData = [];

    // Fetch data for each symbol
    for (const symbol of nifty50Symbols) {
      try {
        const quote = await yahooFinance.quote(symbol);
        niftyData.push({
          symbol: quote.symbol,
          name: quote.longName,
          current_price: quote.regularMarketPrice,
          market_cap: quote.marketCap,
          sector: quote.sector,
          industry: quote.industry,
          ohlc: {
            Datetime: new Date().toISOString(),
            Open: quote.regularMarketOpen || 0,
            High: quote.regularMarketDayHigh || 0,
            Low: quote.regularMarketDayLow || 0,
            Close: quote.regularMarketPrice || 0,
            Volume: quote.regularMarketVolume || 0,
            Dividends: quote.dividendRate || 0,
            "Stock Splits": quote.sharesOutstanding
              ? quote.sharesOutstanding / quote.sharesOutstanding
              : 0,
          },
        });
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        continue;
      }
    }

    res.status(200).json({
      status: "success",
      payload: niftyData,
      message: "Nifty 50 data fetched successfully",
    });
  } catch (error) {
    console.error("Error in getNifty50:", error);
    res.status(500).json({ error: error.message });
  }
};
const searchStock = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Query is required" });
    }

    const result = await yahooFinance.search(q);

    res.status(200).json({
      status: "success",
      payload: result,
      message: "Search results fetched successfully",
    });
  } catch (error) {
    console.error("Error in searchStock:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStockHistory,
  getNifty50,
  searchStock,
};
