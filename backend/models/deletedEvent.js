const mongoose = require('mongoose');

const DeletedEventSchema = new mongoose.Schema({
  originalEventId: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  date: String,
  location: String,
  branch: String,
  createdBy: String,
  deletedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DeletedEvent', DeletedEventSchema);
