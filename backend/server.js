import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { handleSocketServer } from './socket.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { cleanCache } from './services/cacheService/cacheService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = 3000;
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

cleanCache();

const socketServer = new Server(server, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"]
    }
});

app.get("/", (req, res) => {
    res.sendFile(`${__dirname}/serve/index.html`);
});

handleSocketServer(socketServer);

server.listen(PORT, () => {
    console.log(`Server and WebSocket server started on port ${PORT}`);
});
