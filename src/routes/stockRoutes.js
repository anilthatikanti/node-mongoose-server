const express = require('express');
const router = express.Router();
const { getStockHistory, getNifty50,searchStock} = require('../controllers/stockController');
const firebaseAuthMiddleware = require('../middlewares/firebaseMiddleware');

// Get stock history (public endpoint)
router.get('/history', getStockHistory);

// Get Nifty 50 data (protected endpoint)
router.get('/nifty50', getNifty50);
router.get('/search', searchStock);

module.exports = router; 