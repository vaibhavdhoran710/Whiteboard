import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.get('/', (req, res) => {
  res.send("Whiteboard server is running");
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('draw', (data) => {
    socket.to(data.roomId).emit('draw', data);
  });

  socket.on('clear-canvas', (roomId) => {
    socket.to(roomId).emit('clear-canvas');
  });

  socket.on('cursor-move', (data) => {
    socket.to(data.roomId).emit('cursor-move', data);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
