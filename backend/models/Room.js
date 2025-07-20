import mongoose from 'mongoose';

const drawingCommandSchema = new mongoose.Schema({
  type: { type: String, required: true }, 
  data: { type: Object, required: true }, 
  timestamp: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  drawingData: [drawingCommandSchema]
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
