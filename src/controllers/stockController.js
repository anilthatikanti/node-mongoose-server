const yahooFinance = require("yahoo-finance2").default;
const WatchListService = require("../services/stockService");
const path = require("path");
const env = require("dotenv");
env.config({ path: path.join(__dirname, "../../.env") });

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
      status: true,
      payload: result,
      message: "Search results fetched successfully",
    });
  } catch (error) {
    console.error("Error in searchStock:", error);
    res.status(500).json({ status: false, error: error.message });
  }
};
const addStockToWatchListController = async (req, res) => {
  const { watchListId, stockSymbol, longName } = req.body;
  try {
    if (!watchListId || !stockSymbol || !longName) {
      return res.status(400).json({
        success: false,
        error: "Watchlist ID and stock symbol or name are required",
      });
    }
    const result = await WatchListService.addStockToWatchListService(req);

    res.status(200).json({
      status: true,
      payload: result,
      message: "Stock added to watchlist successfully",
    });
  } catch (error) {
    console.error("Error in addStockToWatchList:", error);
    res.status(500).json({ status: false, error: error.message });
  }
};

const deleteStockFromWatchListController = async (req, res) => {
  const { watchListId, stockSymbol } = req.body;
  try {
    if (!watchListId || !stockSymbol) {
      return res.status(400).json({
        status: false,
        error: "Watchlist ID and stock symbol are required",
      });
    }
    const result = await WatchListService.deleteStockFromWatchListService(req);

    res.status(200).json({
      status: true,
      payload: result,
      message: "Stock deleted from watchlist successfully",
    });
  } catch (error) {
    console.error("Error in deleteStockFromWatchList:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateWatchListController = async (req, res) => {
  const { watchListId, name } = req.body;
  try {
    if (!watchListId || !name) {
      return res.status(400).json({
        success: false,
        error: "Watchlist ID and name are required",
      });
    }
    const result = await WatchListService.updateWatchListService(req);

    res.status(200).json({
      status: true,
      payload: result,
      message: "Watchlist updated successfully",
    });
  } catch (error) {
    console.error("Error in updateWatchList:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getWatchListsController = async (req, res) => {
  try {
    const watchLists = await WatchListService.getWatchListsService(req);

    res.status(200).json({
      status: true,
      payload: watchLists,
      message: "Watchlists fetched successfully",
    });
  } catch (error) {
    console.error("Error in getWatchLists:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getNewsController = async (req, res) => {
  try {
    const newsResponse = await fetch(
      // Renamed 'news' to 'newsResponse' for clarity
      `https://newsdata.io/api/1/news?apikey=${process.env.NEWS_API_KEY}&language=en&category=business`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );
    if (!newsResponse.ok) {
      const errorText = await newsResponse.text(); // Get detailed error message from API if available
      console.error(
        `NewsData.io API error! Status: ${newsResponse.status}. Details: ${errorText}`
      );
      throw new Error(
        `Failed to fetch news from NewsData.io: ${newsResponse.statusText}.`
      );
    }

    // Parse the JSON body of the response
    const newsData = await newsResponse.json();
    if (
      !newsData.results ||
      !Array.isArray(newsData.results) ||
      newsData.results.length === 0
    ) {
      // You can choose to send an empty array or a specific message if no results
      return res.status(200).json({
        status: true,
        payload: [],
        message: "No news found matching criteria.",
      });
    }

    res.status(200).json({
      status: true,
      payload: newsData.results // Use newsData.results here
        .filter(
          (item) =>
            item.image_url !== null &&
            item.image_url !== "" &&
            item.description !== null &&
            item.description !== ""
        )
        .map((item) => ({
          title: item.title,
          link: item.link,
          description: item.description,
          source_name: item.source_name,
          source_icon: item.source_icon,
          image_url: item.image_url,
          pubDate: item.pubDate,
        })),
      message: "News fetched successfully",
    });
  } catch (error) {
    console.error("Error in getNewsController:", error);
    // Send a more user-friendly error message, while logging the full error
    res
      .status(500)
      .json({ error: error.message || "An unexpected error occurred." });
  }
};

const createWatchListController = async (req, res) => {
  const { name } = req.body;
  try {
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Watchlist name is required",
      });
    }
    const result = await WatchListService.createWatchListService(req);

    res.status(200).json({
      status: true,
      payload: result,
      message: "Watchlist created successfully",
    });
  } catch (error) {
    console.error("Error in createWatchList:", error);
    res.status(500).json({ status: false, error: error.message });
  }
};

const deleteWatchListController = async (req, res) => {
  const { watchListId } = req.body;
  try {
    if (!watchListId) {
      return res.status(400).json({
        success: false,
        error: "Watchlist ID is required",
      });
    }
    const result = await WatchListService.deleteWatchListService(req);

    res.status(200).json({
      status: true,
      payload: result,
      message: "Watchlist deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteWatchList:", error);
    res.status(500).json({ status: false, error: error.message });
  }
};

module.exports = {
  getStockHistory,
  getNifty50,
  searchStock,
  getWatchListsController,
  addStockToWatchListController,
  deleteStockFromWatchListController,
  getNewsController,
  updateWatchListController,
  createWatchListController,
  deleteWatchListController,
};
