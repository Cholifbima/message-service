const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const sqs = new AWS.SQS();

class SQSService {
  constructor() {
    this.queueUrlPrefix = process.env.SQS_QUEUE_URL_PREFIX;
    
    // Debug AWS configuration
    console.log('🔧 AWS SQS Configuration:');
    console.log('- Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
    console.log('- Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
    console.log('- Region:', process.env.AWS_REGION || 'us-east-1');
  }
  
  // Test AWS connection
  async testConnection() {
    try {
      console.log('🔍 Testing AWS SQS connection...');
      const result = await sqs.listQueues().promise();
      console.log('✅ AWS SQS connection successful');
      return { success: true, queues: result.QueueUrls || [] };
    } catch (error) {
      console.error('❌ AWS SQS connection failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Create a new SQS queue for a channel
  async createQueue(channelName) {
    try {
      // Sanitize channel name for AWS SQS queue naming rules
      // AWS SQS allows: alphanumeric characters, hyphens, underscores (1-80 chars)
      const sanitizedChannelName = channelName
        .toLowerCase()
        .replace(/[^a-z0-9\-_]/g, '-')  // Replace invalid chars with hyphens
        .replace(/-+/g, '-')            // Replace multiple hyphens with single
        .replace(/^-|-$/g, '')          // Remove leading/trailing hyphens
        .substring(0, 30);              // Limit length for timestamp space
      
      const queueName = `channel-${sanitizedChannelName}-${Date.now()}`;
      console.log(`🏷️ Sanitized queue name: "${channelName}" → "${queueName}"`);
      
      const params = {
        QueueName: queueName,
        Attributes: {
          'MessageRetentionPeriod': '1209600', // 14 days
          'VisibilityTimeout': '30', // Fixed: removed 'Seconds'
          'ReceiveMessageWaitTimeSeconds': '20' // Enable long polling
        }
      };

      const result = await sqs.createQueue(params).promise();
      return {
        queueUrl: result.QueueUrl,
        queueName: queueName
      };
    } catch (error) {
      console.error('Error creating SQS queue:', error);
      throw new Error('Failed to create queue');
    }
  }

  // Send message to a queue (Publisher)
  async publishMessage(queueUrl, message, channelId, senderId) {
    try {
      const messageId = uuidv4();
      const params = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          id: messageId,
          content: message,
          channelId: channelId,
          senderId: senderId,
          timestamp: new Date().toISOString(),
          type: 'broadcast'
        }),
        MessageAttributes: {
          'channelId': {
            DataType: 'String',
            StringValue: channelId
          },
          'senderId': {
            DataType: 'String',
            StringValue: senderId
          },
          'messageType': {
            DataType: 'String',
            StringValue: 'broadcast'
          }
        }
      };

      const result = await sqs.sendMessage(params).promise();
      return {
        messageId: result.MessageId,
        customMessageId: messageId
      };
    } catch (error) {
      console.error('Error publishing message:', error);
      throw new Error('Failed to publish message');
    }
  }

  // Receive messages from a queue (Subscriber)
  async receiveMessages(queueUrl, maxMessages = 10) {
    try {
      console.log(`📥 SQS: Receiving messages from queue: ${queueUrl}`);
      const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: 2, // Reduced for HTTP context - was 20
        MessageAttributeNames: ['All']
      };

      const result = await sqs.receiveMessage(params).promise();
      const messages = result.Messages || [];
      console.log(`📥 SQS: Received ${messages.length} messages from queue`);
      
      if (messages.length > 0) {
        console.log(`📥 SQS: First message preview:`, {
          messageId: messages[0].MessageId,
          bodyPreview: messages[0].Body?.substring(0, 100) + '...',
          attributes: messages[0].MessageAttributes
        });
      }
      
      return messages;
    } catch (error) {
      console.error('💥 SQS Error receiving messages:', error.message);
      throw new Error(`Failed to receive messages: ${error.message}`);
    }
  }

  // Delete message after processing (Subscriber acknowledgment)
  async deleteMessage(queueUrl, receiptHandle) {
    try {
      const params = {
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle
      };

      await sqs.deleteMessage(params).promise();
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  // Get queue attributes
  async getQueueAttributes(queueUrl) {
    try {
      const params = {
        QueueUrl: queueUrl,
        AttributeNames: ['All']
      };

      const result = await sqs.getQueueAttributes(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error getting queue attributes:', error);
      throw new Error('Failed to get queue attributes');
    }
  }

  // List all queues
  async listQueues() {
    try {
      const result = await sqs.listQueues().promise();
      return result.QueueUrls || [];
    } catch (error) {
      console.error('Error listing queues:', error);
      throw new Error('Failed to list queues');
    }
  }

  // Delete a queue
  async deleteQueue(queueUrl) {
    try {
      const params = {
        QueueUrl: queueUrl
      };

      await sqs.deleteQueue(params).promise();
      return true;
    } catch (error) {
      console.error('Error deleting queue:', error);
      throw new Error('Failed to delete queue');
    }
  }

  // Purge all messages from a queue
  async purgeQueue(queueUrl) {
    try {
      const params = {
        QueueUrl: queueUrl
      };

      await sqs.purgeQueue(params).promise();
      return true;
    } catch (error) {
      console.error('Error purging queue:', error);
      throw new Error('Failed to purge queue');
    }
  }
}

module.exports = new SQSService();
