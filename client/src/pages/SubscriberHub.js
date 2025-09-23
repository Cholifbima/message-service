import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Search, 
  Bell, 
  MessageCircle, 
  Users,
  User,
  Zap,
  Check,
  Plus,
  Clock,
  RefreshCw
} from 'lucide-react';
import { channelAPI, subscriptionAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 12px;
  padding: 0.8rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const Title = styled.h1`
  color: white;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0.2rem 0 0 0;
  font-size: 0.9rem;
`;

const UserBadge = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 0.8rem 1.2rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
`;

const ConnectionStatus = styled.div`
  color: ${props => props.connected ? '#4ade80' : '#f87171'};
  font-size: 0.8rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  display: inline-block;
  font-weight: 500;
  border: 1px solid ${props => props.connected ? '#4ade80' : '#f87171'};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  backdrop-filter: blur(10px);
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Card = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 1.5rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 1rem;
  font-weight: 600;
`;

const SearchBox = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &::placeholder {
    color: #adb5bd;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #adb5bd;
`;

const ChannelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
`;

const ChannelItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem;
  background: #f8f9fa;
  border-radius: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e3f2fd;
    transform: translateY(-1px);
  }
`;

const ChannelInfo = styled.div`
  flex: 1;
`;

const ChannelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.5rem;
`;

const ChannelIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const ChannelName = styled.div`
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
`;

const ChannelDescription = styled.div`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const ChannelMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.8rem;
  color: #888;
`;

const SubscribeButton = styled(motion.button)`
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.3s ease;
  
  ${props => props.subscribed ? `
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  ` : `
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
  `}
  
  &:hover {
    transform: translateY(-1px);
  }
`;

const MessageFeed = styled.div`
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageItem = styled.div`
  padding: 1rem;
  background: ${props => props.isNew ? '#e8f5e8' : '#f8f9fa'};
  border-radius: 12px;
  border-left: 4px solid ${props => props.isNew ? '#28a745' : '#667eea'};
  transition: all 0.3s ease;
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
`;

const MessageChannel = styled.div`
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
`;

const MessageTime = styled.div`
  font-size: 0.8rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const MessageSender = styled.div`
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.5rem;
`;

const MessageContent = styled.div`
  color: #333;
  line-height: 1.5;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #666;
  padding: 3rem 1rem;
`;

const EmptyIcon = styled.div`
  width: 80px;
  height: 80px;
  background: #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;

const SubscriberHub = ({ currentUser }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { joinChannel, messages, setMessages, connected } = useSocket();
  const [channels, setChannels] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    subscriptions: 0,
    messagesToday: 0,
    availableChannels: 0,
    unreadMessages: 0
  });

  useEffect(() => {
    loadChannels();
    loadSubscriptions();
    loadStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages from SQS when subscriptions change
  useEffect(() => {
    const loadSQSMessages = async () => {
      if (subscriptions.length === 0) return;
      
      console.log('🔄 Loading messages from SQS for all subscribed channels');
      let totalLoaded = 0;
      
      for (const subscription of subscriptions) {
        if (subscription.isActive) {
          try {
            const messagesResponse = await channelAPI.getMessages(subscription.channelId, true);
            if (messagesResponse.success && messagesResponse.data) {
              setMessages(prev => {
                // Merge SQS messages with existing, avoid duplicates
                const existingIds = new Set(prev.map(m => m.id));
                const newMessages = messagesResponse.data.filter(m => !existingIds.has(m.id));
                totalLoaded += newMessages.length;
                return [...newMessages, ...prev];
              });
              console.log(`✅ Loaded ${messagesResponse.data.length} messages from SQS for channel ${subscription.channelId}`);
            }
          } catch (error) {
            console.error(`Failed to load messages from SQS for channel ${subscription.channelId}:`, error);
          }
        }
      }
      
      if (totalLoaded > 0) {
        console.log(`📦 Total loaded ${totalLoaded} messages from SQS`);
        toast.success(`Loaded ${totalLoaded} messages from history`);
      }
    };

    if (subscriptions.length > 0) {
      loadSQSMessages();
    }
  }, [subscriptions, setMessages]);

  // SQS Polling for real-time message consumption
  useEffect(() => {
    if (subscriptions.length === 0) return;

    console.log('🔄 Starting SQS polling for subscribed channels');
    
    const pollMessages = async () => {
      for (const subscription of subscriptions) {
        if (subscription.isActive) {
          try {
            const messagesResponse = await channelAPI.getMessages(subscription.channelId, true);
            if (messagesResponse.success && messagesResponse.data) {
              setMessages(prev => {
                // Only add new messages that don't already exist
                const existingIds = new Set(prev.map(m => m.id));
                const newMessages = messagesResponse.data.filter(m => !existingIds.has(m.id));
                
                if (newMessages.length > 0) {
                  console.log(`📨 Received ${newMessages.length} new messages from SQS for channel ${subscription.channelId}`);
                  return [...newMessages, ...prev];
                }
                return prev;
              });
            }
          } catch (error) {
            console.error(`SQS polling error for channel ${subscription.channelId}:`, error);
          }
        }
      }
    };

    const interval = setInterval(pollMessages, 10000); // Poll every 10 seconds

    return () => {
      console.log('🛑 Stopping SQS polling');
      clearInterval(interval);
    };
  }, [subscriptions, setMessages]);

  const loadChannels = async () => {
    try {
      // Load all public channels from all publishers
      const response = await channelAPI.getForSubscriber();
      if (response.success) {
        setChannels(response.data);
      }
    } catch (error) {
      toast.error('Failed to load channels');
      console.error(error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const response = await subscriptionAPI.getUserSubscriptions(currentUser.id);
      if (response.success) {
        setSubscriptions(response.data);
        // Join all subscribed channels
        response.data.forEach(sub => {
          if (sub.channel) {
            joinChannel(sub.channel.id);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  };

  const loadStats = async () => {
    try {
      const globalStats = await subscriptionAPI.getStats();
      const userSubs = await subscriptionAPI.getUserSubscriptions(currentUser.id);
      
      setStats({
        subscriptions: userSubs.success ? userSubs.data.length : 0,
        messagesToday: messages.filter(msg => {
          const today = new Date().toDateString();
          return new Date(msg.timestamp).toDateString() === today;
        }).length,
        availableChannels: globalStats.success ? globalStats.data.totalChannels : 0,
        unreadMessages: messages.length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const isSubscribed = (channelId) => {
    return subscriptions.some(sub => sub.channelId === channelId && sub.isActive);
  };

  const handleSubscribe = async (channel) => {
    if (isSubscribed(channel.id)) {
      // Unsubscribe
      setLoading(true);
      try {
        const response = await subscriptionAPI.unsubscribe({
          userId: currentUser.id,
          channelId: channel.id
        });

        if (response.success) {
          toast.success(`Unsubscribed from ${channel.name}`);
          loadSubscriptions();
          loadStats();
        } else {
          toast.error(response.error || 'Failed to unsubscribe');
        }
      } catch (error) {
        toast.error(error.error || 'Failed to unsubscribe');
      } finally {
        setLoading(false);
      }
    } else {
      // Subscribe
      setLoading(true);
      try {
        const response = await subscriptionAPI.subscribe({
          userId: currentUser.id,
          channelId: channel.id
        });

        if (response.success) {
          toast.success(`Subscribed to ${channel.name}`);
          joinChannel(channel.id);
          loadSubscriptions();
          loadStats();
          
          // Auto-load messages from SQS for this channel
          try {
            console.log('🔄 Auto-loading messages after subscription to:', channel.name);
            
            const loadingToast = toast.loading(`Loading ${channel.name} history...`);
            const messagesResponse = await channelAPI.getMessages(channel.id, true); // loadFromSQS = true
            
            toast.dismiss(loadingToast);
            
            if (messagesResponse.success && messagesResponse.data) {
              setMessages(prev => {
                // Merge SQS messages with existing, avoid duplicates
                const existingIds = new Set(prev.map(m => m.id));
                const newMessages = messagesResponse.data.filter(m => !existingIds.has(m.id));
                
                if (newMessages.length > 0) {
                  console.log(`✅ Auto-loaded ${newMessages.length} messages from ${channel.name}`);
                  toast.success(`📖 Loaded ${newMessages.length} message${newMessages.length > 1 ? 's' : ''} from ${channel.name}`, {
                    duration: 3000,
                    icon: '📖'
                  });
                  return [...newMessages, ...prev];
                } else {
                  console.log('📭 No message history available');
                  return prev;
                }
              });
            }
          } catch (messageError) {
            console.error('Failed to auto-load messages:', messageError);
            toast.error(`Could not load ${channel.name} history`, {
              duration: 3000,
              icon: '⚠️'
            });
          }
        } else {
          toast.error(response.error || 'Failed to subscribe');
        }
      } catch (error) {
        toast.error(error.error || 'Failed to subscribe');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    channel.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (channel.publisherName && channel.publisherName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    channel.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentMessages = messages.slice(0, 20).map(msg => ({
    ...msg,
    isNew: Date.now() - new Date(msg.timestamp).getTime() < 60000 // Less than 1 minute
  }));

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <BackButton onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </BackButton>
          <div>
            <Title>
              <Users size={24} style={{ marginRight: '0.5rem' }} />
              Subscriber Hub
            </Title>
            <Subtitle>Welcome back, {currentUser.name}</Subtitle>
            <ConnectionStatus connected={connected}>
              {connected ? '🟢 Connected to messaging service' : '🔴 Disconnected from messaging service'}
            </ConnectionStatus>
          </div>
        </HeaderLeft>
        <UserBadge onClick={() => logout()}>
          <User size={16} style={{ marginRight: '0.5rem' }} />
          {currentUser?.name} - Logout
        </UserBadge>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatNumber>{stats.subscriptions}</StatNumber>
          <StatLabel>
            <Bell size={16} />
            Subscriptions
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{stats.messagesToday}</StatNumber>
          <StatLabel>
            <MessageCircle size={16} />
            Messages Today
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{stats.availableChannels}</StatNumber>
          <StatLabel>
            <Zap size={16} />
            Available Channels
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{stats.unreadMessages}</StatNumber>
          <StatLabel>
            <Bell size={16} />
            Unread Messages
          </StatLabel>
        </StatCard>
      </StatsGrid>

      <MainContent>
        <LeftPanel>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <SectionTitle style={{ margin: 0 }}>Discover Channels ({filteredChannels.length} available)</SectionTitle>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadChannels}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  color: 'white',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <RefreshCw size={14} />
                Refresh
              </motion.button>
            </div>
            
            <SearchBox>
              <SearchIcon>
                <Search size={20} />
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder="Search channels, descriptions, or publishers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchBox>
            
            <ChannelList>
              {filteredChannels.length > 0 ? (
                filteredChannels.map(channel => (
                  <ChannelItem key={channel.id}>
                    <ChannelInfo>
                      <ChannelHeader>
                        <ChannelIcon>
                          <MessageCircle size={20} />
                        </ChannelIcon>
                        <div>
                          <ChannelName>{channel.name}</ChannelName>
                          <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.2rem' }}>
                            📢 By <strong>{channel.publisherName || channel.createdBy}</strong>
                          </div>
                        </div>
                      </ChannelHeader>
                      <ChannelDescription>{channel.description}</ChannelDescription>
                      <ChannelMeta>
                        <span>
                          <User size={12} style={{ marginRight: '0.3rem' }} />
                          {channel.subscriberCount} subscribers
                        </span>
                        <span>
                          Created: {new Date(channel.createdAt).toLocaleDateString()}
                        </span>
                      </ChannelMeta>
                    </ChannelInfo>
                    
                    <SubscribeButton
                      subscribed={isSubscribed(channel.id)}
                      disabled={loading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSubscribe(channel)}
                    >
                      {isSubscribed(channel.id) ? (
                        <>
                          <Check size={16} />
                          Subscribed
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          Subscribe
                        </>
                      )}
                    </SubscribeButton>
                  </ChannelItem>
                ))
              ) : channels.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '4rem 1rem',
                  color: '#666',
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  border: '2px dashed #dee2e6'
                }}>
                  <MessageCircle size={64} style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
                  <h3 style={{ marginBottom: '1rem', color: '#495057' }}>Belum Ada Channel Tersedia</h3>
                  <p style={{ fontSize: '1rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    Saat ini belum ada publisher yang membuat channel.<br />
                    Channel akan muncul di sini setelah publisher membuatnya.
                  </p>
                  <div style={{ 
                    background: '#e3f2fd', 
                    border: '1px solid #bbdefb',
                    borderRadius: '8px',
                    padding: '1rem',
                    fontSize: '0.9rem',
                    color: '#1976d2'
                  }}>
                    💡 <strong>Tips:</strong> Refresh halaman ini secara berkala untuk melihat channel baru
                  </div>
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 1rem',
                  color: '#666',
                  background: '#fff3cd',
                  borderRadius: '12px',
                  border: '2px solid #ffeaa7'
                }}>
                  <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <h4 style={{ marginBottom: '0.5rem', color: '#856404' }}>Tidak Ada Channel yang Cocok</h4>
                  <p style={{ fontSize: '0.9rem' }}>
                    Coba gunakan kata kunci yang berbeda atau kosongkan pencarian
                  </p>
                </div>
              )}
            </ChannelList>
          </Card>
        </LeftPanel>

        <RightPanel>
          <Card>
            <SectionTitle>Message Feed • <span style={{ color: '#28a745' }}>Live</span></SectionTitle>
            
            <MessageFeed>
              {recentMessages.length > 0 ? (
                recentMessages.map((message, index) => (
                  <MessageItem key={message.id || index} isNew={message.isNew}>
                    <MessageHeader>
                      <MessageChannel>
                        <MessageCircle size={16} style={{ marginRight: '0.5rem' }} />
                        {channels.find(c => c.id === message.channelId)?.name || message.channelId}
                      </MessageChannel>
                      <MessageTime 
                        title={`Sent at ${new Date(message.timestamp).toLocaleString()}`}
                      >
                        <Clock size={12} style={{ color: '#28a745' }} />
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </MessageTime>
                    </MessageHeader>
                    <MessageSender>
                      📢 {message.senderName || message.senderId} • 
                      From: <strong>{channels.find(c => c.id === message.channelId)?.publisherName || 'Unknown Publisher'}</strong>
                      {message.isNew && <span style={{color: '#28a745', marginLeft: '0.5rem'}}>• New</span>}
                    </MessageSender>
                    <MessageContent>{message.content}</MessageContent>
                  </MessageItem>
                ))
              ) : (
                <EmptyState>
                  <EmptyIcon>
                    <MessageCircle size={40} color="#adb5bd" />
                  </EmptyIcon>
                  <div>No messages yet</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Subscribe to channels to receive messages
                  </div>
                </EmptyState>
              )}
            </MessageFeed>
          </Card>
        </RightPanel>
      </MainContent>
    </Container>
  );
};

export default SubscriberHub;
