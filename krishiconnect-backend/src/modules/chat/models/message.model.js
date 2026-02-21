const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: ['text', 'image', 'voice', 'file'],
      required: true,
    },
    content: {
      text: String,
      media: {
        url: String,
        publicId: String,
        fileName: String,
        fileSize: Number,
        mimeType: String,
      },
    },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },

    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: Date,
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);
