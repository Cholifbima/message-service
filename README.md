# 🚀 AWS SQS Messaging Service

A real-time messaging service with **AWS SQS integration**, **Publisher-Subscriber model**, and **React frontend**. Built for distributed systems with persistent message delivery and auto-reconnection capabilities.

## ✨ Features

### 🔥 **Core Functionality**
- **Real-time Messaging** with WebSocket connections
- **AWS SQS Integration** for persistent message queues
- **Publisher-Subscriber Pattern** with channel management
- **Multi-user Support** with role-based access
- **Auto-reconnection** with smart notifications
- **Message Persistence** survives server restarts

### 📱 **User Experience**
- **Publisher Dashboard** - Create channels, send broadcasts
- **Subscriber Hub** - Discover channels, receive messages
- **Auto-loading** message history from SQS
- **Professional UI** with connection status indicators
- **Smart Notifications** with context-aware feedback

### ⚡ **Technical Features**
- **Production Ready** AWS SQS integration
- **Queue Name Sanitization** for AWS compliance
- **Duplicate Message Prevention** 
- **Enhanced Error Handling** with comprehensive logging
- **Cross-session Persistence** via AWS SQS
- **Optimized Performance** with efficient loading

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Node.js API   │    │   AWS SQS       │
│                 │    │                 │    │                 │
│ • Publisher UI  │◄──►│ • REST API      │◄──►│ • Message Queue │
│ • Subscriber UI │    │ • WebSocket     │    │ • Persistence   │
│ • Real-time     │    │ • SQS Service   │    │ • Scalability   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js ≥ 16.0.0
- npm ≥ 8.0.0
- AWS Account with SQS access
- AWS IAM User with SQS permissions

### **1. Clone & Install**
```bash
git clone https://github.com/Cholifbima/message-service.git
cd message-service
npm run install:all
```

### **2. AWS SQS Setup**
1. **Create IAM User** in AWS Console
2. **Attach Policy**: `AmazonSQSFullAccess`
3. **Generate Access Keys** (Access Key ID + Secret)
4. **Copy credentials** for next step

### **3. Environment Configuration**
```bash
# Copy environment template
cp server/config.example.env server/.env

# Edit with your AWS credentials
nano server/.env
```

**Required environment variables:**
```env
# AWS SQS Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1

# Server Configuration
PORT=5000
NODE_ENV=development
```

### **4. Run Development**
```bash
# Start both frontend and backend
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

---

## 📖 Usage Guide

### **👤 For Publishers (Message Senders)**
1. **Login** with username → Select "Pengirim Pesan"
2. **Create Channel** with name and description
3. **Send Messages** to broadcast to all subscribers
4. **Monitor Stats** - channels, subscribers, delivery rate

### **👥 For Subscribers (Message Receivers)**
1. **Login** with username → Select "Penerima Pesan"
2. **Discover Channels** from all publishers
3. **Subscribe** to channels of interest
4. **Receive Messages** in real-time + history

### **🔄 System Behavior**
- **Messages persist** in AWS SQS (survive restarts)
- **Auto-reconnection** handles network issues
- **History loading** shows previous messages
- **Cross-session** messaging works seamlessly

---

## 🚀 Deployment

### **Option 1: AWS Elastic Beanstalk (Recommended)**

1. **Install EB CLI**
```bash
pip install awsebcli
```

2. **Initialize Elastic Beanstalk**
```bash
eb init
# Select region, platform (Node.js), existing application
```

3. **Create Environment**
```bash
eb create production
# Choose environment name, load balancer type
```

4. **Set Environment Variables**
```bash
eb setenv AWS_ACCESS_KEY_ID=your_key AWS_SECRET_ACCESS_KEY=your_secret AWS_REGION=us-east-1
```

5. **Deploy**
```bash
npm run build
eb deploy
```

### **Option 2: AWS Amplify**

1. **Connect Repository** in AWS Amplify Console
2. **Build Settings** - auto-detected from package.json
3. **Environment Variables** - add AWS credentials
4. **Deploy** - automatic from GitHub pushes

---

## 🌍 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region for SQS | `us-east-1` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `production` |

---

## 🛠️ Development

### **Project Structure**
```
message-service/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts (Auth, Socket)
│   │   ├── pages/          # Main pages (Home, Studio, Hub)
│   │   └── services/       # API services
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/             # API routes
│   ├── services/           # Business logic (SQS, Data)
│   ├── index.js            # Main server file
│   └── package.json
├── package.json            # Root package (deployment)
└── README.md
```

### **Available Scripts**
```bash
npm run dev              # Development mode (both apps)
npm run build            # Build for production
npm run start            # Production mode
npm run install:all      # Install all dependencies
npm run deploy:build     # Build for deployment
```

### **API Endpoints**
```bash
# Health & Debug
GET  /health             # Server health check
GET  /aws-debug          # AWS SQS connection status

