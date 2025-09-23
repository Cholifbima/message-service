const express = require('express');
const router = express.Router();
const sqsService = require('../services/sqsService');
const dataService = require('../services/dataService');

// We'll pass io as parameter to avoid circular dependency
let io = null;

const setIO = (socketIO) => {
  io = socketIO;
};

// Send message to channel (Publisher)
router.post('/send', async (req, res) => {
  try {
    const { channelId, message, senderId } = req.body;
    
    console.log('📨 Message send request:', { channelId, message: message?.substring(0, 50) + '...', senderId });
    
    if (!channelId || !message || !senderId) {
      console.log('❌ Missing required fields:', { channelId: !!channelId, message: !!message, senderId: !!senderId });
      return res.status(400).json({
        success: false,
        error: 'channelId, message, and senderId are required'
      });
    }
    
    const channel = dataService.getChannel(channelId);
    if (!channel) {
      console.log('❌ Channel not found:', channelId);
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }
    
    console.log('✅ Channel found:', { id: channel.id, name: channel.name, hasQueue: !!channel.queueUrl });
    
    let result = null;
    let messageId = null;
    
    // ALWAYS use AWS SQS - no fallback mode
    if (!channel.queueUrl) {
      console.log('❌ Channel has no SQS queue URL:', channelId);
      return res.status(400).json({
        success: false,
        error: 'Channel was not properly configured with AWS SQS. Please recreate the channel.'
      });
    }
    
    try {
      console.log('📤 Sending message to SQS queue:', channel.queueUrl);
      result = await sqsService.publishMessage(
        channel.queueUrl,
        message,
        channelId,
        senderId
      );
      messageId = result.customMessageId;
      console.log(`✅ Message sent to SQS successfully. Message ID: ${messageId}`);
    } catch (sqsError) {
      console.error('💥 Failed to send message to SQS:', sqsError.message);
      return res.status(500).json({
        success: false,
        error: `AWS SQS Error: ${sqsError.message}. Please check your AWS credentials and queue permissions.`
      });
    }
    
    console.log('📝 Saving message to local store with ID:', messageId);
    
    // Save message to local store
    const savedMessage = dataService.saveMessage(
      channelId,
      message,
      senderId,
      messageId
    );
    
    console.log('✅ Message saved:', { id: savedMessage.id, channelId: savedMessage.channelId });
    
    // Emit real-time notification to subscribers
    if (io) {
      console.log('📡 Emitting WebSocket notification to channel:', channelId);
      io.to(channelId).emit('new-message', {
        channelId,
        message: savedMessage
      });
      console.log('✅ WebSocket notification sent');
    } else {
      console.log('❌ WebSocket (io) not available');
    }
    
    const responseData = {
      success: true,
      data: {
        messageId: result?.messageId || messageId,
        customMessageId: messageId,
        message: savedMessage,
        sqsStatus: channel.queueUrl ? (result ? 'sent' : 'failed') : 'no_queue'
      }
    };
    
    console.log('📤 Sending response:', { 
      success: responseData.success, 
      messageId: responseData.data.customMessageId,
      sqsStatus: responseData.data.sqsStatus 
    });
    
    res.json(responseData);
  } catch (error) {
    console.error('💥 Error in message send:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get messages from channel (for display)
router.get('/channel/:channelId', (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50 } = req.query;
    
    const channel = dataService.getChannel(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }
    
    const messages = dataService.getChannelMessages(channelId, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        channelId,
        messages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Poll messages from SQS (Subscriber)
router.post('/poll', async (req, res) => {
  try {
    const { channelId, userId } = req.body;
    
    if (!channelId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'channelId and userId are required'
      });
    }
    
    // Check if user is subscribed to channel
    if (!dataService.isSubscribed(userId, channelId)) {
      return res.status(403).json({
        success: false,
        error: 'User is not subscribed to this channel'
      });
    }
    
    const channel = dataService.getChannel(channelId);
    if (!channel || !channel.queueUrl) {
      return res.status(404).json({
        success: false,
        error: 'Channel or queue not found'
      });
    }
    
    // Poll messages from SQS
    const messages = await sqsService.receiveMessages(channel.queueUrl);
    
    const processedMessages = [];
    
    // Process each message
    for (const sqsMessage of messages) {
      try {
        const messageBody = JSON.parse(sqsMessage.Body);
        processedMessages.push({
          id: messageBody.id,
          content: messageBody.content,
          senderId: messageBody.senderId,
          timestamp: messageBody.timestamp,
          receiptHandle: sqsMessage.ReceiptHandle
        });
      } catch (parseError) {
        console.error('Error parsing message:', parseError);
      }
    }
    
    res.json({
      success: true,
      data: {
        channelId,
        messages: processedMessages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Acknowledge message (delete from queue)
router.post('/ack', async (req, res) => {
  try {
    const { channelId, receiptHandle } = req.body;
    
    if (!channelId || !receiptHandle) {
      return res.status(400).json({
        success: false,
        error: 'channelId and receiptHandle are required'
      });
    }
    
    const channel = dataService.getChannel(channelId);
    if (!channel || !channel.queueUrl) {
      return res.status(404).json({
        success: false,
        error: 'Channel or queue not found'
      });
    }
    
    // Delete message from SQS
    await sqsService.deleteMessage(channel.queueUrl, receiptHandle);
    
    res.json({
      success: true,
      message: 'Message acknowledged and deleted from queue'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Broadcast message to all subscribers of a channel
router.post('/broadcast', async (req, res) => {
  try {
    const { channelId, message, senderId } = req.body;
    
    console.log('📢 Broadcast request:', { channelId, message: message?.substring(0, 50) + '...', senderId });
    
    if (!channelId || !message || !senderId) {
      console.log('❌ Missing required fields for broadcast:', { channelId: !!channelId, message: !!message, senderId: !!senderId });
      return res.status(400).json({
        success: false,
        error: 'channelId, message, and senderId are required'
      });
    }
    
    const channel = dataService.getChannel(channelId);
    if (!channel) {
      console.log('❌ Channel not found for broadcast:', channelId);
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }
    
    console.log('✅ Channel found for broadcast:', { id: channel.id, name: channel.name, hasQueue: !!channel.queueUrl });
    
    const subscribers = dataService.getChannelSubscribers(channelId);
    console.log('👥 Channel subscribers:', subscribers.length);
    
    // ALWAYS use AWS SQS - no fallback mode for broadcast
    if (!channel.queueUrl) {
      console.log('❌ Channel has no SQS queue URL for broadcast:', channelId);
      return res.status(400).json({
        success: false,
        error: 'Channel was not properly configured with AWS SQS. Please recreate the channel.'
      });
    }
    
    let sqsResult = null;
    let messageId = null;
    
    try {
      console.log('📤 Sending broadcast message to SQS queue:', channel.queueUrl);
      sqsResult = await sqsService.publishMessage(
        channel.queueUrl,
        message,
        channelId,
        senderId
      );
      messageId = sqsResult.customMessageId;
      console.log(`✅ Broadcast message sent to SQS successfully. Message ID: ${messageId}`);
    } catch (sqsError) {
      console.error('💥 Failed to send broadcast message to SQS:', sqsError.message);
      return res.status(500).json({
        success: false,
        error: `AWS SQS Error: ${sqsError.message}. Please check your AWS credentials and queue permissions.`
      });
    }
    
    console.log('📝 Saving broadcast message to local store with ID:', messageId);
    
    // Save message locally
    const savedMessage = dataService.saveMessage(
      channelId,
      message,
      senderId,
      messageId
    );
    
    console.log('✅ Broadcast message saved:', { id: savedMessage.id, channelId: savedMessage.channelId });
    
    // Emit to all connected subscribers
    if (io) {
      console.log('📡 Emitting broadcast WebSocket notification to channel:', channelId);
      io.to(channelId).emit('broadcast-message', {
        channelId,
        message: savedMessage,
        subscriberCount: subscribers.length
      });
      console.log('✅ Broadcast WebSocket notification sent to', subscribers.length, 'subscribers');
    } else {
      console.log('❌ WebSocket (io) not available for broadcast');
    }
    
    const responseData = {
      success: true,
      data: {
        message: savedMessage,
        subscriberCount: subscribers.length,
        sqsMessageId: sqsResult.messageId,
        sqsStatus: 'sent'
      }
    };
    
    console.log('📤 Sending broadcast response:', { 
      success: responseData.success, 
      messageId: responseData.data.message.id,
      subscriberCount: responseData.data.subscriberCount,
      sqsStatus: responseData.data.sqsStatus 
    });
    
    res.json(responseData);
  } catch (error) {
    console.error('💥 Error in broadcast message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
module.exports.setIO = setIO;
