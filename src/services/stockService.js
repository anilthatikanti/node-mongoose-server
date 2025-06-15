const  watchListRepository = require('../repositories/stockRepository');
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

module.exports = {
  addStockToWatchListService,
  deleteStockFromWatchListService,
  getWatchListsService
};