require('dotenv').config();
const { server } = require('./app');
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log('📡 WebSocket server is ready for connections');
});
