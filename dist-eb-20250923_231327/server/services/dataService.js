const { v4: uuidv4 } = require('uuid');

// In-memory data store (untuk demo - di production gunakan database)
class DataService {
  constructor() {
    this.channels = new Map();
    this.subscriptions = new Map();
    this.messages = new Map();
    this.users = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  initializeSampleData() {
    // No sample channels - users will create their own channels
    // This creates a clean slate for multi-publisher environment
    
    // Keep minimal sample users for development only
    const sampleUsers = [
      { 
        id: 'demo_publisher', 
        name: 'Demo Publisher', 
        role: 'publisher', 
        username: 'demo_publisher',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true
      },
      { 
        id: 'demo_subscriber', 
        name: 'Demo Subscriber', 
        role: 'subscriber', 
        username: 'demo_subscriber',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true
      }
    ];

    sampleUsers.forEach(user => {
      this.users.set(user.id, user);
    });
  }

  // Channel operations
  createChannel(name, description, createdBy, queueUrl) {
    const channelId = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const channel = {
      id: channelId,
      name,
      description,
      createdBy,
      createdAt: new Date().toISOString(),
      queueUrl,
      subscriberCount: 0,
      isActive: true
    };
    
    this.channels.set(channelId, channel);
    return channel;
  }

  getChannel(channelId) {
    return this.channels.get(channelId);
  }

  getAllChannels() {
    return Array.from(this.channels.values()).filter(channel => channel.isActive);
  }

  getChannelsByPublisher(publisherId) {
    return Array.from(this.channels.values()).filter(channel => 
      channel.isActive && channel.createdBy === publisherId
    );
  }

  getPublicChannels() {
    // Return all active channels for subscribers to discover
    return this.getAllChannels().map(channel => ({
      ...channel,
      // Add publisher info for better discovery
      publisherName: this.users.get(channel.createdBy)?.name || channel.createdBy
    }));
  }

  updateChannel(channelId, updates) {
    const channel = this.channels.get(channelId);
    if (channel) {
      Object.assign(channel, updates);
      this.channels.set(channelId, channel);
      return channel;
    }
    return null;
  }

  deleteChannel(channelId) {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.isActive = false;
      this.channels.set(channelId, channel);
      return true;
    }
    return false;
  }

  // Subscription operations
  subscribe(userId, channelId) {
    const subscriptionKey = `${userId}-${channelId}`;
    if (!this.subscriptions.has(subscriptionKey)) {
      const subscription = {
        id: uuidv4(),
        userId,
        channelId,
        subscribedAt: new Date().toISOString(),
        isActive: true
      };
      
      this.subscriptions.set(subscriptionKey, subscription);
      
      // Update subscriber count
      const channel = this.channels.get(channelId);
      if (channel) {
        channel.subscriberCount++;
        this.channels.set(channelId, channel);
      }
      
      return subscription;
    }
    return null;
  }

  unsubscribe(userId, channelId) {
    const subscriptionKey = `${userId}-${channelId}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    
    if (subscription) {
      subscription.isActive = false;
      this.subscriptions.set(subscriptionKey, subscription);
      
      // Update subscriber count
      const channel = this.channels.get(channelId);
      if (channel && channel.subscriberCount > 0) {
        channel.subscriberCount--;
        this.channels.set(channelId, channel);
      }
      
      return true;
    }
    return false;
  }

  getUserSubscriptions(userId) {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.userId === userId && sub.isActive)
      .map(sub => ({
        ...sub,
        channel: this.channels.get(sub.channelId)
      }));
  }

  getChannelSubscribers(channelId) {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.channelId === channelId && sub.isActive)
      .map(sub => ({
        ...sub,
        user: this.users.get(sub.userId)
      }));
  }

  isSubscribed(userId, channelId) {
    const subscriptionKey = `${userId}-${channelId}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    return subscription && subscription.isActive;
  }

  getUserSubscription(userId, channelId) {
    const subscriptionKey = `${userId}-${channelId}`;
    return this.subscriptions.get(subscriptionKey);
  }

