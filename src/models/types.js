const TickerType = {
    LTP: 'ltp',    // Last Trade Price
    OHLC: 'ohlc',  // Open, High, Low, Close
    FULL: 'full'   // Full ticker data
};

const ActionType = {
    SUBSCRIBE: 'subscribe',
    UNSUBSCRIBE: 'unsubscribe',
    SUBSCRIBED: 'subscribed',
    UNSUBSCRIBED: 'unsubscribed',
    UPDATE: 'update',
    STATUS: 'status'
};

module.exports = {
    TickerType,
    ActionType
}; 