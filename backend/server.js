import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Room from './models/Room.js';

const MONGO_URI = 'mongodb://127.0.0.1:27017/whiteboardDB';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const rooms = {};

app.get('/', (req, res) => {
  res.send('Whiteboard Backend is Running');
});

app.post('/api/rooms/join', (req, res) => {
  const { roomId } = req.body;
  const id = roomId || uuidv4();
  if (!rooms[id]) {
    rooms[id] = { users: [] };
  }
  res.json({ roomId: id });
});

app.get('/api/rooms/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findOne({ roomId });
    if (room) {
      res.json({ exists: true, users: rooms[roomId]?.users || [], room });
    } else {
      res.status(404).json({ exists: false });
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

io.on('connection', (socket) => {
  socket.on('join-room', async ({ roomId, userId }) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = { users: [] };
    }
    rooms[roomId].users.push(userId);
    socket.to(roomId).emit('user-joined', { userId });

    try {
      const room = await Room.findOne({ roomId });
      if (room?.drawingData?.length) {
        socket.emit('load-drawing', room.drawingData);
      }
    } catch (error) {
      console.error('Error loading drawing data:', error);
    }
  });

  socket.on('cursor-move', (data) => {
    socket.to(data.roomId).emit('cursor-move', data);
  });

  socket.on('draw-start', (data) => {
    socket.to(data.roomId).emit('draw-start', data);
  });

  socket.on('draw-move', async ({ roomId, stroke }) => {
    socket.to(roomId).emit('draw-move', { userId: socket.id, stroke });

    try {
      await Room.findOneAndUpdate(
        { roomId },
        {
          $push: {
            drawingData: {
              type: 'stroke',
              data: stroke,
              timestamp: new Date()
            }
          },
          $set: { lastActivity: new Date() }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error saving stroke:', error);
    }
  });

  socket.on('draw-end', (data) => {
    socket.to(data.roomId).emit('draw-end', data);
  });

  socket.on('clear-canvas', async (roomId) => {
    socket.to(roomId).emit('clear-canvas');

    try {
      await Room.findOneAndUpdate(
        { roomId },
        {
          $push: {
            drawingData: {
              type: 'clear',
              data: {},
              timestamp: new Date()
            }
          },
          $set: { lastActivity: new Date() }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error clearing canvas:', error);
    }
  });

  socket.on('leave-room', ({ roomId, userId }) => {
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId].users = rooms[roomId].users.filter(id => id !== userId);
    }
    socket.to(roomId).emit('user-left', { userId });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
