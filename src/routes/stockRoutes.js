const express = require("express");
const router = express.Router();
const {
  getStockHistory,
  getNewsController,
  updateWatchListController,
  getNifty50,
  getWatchListsController,
  searchStock,
  addStockToWatchListController,
  deleteStockFromWatchListController,
  createWatchListController,
  deleteWatchListController,
} = require("../controllers/stockController");

// Get stock history (public endpoint)
router.get("/history", getStockHistory);

// Get Nifty 50 data (protected endpoint)
router.get("/nifty50", getNifty50);
router.get("/search", searchStock);
router.get("/get-news", getNewsController);
router.get("/get-watchlist", getWatchListsController);
router.patch("/add-stock-watchlist", addStockToWatchListController);
router.patch("/del-stock-watchlist", deleteStockFromWatchListController);
router.patch("/update-watchlistName", updateWatchListController);
router.post("/create-watchList", createWatchListController);
router.delete("/delete-watchList", deleteWatchListController);

module.exports = router;