  reactivateSubscription(userId, channelId) {
    const subscriptionKey = `${userId}-${channelId}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    
    if (subscription) {
      subscription.isActive = true;
      subscription.subscribedAt = new Date().toISOString(); // Update timestamp
      this.subscriptions.set(subscriptionKey, subscription);
      
      // Update subscriber count
      const channel = this.channels.get(channelId);
      if (channel) {
        channel.subscriberCount++;
        this.channels.set(channelId, channel);
      }
      
      return subscription;
    }
    return null;
  }

  // Message operations
  saveMessage(channelId, content, senderId, messageId) {
    const message = {
      id: messageId || uuidv4(),
      channelId,
      content,
      senderId,
      senderName: this.users.get(senderId)?.name || senderId,
      timestamp: new Date().toISOString(),
      delivered: true
    };
    
    this.messages.set(message.id, message);
    return message;
  }

  getChannelMessages(channelId, limit = 50) {
    return Array.from(this.messages.values())
      .filter(msg => msg.channelId === channelId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // Load messages from SQS for a channel (for persistence after restart)
  async loadMessagesFromSQS(channelId) {
    const channel = this.getChannel(channelId);
    if (!channel || !channel.queueUrl) {
      console.log(`❌ No channel or queue URL for channel: ${channelId}`);
      return [];
    }

    try {
      const sqsService = require('./sqsService');
      console.log(`🔄 Loading messages from SQS for channel: ${channelId}, queue: ${channel.queueUrl}`);
      
      const messages = await sqsService.receiveMessages(channel.queueUrl, 10);
      console.log(`📦 SQS returned ${messages.length} raw messages for channel: ${channelId}`);
      
      const loadedMessages = [];

      for (const sqsMessage of messages) {
        try {
          console.log(`🔍 Processing SQS message:`, {
            messageId: sqsMessage.MessageId,
            bodyLength: sqsMessage.Body?.length,
            bodyPreview: sqsMessage.Body?.substring(0, 50) + '...'
          });
          
          const messageData = JSON.parse(sqsMessage.Body);
          console.log(`📝 Parsed message data:`, {
            id: messageData.id,
            channelId: messageData.channelId,
            content: messageData.content?.substring(0, 30) + '...',
            senderId: messageData.senderId
          });
          
          // Save to local store if not already exists
          const existingMessage = this.messages.get(messageData.id);
          if (!existingMessage) {
            const savedMessage = this.saveMessage(
              messageData.channelId,
              messageData.content,
              messageData.senderId,
              messageData.id,
              messageData.timestamp
            );
            loadedMessages.push(savedMessage);
            console.log(`💾 Saved new message to local store: ${messageData.id}`);
          } else {
            console.log(`🔄 Message already exists in local store: ${messageData.id}`);
          }

          // Don't delete message from SQS - let subscribers consume them
        } catch (parseError) {
          console.warn('❌ Failed to parse SQS message:', parseError.message, sqsMessage.Body?.substring(0, 100));
        }
      }

      console.log(`✅ Loaded ${loadedMessages.length} messages from SQS for channel: ${channelId}`);
      return loadedMessages;
    } catch (error) {
      console.error('💥 Failed to load messages from SQS:', error.message);
      return [];
    }
  }

  // User operations
  getUser(userId) {
    return this.users.get(userId);
  }

  getUserByUsername(username) {
    return Array.from(this.users.values()).find(user => 
      user.username && user.username.toLowerCase() === username.toLowerCase()
    );
  }

  createUser(userId, name, role = 'subscriber') {
    const user = { 
      id: userId, 
      name, 
      role, 
      username: name.toLowerCase(),
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isActive: true
    };
    this.users.set(userId, user);
    return user;
  }

  updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (user) {
      Object.assign(user, updates);
      this.users.set(userId, user);
      return user;
    }
    return null;
  }

  deleteUser(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.isActive = false;
      this.users.set(userId, user);
      return true;
    }
    return false;
  }

  getAllUsers() {
    return Array.from(this.users.values()).filter(user => user.isActive);
  }

  getUserMessageCount(userId) {
    return Array.from(this.messages.values())
      .filter(msg => msg.senderId === userId).length;
  }

  // Statistics
  getStatistics() {
    const totalChannels = this.getAllChannels().length;
    const totalSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive).length;
    const totalMessages = this.messages.size;
    
    return {
      totalChannels,
      totalSubscriptions,
      totalMessages,
      deliveryRate: 98.5 // Mock delivery rate
    };
  }
}

module.exports = new DataService();
