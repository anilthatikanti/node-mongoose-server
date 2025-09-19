const { getWatchListModel } = require("../models/stockModel");
const { Types } = require("mongoose");

const initializeWatchLists = async (WatchListModel) => {
  if (!WatchListModel) {
    throw new Error("WatchListModel is required for initialization.");
  }
  try {
    const count = await WatchListModel.countDocuments();
    if (count > 0) {
      console.log("📂 WatchLists already initialized. Skipping creation.");
      return;
    }

    const defaultWatchlists = Array.from({ length: 6 }, (_, i) => ({
      watchListName: `Watchlist_${i + 1}`,
      stocks: [],
    }));

    const result = await WatchListModel.insertMany(defaultWatchlists);
    console.log("✅ 6 default watchlists created.");
    return result;
  } catch (error) {
    console.error("❌ Failed to initialize WatchList:", error);
    throw error;
  }
};

const addStockToWatchList = async (req) => {
  try {
    const { watchListId, stockSymbol, longName } = req.body;
    const WatchListModel = getWatchListModel(req.userDbConnection);
    const result = await WatchListModel.updateOne(
      { _id: watchListId },
      { $addToSet: { stocks: { symbol: stockSymbol, longName } } }, // ensures uniqueness
      { upsert: false } // upsert not needed since watchlist already exists
    );

    if (result.modifiedCount > 0) {
      console.log(
        ` Stock '${stockSymbol}' added to watchlist '${watchListId}'.`
      );
      return true;
    } else {
      console.log(
        ` Stock '${stockSymbol}' already exists in watchlist '${watchListId}'.`
      );
      return false;
    }
  } catch (error) {
    console.error(
      ` Failed to add stock '${stockSymbol}' to watchlist '${watchListId}':`,
      error
    );
    throw error;
  }
};

const deleteStockFromWatchList = async (req) => {
  try {
    const { watchListId, stockSymbol } = req.body;
    const watchListModel = getWatchListModel(req.userDbConnection);
    if (!watchListId || !stockSymbol) {
      throw new Error("Watchlist ID and stock symbol are required.");
    }
    const result = await watchListModel.updateOne(
      { _id: watchListId },
      { $pull: { stocks: { symbol: stockSymbol } } } // removes the stock from the array
    );

    if (result.modifiedCount > 0) {
      console.log(
        ` Stock '${stockSymbol}' removed from watchlist '${watchListId}'.`
      );
      return true;
    } else {
      console.log(
        ` Stock '${stockSymbol}' not found in watchlist '${watchListId}'.`
      );
      throw new Error("Stock not found in watchlist");
    }
  } catch (error) {
    console.error(
      ` Failed to remove stock '${stockSymbol}' from watchlist '${watchListId}':`,
      error
    );
    throw error;
  }
};

const updateWatchList = async (req) => {
  try {
    const { watchListId, name } = req.body;
    console.log("newName", name);
    const watchListModel = getWatchListModel(req.userDbConnection);
    const result = await watchListModel.updateOne(
      { _id: watchListId },
      { $set: { watchListName: name } },
      { upsert: false }
    );

    console.log("result", result);
    if (result.matchedCount > 0) {
      console.log(`Watchlist '${watchListId}' renamed to '${name}'.`);
      return true;
    } else {
      console.log(`Watchlist '${watchListId}' not found.`);
      throw new Error("Watchlist not found");
    }
  } catch (error) {
    throw error;
  }
};

const createWatchList = async (req) => {
  try {
    const { name } = req.body;
    const watchListModel = getWatchListModel(req.userDbConnection);
    const newWatchList = new watchListModel({
      watchListName: name,
      stocks: [],
    });
    const result = await newWatchList.save();
    console.log(`Watchlist '${name}' created with ID '${result._id}'.`);
    return result;
  } catch (error) {
    console.error("Failed to create watchlist:", error);
    throw error;
  }
};

const deleteWatchList = async (req) => {
  try {
    const { watchListId } = req.body;
    const watchListModel = getWatchListModel(req.userDbConnection);
    if (!Types.ObjectId.isValid(watchListId)) {
      throw new Error("Invalid watchlist ID.");
    }
    const result = await watchListModel.deleteOne({ _id: watchListId });
    if (result.deletedCount > 0) {
      console.log(`Watchlist '${watchListId}' deleted successfully.`);
      return true;
    } else {
      console.log(`Watchlist '${watchListId}' not found.`);
      throw new Error("Watchlist not found");
    }
  } catch (error) {
    console.error("Failed to delete watchlist:", error);
    throw error;
  }
};

const getWatchLists = async (req) => {
  try {
    const watchListModel = getWatchListModel(req.userDbConnection);
    const watchLists = await watchListModel.find({});
    if (!watchLists || watchLists.length === 0) {
      return [];
    }
    return watchLists;
  } catch (error) {
    console.error("Failed to fetch watchlists:", error);
    throw error;
  }
};

module.exports = {
  initializeWatchLists,
  addStockToWatchList,
  deleteStockFromWatchList,
  getWatchLists,
  updateWatchList,
  createWatchList,
  deleteWatchList,
};
