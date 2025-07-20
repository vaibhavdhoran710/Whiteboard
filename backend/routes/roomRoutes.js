import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const rooms = {};

router.post('/join', (req, res) => {
  const { roomId } = req.body;
  const id = roomId || uuidv4();
  if (!rooms[id]) {
    rooms[id] = { users: [] };
  }
  res.json({ success: true, roomId: id });
});

router.get('/:roomId', (req, res) => {
  const room = rooms[req.params.roomId];
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({ roomId: req.params.roomId });
});

export default router;
