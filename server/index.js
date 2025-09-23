const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Import routes
const channelRoutes = require('./routes/channels');
const messageRoutes = require('./routes/messages');
const subscriptionRoutes = require('./routes/subscriptions');
const userRoutes = require('./routes/users');

// Set io for message routes to avoid circular dependency
messageRoutes.setIO(io);

// Health check and AWS debug routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/aws-debug', async (req, res) => {
  const sqsService = require('./services/sqsService');
  const dataService = require('./services/dataService');
  
  const connectionTest = await sqsService.testConnection();
  
  // Get all channels and their queue info
  const channels = dataService.getAllChannels();
  const queueInfo = [];
  
  for (const channel of channels) {
    if (channel.queueUrl) {
      try {
        const queueStats = await sqsService.getQueueAttributes(channel.queueUrl);
        queueInfo.push({
          channelId: channel.id,
          channelName: channel.name,
          queueUrl: channel.queueUrl,
          messagesAvailable: queueStats.ApproximateNumberOfMessages || '0',
          messagesInFlight: queueStats.ApproximateNumberOfMessagesNotVisible || '0'
        });
      } catch (error) {
        queueInfo.push({
          channelId: channel.id,
          channelName: channel.name,
          queueUrl: channel.queueUrl,
          error: error.message
        });
      }
    }
  }
  
  res.json({
    aws_credentials: {
      access_key: process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Missing',
      secret_key: process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Missing',
      region: process.env.AWS_REGION || 'us-east-1'
    },
    sqs_connection: connectionTest,
    queue_info: queueInfo
  });
});

// Admin/Debug route untuk clear semua data
app.delete('/admin/clear-all', (req, res) => {
  const dataService = require('./services/dataService');
  
  try {
    // Clear all data from memory
    dataService.channels.clear();
    dataService.messages.clear();
    dataService.subscriptions.clear();
    dataService.users.clear();
    
    console.log('🗑️ All data cleared from memory');
    
    res.json({
      success: true,
      message: 'All data cleared successfully',
      cleared: {
        channels: 'cleared',
        messages: 'cleared',
        subscriptions: 'cleared',
        users: 'cleared'
      }
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Routes
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/users', userRoutes);


// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join-channel', (channelId) => {
    socket.join(channelId);
    console.log(`Client ${socket.id} joined channel: ${channelId}`);
  });
  
  socket.on('leave-channel', (channelId) => {
    socket.leave(channelId);
    console.log(`Client ${socket.id} left channel: ${channelId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export io for use in other modules
module.exports = { app, io };
