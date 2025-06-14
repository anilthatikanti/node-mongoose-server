const express = require('express');
const router = express.Router();
const { getStockHistory,getNewsController, getNifty50,getWatchListsController,searchStock,addStockToWatchListController,deleteStockFromWatchListController} = require('../controllers/stockController');

// Get stock history (public endpoint)
router.get('/history', getStockHistory);

// Get Nifty 50 data (protected endpoint)
router.get('/nifty50', getNifty50);
router.get('/search', searchStock);
router.get('/get-news', getNewsController);
router.get('/get-watchlist', getWatchListsController);
router.patch('/add-watchlist', addStockToWatchListController);
router.patch('/del-watchlist', deleteStockFromWatchListController);

module.exports = router; 