# Authentication
POST /api/users/login    # User login/creation

# Channels
GET    /api/channels     # List channels
POST   /api/channels     # Create channel
GET    /api/channels/:id/messages  # Load channel messages

# Messages
POST /api/messages/broadcast       # Send broadcast message

# Subscriptions
POST /api/subscriptions/subscribe  # Subscribe to channel
POST /api/subscriptions/unsubscribe # Unsubscribe from channel
```

---

## 🧪 Testing

### **Local Testing**
```bash
# Test health endpoint
curl http://localhost:5000/health

# Test AWS connection
curl http://localhost:5000/aws-debug
```

### **Production Testing**
```bash
# Replace with your domain
curl https://your-app.elasticbeanstalk.com/health
```

---

## 🐛 Troubleshooting

### **Common Issues**

**❌ "Disconnected from messaging service"**
- **Solution**: Auto-reconnection enabled, check network/server

**❌ "AWS SQS Error: Failed to create queue"**
- **Solution**: Verify AWS credentials and IAM permissions

**❌ "Cannot subscribe to channel"**
- **Solution**: Check server logs, subscription reactivation implemented

**❌ "Messages not persisting"**
- **Solution**: Ensure AWS SQS integration active, check queue status

### **Debug Commands**
```bash
# Check AWS connection
curl http://localhost:5000/aws-debug

# View server logs
npm run server:dev  # Watch console output

# Clear all data (development)
curl -X DELETE http://localhost:5000/admin/clear-all
```

---

## 📈 Performance

### **Optimizations**
- ✅ **Auto-loading** with progress indicators
- ✅ **Duplicate prevention** for messages
- ✅ **Efficient SQS polling** (2s timeout)
- ✅ **Smart reconnection** (5 attempts, 1s delay)
- ✅ **Loading states** for better UX

### **Scaling Considerations**
- **SQS Queues**: Automatic scaling by AWS
- **WebSocket**: Consider Redis for multi-instance
- **Database**: Move from in-memory to PostgreSQL/MongoDB
- **Caching**: Add Redis for frequently accessed data

---

## 🔒 Security

### **Production Checklist**
- ✅ **Environment Variables** - Never commit AWS credentials
- ✅ **IAM Permissions** - Principle of least privilege
- ✅ **HTTPS** - SSL/TLS encryption (handled by AWS)
- ✅ **Input Validation** - Sanitized queue names
- ✅ **Error Handling** - No sensitive data in error messages

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to branch (`git push origin feature/AmazingFeature`)
5. **Open** Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **AWS SQS** for reliable message queuing
- **Socket.IO** for real-time communication
- **React** for modern frontend
- **Express.js** for robust backend
- **Material Design** inspiration for UI

---

## 📞 Support

**Issues?** Create an issue on [GitHub Issues](https://github.com/Cholifbima/message-service/issues)

**Questions?** Contact via GitHub profile

---

**Built with ❤️ for distributed systems and real-time messaging**