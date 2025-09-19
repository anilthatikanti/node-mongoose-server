const watchListRepository = require("../repositories/stockRepository");
async function addStockToWatchListService(req) {
  try {
    const result = await watchListRepository.addStockToWatchList(req);
    return result;
  } catch (err) {
    console.error("Failed to add the stock:", err);
    throw err;
  }
}

async function deleteStockFromWatchListService(req) {
  try {
    const result = await watchListRepository.deleteStockFromWatchList(req);
    return result;
  } catch (err) {
    console.error("Failed to delete the stock:", err);
    throw err;
  }
}
async function getWatchListsService(req) {
  try {
    const watchLists = await watchListRepository.getWatchLists(req);
    return watchLists;
  } catch (err) {
    console.error("Failed to fetch watchlists:", err);
    throw err;
  }
}
async function updateWatchListService(req) {
  try {
    const result = await watchListRepository.updateWatchList(req);
    return result;
  } catch (err) {
    console.error("Failed to update the watchlist:", err);
    throw err;
  }
}

async function createWatchListService(req) {
  try {
    const result = await watchListRepository.createWatchList(req);
    return result;
  } catch (err) {
    console.error("Failed to create the watchlist:", err);
    throw err;
  }
}

async function deleteWatchListService(req) {
  try {
    const result = await watchListRepository.deleteWatchList(req);
    return result;
  } catch (err) {
    console.error("Failed to delete the watchlist:", err);
    throw err;
  }
}

module.exports = {
  addStockToWatchListService,
  deleteStockFromWatchListService,
  getWatchListsService,
  updateWatchListService,
  createWatchListService,
  deleteWatchListService,
};
