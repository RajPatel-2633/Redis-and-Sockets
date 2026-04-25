"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const ioredis_1 = __importDefault(require("ioredis"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 8080;
const redis = new ioredis_1.default();
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
app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
//# sourceMappingURL=index.js.map