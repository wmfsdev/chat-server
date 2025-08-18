import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors'

const app = express();
const server = createServer(app);

app.use(cors())

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173'
    }
});


export { app, io, server };