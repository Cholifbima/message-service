const express = require('express');
const router = express.Router();
const sqsService = require('../services/sqsService');
const dataService = require('../services/dataService');

// Get all channels (with filtering)
router.get('/', (req, res) => {
  try {
    const { publisherId, forSubscriber } = req.query;
    
    let channels;
    if (publisherId) {
      // Get channels by specific publisher
      channels = dataService.getChannelsByPublisher(publisherId);
    } else if (forSubscriber === 'true') {
      // Get all public channels for subscribers with publisher info
      channels = dataService.getPublicChannels();
    } else {
      // Get all channels (admin view)
      channels = dataService.getAllChannels();
    }
    
    res.json({
      success: true,
      data: channels,
      total: channels.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific channel
router.get('/:channelId', (req, res) => {
  try {
    const { channelId } = req.params;
    const channel = dataService.getChannel(channelId);
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }
    
    res.json({
      success: true,
      data: channel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new channel
router.post('/', async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;
    
    // Validation
    if (!name || !description || !createdBy) {
      return res.status(400).json({
        success: false,
        error: 'Nama channel, deskripsi, dan pembuat harus diisi',
        field: !name ? 'name' : !description ? 'description' : 'createdBy'
      });
    }

    // Validate name format
    if (name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Nama channel minimal 3 karakter',
        field: 'name'
      });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Nama channel maksimal 50 karakter',
        field: 'name'
      });
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Nama channel hanya boleh menggunakan huruf, angka, spasi, dash, dan underscore',
        field: 'name'
      });
    }

    // Validate description
    if (description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Deskripsi channel minimal 10 karakter',
        field: 'description'
      });
    }

    if (description.trim().length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Deskripsi channel maksimal 200 karakter',
        field: 'description'
      });
    }

    // Check if channel with same name already exists for this user
    const existingChannels = dataService.getChannelsByPublisher(createdBy);
    const duplicateName = existingChannels.find(ch => 
      ch.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    
    if (duplicateName) {
      return res.status(409).json({
        success: false,
        error: 'Anda sudah memiliki channel dengan nama ini',
        field: 'name'
      });
    }
    
    let queueResult = null;
    let queueUrl = null;
    
    // ALWAYS use AWS SQS - no fallback mode
    try {
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file');
      }
      
      console.log('🔗 Creating SQS queue for channel:', name);
      queueResult = await sqsService.createQueue(name);
      queueUrl = queueResult.queueUrl;
      console.log(`✅ SQS queue created successfully: ${queueUrl}`);
    } catch (awsError) {
      console.error('💥 Failed to create SQS queue:', awsError.message);
      return res.status(500).json({
        success: false,
        error: `AWS SQS Error: ${awsError.message}. Please check your AWS credentials and permissions.`
      });
    }
    
    // Create channel in data store
    const channel = dataService.createChannel(
      name.trim(),
      description.trim(),
      createdBy,
      queueUrl
    );
    
    const responseMessage = queueUrl ? 
      `Channel "${name}" berhasil dibuat dengan SQS queue aktif` : 
      `Channel "${name}" berhasil dibuat (mode development tanpa SQS)`;
    
    res.status(201).json({
      success: true,
      data: channel,
      queueInfo: queueResult,
      message: responseMessage,
      awsConfigured: !!queueUrl
    });
  } catch (error) {
    console.error('Channel creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan internal server. Silakan coba lagi.'
    });
  }
});

// Update channel
router.put('/:channelId', (req, res) => {
  try {
    const { channelId } = req.params;
    const updates = req.body;
    
    const updatedChannel = dataService.updateChannel(channelId, updates);
    
    if (!updatedChannel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedChannel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete channel
router.delete('/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const channel = dataService.getChannel(channelId);
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }
    
    // Delete SQS queue if exists
    if (channel.queueUrl) {
      await sqsService.deleteQueue(channel.queueUrl);
    }
    
    // Delete channel from data store
    const deleted = dataService.deleteChannel(channelId);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Channel deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete channel'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get channel statistics
router.get('/:channelId/stats', async (req, res) => {
  try {
    const { channelId } = req.params;
    const channel = dataService.getChannel(channelId);
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }
    
    let queueStats = null;
    if (channel.queueUrl) {
      queueStats = await sqsService.getQueueAttributes(channel.queueUrl);
    }
    
    const subscribers = dataService.getChannelSubscribers(channelId);
    const messages = dataService.getChannelMessages(channelId, 10);
    
    res.json({
      success: true,
      data: {
        channel,
        subscriberCount: subscribers.length,
        recentMessages: messages.length,
        queueStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all messages for a channel (with option to load from SQS)
router.get('/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { loadFromSQS } = req.query;
    
    // Load from SQS if requested (useful after server restart)
    if (loadFromSQS === 'true') {
      console.log('🔄 Loading messages from SQS for channel:', channelId);
      await dataService.loadMessagesFromSQS(channelId);
    }
    
    const messages = dataService.getChannelMessages(channelId);
    
    res.json({
      success: true,
      data: messages,
      loadedFromSQS: loadFromSQS === 'true'
    });
  } catch (error) {
    console.error('Error getting channel messages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
