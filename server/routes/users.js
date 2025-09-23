const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const { v4: uuidv4 } = require('uuid');

// Login or create user
router.post('/login', (req, res) => {
  try {
    const { username, role = 'subscriber' } = req.body;
    
    if (!username || username.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Username minimal 2 karakter'
      });
    }
    
    const cleanUsername = username.trim().toLowerCase();
    
    // Check if user already exists
    let user = dataService.getUserByUsername(cleanUsername);
    
    if (user) {
      // Update last login
      user.lastLogin = new Date().toISOString();
      dataService.updateUser(user.id, { lastLogin: user.lastLogin });
      
      res.json({
        success: true,
        data: user,
        message: 'Login berhasil'
      });
    } else {
      // Create new user
      const userId = `user_${cleanUsername}_${Date.now()}`;
      user = dataService.createUser(userId, username.trim(), role);
      
      res.status(201).json({
        success: true,
        data: user,
        message: 'Akun baru berhasil dibuat'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user profile
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const user = dataService.getUser(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update user profile
router.put('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    const user = dataService.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const updatedUser = dataService.updateUser(userId, updates);
    
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all users (admin only)
router.get('/', (req, res) => {
  try {
    const users = dataService.getAllUsers();
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user statistics
router.get('/:userId/stats', (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = dataService.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const subscriptions = dataService.getUserSubscriptions(userId);
    const messagesSent = dataService.getUserMessageCount(userId);
    
    const stats = {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(sub => sub.isActive).length,
      messagesSent: messagesSent,
      memberSince: user.createdAt,
      lastLogin: user.lastLogin
    };
    
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

// Delete user account
router.delete('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    const success = dataService.deleteUser(userId);
    
    if (success) {
      res.json({
        success: true,
        message: 'User account deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
