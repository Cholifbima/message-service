const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

// Subscribe to a channel
router.post('/subscribe', (req, res) => {
  try {
    const { userId, channelId } = req.body;
    
    console.log('📝 Subscription request:', { userId, channelId });
    
    if (!userId || !channelId) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'userId and channelId are required'
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
    
    // Check if already subscribed (active subscription)
    const existingSubscription = dataService.getUserSubscription(userId, channelId);
    if (existingSubscription && existingSubscription.isActive) {
      console.log('⚠️ User already subscribed:', { userId, channelId });
      return res.status(400).json({
        success: false,
        error: 'User is already subscribed to this channel'
      });
    }
    
    // If exists but inactive, reactivate it
    let subscription;
    if (existingSubscription && !existingSubscription.isActive) {
      console.log('🔄 Reactivating existing subscription');
      subscription = dataService.reactivateSubscription(userId, channelId);
    } else {
      console.log('➕ Creating new subscription');
      subscription = dataService.subscribe(userId, channelId);
    }
    
    if (subscription) {
      console.log('✅ Subscription successful:', subscription.id);
      res.status(201).json({
        success: true,
        data: {
          subscription,
          channel
        }
      });
    } else {
      console.log('💥 Failed to create subscription');
      res.status(500).json({
        success: false,
        error: 'Failed to create subscription'
      });
    }
  } catch (error) {
    console.error('💥 Subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Unsubscribe from a channel
router.post('/unsubscribe', (req, res) => {
  try {
    const { userId, channelId } = req.body;
    
    if (!userId || !channelId) {
      return res.status(400).json({
        success: false,
        error: 'userId and channelId are required'
      });
    }
    
    const success = dataService.unsubscribe(userId, channelId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Successfully unsubscribed from channel'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's subscriptions
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    const subscriptions = dataService.getUserSubscriptions(userId);
    
    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get channel subscribers
router.get('/channel/:channelId', (req, res) => {
  try {
    const { channelId } = req.params;
    
    const channel = dataService.getChannel(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }
    
    const subscribers = dataService.getChannelSubscribers(channelId);
    
    res.json({
      success: true,
      data: {
        channelId,
        subscribers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check subscription status
router.get('/check/:userId/:channelId', (req, res) => {
  try {
    const { userId, channelId } = req.params;
    
    const isSubscribed = dataService.isSubscribed(userId, channelId);
    
    res.json({
      success: true,
      data: {
        userId,
        channelId,
        isSubscribed
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get subscription statistics
router.get('/stats', (req, res) => {
  try {
    const stats = dataService.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
