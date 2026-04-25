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
const httpServer = http_1.default.createServer(app); // HTTP Server, we mounted Express Server on HTTP Server
const io = new socket_io_1.Server(); // Socket Server
io.attach(httpServer); // Now socket server is also running on HTTP Server;
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
});
const PORT = process.env.PORT ?? 8080;
const redis = new ioredis_1.default();
app.use(express_1.default.static('./public'));
app.use(async function (req, res, next) {
    const key = 'rate-limit';
    const value = await redis.get(key);
    if (value === null) {
        await redis.set(key, 0);
        await redis.expire(key, 60);
    }
    if (Number(value) > 10) {
        return res.status(429).json({ message: "Too many requests" });
    }
    await redis.incr(key);
    next();
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