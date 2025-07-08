const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  file_id: {
    type: String,
    required: true,
    unique: true
  },
  file_name: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['document', 'video', 'audio'],
    required: true
  },
  file_size: {
    type: Number,
    default: 0
  },
  mime_type: {
    type: String,
    default: ''
  },
  channel_id: {
    type: String,
    required: true
  },
  message_id: {
    type: Number,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

fileSchema.index({ 
  file_name: 'text', 
  caption: 'text' 
});

fileSchema.index({ type: 1, created_at: -1 });

module.exports = mongoose.model('File', fileSchema);