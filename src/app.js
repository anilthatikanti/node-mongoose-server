const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const routes = require("./routes/index");
const http = require('http');
const WebSocketController = require('./socket/WebSocketController');
const subscriptionService = require('./services/SubscriptionService');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket
console.log('Initializing WebSocket server...');
new WebSocketController(server);
console.log('WebSocket server initialized');

// Initialize subscription service
console.log('Initializing subscription service...');
subscriptionService.initialize().catch(error => {
    console.error('Failed to initialize subscription service:', error);
    process.exit(1);
});
console.log('Subscription service initialized');

// 🟢 Apply CORS FIRST so it doesn't get blocked by Helmet
app.use(cors({
    origin: 'https://angular-stock.netlify.app', // Adjust to your frontend URL
    // origin: 'http://localhost:4200', // Adjust to your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// 🔒 Apply Helmet AFTER CORS to avoid blocking important headers
app.use(helmet());

// 🚀 API Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests, please try again later." },
    headers: true,
});
app.use(apiLimiter);

// 📡 Middleware
app.use(express.json());

// 🛣 Routes
app.get("/", (req, res) => sendWelcomePage(res));
app.use("/", routes);

// WebSocket health check endpoint
app.get('/ws-health', (req, res) => {
    res.json({
        status: 'ok',
        subscriptions: {
            activeClients: subscriptionService.clients.size,
            activeSymbols: subscriptionService.subscribedStocks.size
        }
    });
});

// 📄 Serve static HTML as a welcome page
function sendWelcomePage(res) {
    const filePath = path.join(__dirname, "html-content/welcome-content.html");
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(500).send("Internal Server Error");
    }
}

// 🔥 Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

module.exports = { app, server };
