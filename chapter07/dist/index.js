"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const ioredis_1 = __importDefault(require("ioredis"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)(); // Express Server
// State should be maintained here at the backend to preserve the values even when we refresh
const state = new Array(100).fill(false);
const redis = new ioredis_1.default({ host: 'localhost', port: Number(6379) }); // This is just for reading and writing
const publisher = new ioredis_1.default({ host: 'localhost', port: Number(6379) }); // This is for publishing
const subscriber = new ioredis_1.default({ host: 'localhost', port: Number(6379) }); // This is for subscribing
const httpServer = http_1.default.createServer(app); // HTTP Server, we mounted Express Server on HTTP Server
const io = new socket_io_1.Server(); // Socket Server
io.attach(httpServer); // Now socket server is also running on HTTP Server;
subscriber.subscribe('server:broker');
subscriber.on('message', (channel, message) => {
    const { event, data } = JSON.parse(message);
    state[data.index] = data.value;
    io.emit(event, data); // This is known as relaying
});
io.on('connection', (socket) => {
    console.log("Socket Connected", socket.id);
    // setInterval(()=>{
    //     socket.emit("Hello");
    //     socket.emit("Hello Bhai");
    //     socket.emit("Kaise ho");
    // },2000);
    socket.on('message', (msg) => {
        io.emit('server-message', msg); // Broadcast to all the connected clients;
    });
    socket.on('checkbox-update', async (data) => {
        await publisher.publish('server:broker', JSON.stringify({ event: 'checkbox-update', data }));
        // state[data.index] = data.value;
        // io.emit('checkbox-update',data);
    });
});
const PORT = process.env.PORT ?? 8080;
app.use(express_1.default.static('./public'));
app.use(async function (req, res, next) {
    const key = 'rate-limit';
    const value = await redis.get(key);
    if (value === null) {
        await redis.set(key, 0);
        await redis.expire(key, 60);
    }
    if (Number(value) > 100) {
        return res.status(429).json({ message: "Too many requests" });
    }
    await redis.incr(key);
    next();
});
app.get('/state', (req, res) => {
    return res.json({ state });
});
app.get('/', (req, res) => {
    return res.json({ status: 'success' });
});
app.get('/books', async (req, res) => {
    const response = await axios_1.default.get('https://api.freeapi.app/api/v1/public/books');
    console.log(response);
    return res.json(response.data);
});
app.get('/books/total', async (req, res) => {
    //Check the Cache
    const cachedValue = await redis.get("totalPageValue");
    if (cachedValue) {
        console.log("Cache Hit");
        return res.json({ totalPageCount: Number(cachedValue) });
    }
    console.log("Cache Miss");
    const response = await axios_1.default.get('https://api.freeapi.app/api/v1/public/books');
    const totalPageCount = response?.data?.data?.data?.reduce((acc, curr) => !curr.volumeInfo?.pageCount ? 0 : curr.volumeInfo.pageCount + acc, 0);
    await redis.set("totalPageValue", totalPageCount);
    return res.json({ totalPageCount });
});
httpServer.listen(PORT, () => {
    console.log(`HTTP Server is running on PORT ${PORT}`);
});
//# sourceMappingURL=index.js.map