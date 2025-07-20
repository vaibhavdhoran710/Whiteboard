const mongoose = require('mongoose')

const drawingCommandSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['stroke', 'clear'],
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

module.exports = drawingCommandSchema
