import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Plus, 
  Send, 
  Users, 
  MessageCircle, 
  TrendingUp,
  Radio,
  User,
  Clock,
  X,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { channelAPI, messageAPI, subscriptionAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
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

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 1rem;
  font-weight: 600;
`;

const ChannelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-height: 300px;
  overflow-y: auto;
`;

const ChannelItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: ${props => props.isActive ? '#e3f2fd' : '#f8f9fa'};
  border-radius: 12px;
  border: 2px solid ${props => props.isActive ? '#2196f3' : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e3f2fd;
    border-color: #2196f3;
  }
`;

const ChannelInfo = styled.div``;

const ChannelName = styled.div`
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChannelDesc = styled.div`
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.2rem;
`;

const ChannelStats = styled.div`
  text-align: right;
  font-size: 0.8rem;
  color: #555;
`;

const CreateChannelButton = styled(motion.button)`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const MessageForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 1rem;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &::placeholder {
    color: #adb5bd;
  }
`;

const SendButton = styled(motion.button)`
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const MessagesList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const MessageItem = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #667eea;
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: #666;
`;

const MessageContent = styled.div`
  color: #333;
  line-height: 1.5;
`;

const Modal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
`;

const ModalSubtitle = styled.p`
  color: #666;
  margin: 0;
  font-size: 0.9rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.875rem ${props => props.hasIcon ? '2.5rem' : '0.875rem'} 0.875rem 0.875rem;
  border: 2px solid ${props => props.error ? '#dc3545' : props.success ? '#28a745' : '#e9ecef'};
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
  background: ${props => props.error ? '#fff5f5' : props.success ? '#f8fff9' : 'white'};
  
  &:focus {
    outline: none;
    border-color: ${props => props.error ? '#dc3545' : props.success ? '#28a745' : '#667eea'};
    box-shadow: 0 0 0 3px ${props => props.error ? 'rgba(220, 53, 69, 0.1)' : props.success ? 'rgba(40, 167, 69, 0.1)' : 'rgba(102, 126, 234, 0.1)'};
  }
  
  &::placeholder {
    color: #adb5bd;
  }
`;

const FormTextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 0.875rem;
  border: 2px solid ${props => props.error ? '#dc3545' : props.success ? '#28a745' : '#e9ecef'};
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;
  background: ${props => props.error ? '#fff5f5' : props.success ? '#f8fff9' : 'white'};
  
  &:focus {
    outline: none;
    border-color: ${props => props.error ? '#dc3545' : props.success ? '#28a745' : '#667eea'};
    box-shadow: 0 0 0 3px ${props => props.error ? 'rgba(220, 53, 69, 0.1)' : props.success ? 'rgba(40, 167, 69, 0.1)' : 'rgba(102, 126, 234, 0.1)'};
  }
  
  &::placeholder {
    color: #adb5bd;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const ModalButton = styled(motion.button)`
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.primary ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  ` : `
    background: #f8f9fa;
    color: #666;
    border: 1px solid #dee2e6;
    
    &:hover {
      background: #e9ecef;
    }
  `}
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #f8f9fa;
    color: #333;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const SuccessMessage = styled.div`
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormInputContainer = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.error ? '#dc3545' : props.success ? '#28a745' : '#adb5bd'};
  transition: color 0.3s ease;
`;

const StudioBroadcast = ({ currentUser }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { joinChannel, messages, setMessages, connected } = useSocket();
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [stats, setStats] = useState({
    totalChannels: 0,
    totalSubscribers: 0,
    messagesSent: 0,
    deliveryRate: 0
  });

  useEffect(() => {
    loadChannels();
    loadStats();
  }, []);

  const loadChannels = async () => {
    try {
      // Load only channels created by current user
      const response = await channelAPI.getByPublisher(currentUser.id);
      if (response.success) {
        setChannels(response.data);
        if (response.data.length > 0 && !selectedChannel) {
          setSelectedChannel(response.data[0]);
          joinChannel(response.data[0].id);
        }
      }
    } catch (error) {
      toast.error('Failed to load channels');
      console.error(error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await subscriptionAPI.getStats();
      if (response.success) {
        setStats({
          totalChannels: response.data.totalChannels,
          totalSubscribers: response.data.totalSubscriptions,
          messagesSent: response.data.totalMessages,
          deliveryRate: response.data.deliveryRate
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleChannelSelect = async (channel) => {
    setSelectedChannel(channel);
    joinChannel(channel.id);
    
    // Auto-load messages immediately with optimistic loading
    const loadMessages = async () => {
      try {
        console.log('🔄 Auto-loading messages for channel:', channel.name);
        
        // Show loading state for user feedback
        const loadingToast = toast.loading('Loading message history...');
        
        const response = await channelAPI.getMessages(channel.id, true); // loadFromSQS = true
        
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        if (response.success && response.data) {
          setMessages(prev => {
            // Merge SQS messages with existing, avoid duplicates
            const existingIds = new Set(prev.map(m => m.id));
            const newMessages = response.data.filter(m => !existingIds.has(m.id));
            
            if (newMessages.length > 0) {
              console.log(`✅ Auto-loaded ${newMessages.length} messages for channel ${channel.name}`);
              toast.success(`📖 Loaded ${newMessages.length} message${newMessages.length > 1 ? 's' : ''} from history`, {
                duration: 2000,
                icon: '📖'
              });
              return [...newMessages, ...prev];
            } else {
              console.log('📭 No new messages to load from SQS');
              return prev;
            }
          });
        }
      } catch (error) {
        console.error('Failed to auto-load messages:', error);
        toast.error('Could not load message history', {
          duration: 3000,
          icon: '⚠️'
        });
      }
    };
    
    // Execute auto-load immediately (non-blocking)
    loadMessages();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    console.log('📱 Client: Attempting to send message', {
      selectedChannel: selectedChannel?.id,
      messageLength: messageText.trim().length,
      senderId: currentUser.id
    });
    
    if (!selectedChannel || !messageText.trim()) {
      console.log('❌ Client: Validation failed', {
        hasChannel: !!selectedChannel,
        hasMessage: !!messageText.trim()
      });
      toast.error('Please select a channel and enter a message');
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Client: Sending broadcast request to API', {
        channelId: selectedChannel.id,
        message: messageText.trim().substring(0, 50) + '...',
        senderId: currentUser.id
      });

      const response = await messageAPI.broadcast({
        channelId: selectedChannel.id,
        message: messageText.trim(),
        senderId: currentUser.id
      });

      console.log('📥 Client: Received response from API', {
        success: response.success,
        subscriberCount: response.data?.subscriberCount,
        sqsStatus: response.data?.sqsStatus
      });

      if (response.success) {
        const successMsg = `Message sent to ${response.data.subscriberCount} subscribers`;
        console.log('✅ Client: Message sent successfully', successMsg);
        toast.success(successMsg);
        setMessageText('');
        
        // Update local messages (check for duplicates)
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          if (!existingIds.has(response.data.message.id)) {
            console.log('📝 Client: Adding new message to local state');
            return [response.data.message, ...prev];
          } else {
            console.log('⚠️ Client: Message already exists, skipping duplicate');
            return prev;
          }
        });
        
        // Reload stats
        loadStats();
      } else {
        console.log('❌ Client: API returned error', response.error);
        toast.error(response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('💥 Client: Error sending message', error);
      toast.error(error.error || error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
    setNewChannelData({ name: '', description: '' });
    setFormErrors({ name: '', description: '' });
    setCreateLoading(false);
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value.trim()) {
          return 'Nama channel harus diisi';
        }
        if (value.trim().length < 3) {
          return 'Nama channel minimal 3 karakter';
        }
        if (value.trim().length > 50) {
          return 'Nama channel maksimal 50 karakter';
        }
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(value.trim())) {
          return 'Nama channel hanya boleh menggunakan huruf, angka, spasi, dash, dan underscore';
        }
        return '';
      
      case 'description':
        if (!value.trim()) {
          return 'Deskripsi channel harus diisi';
        }
        if (value.trim().length < 10) {
          return 'Deskripsi minimal 10 karakter';
        }
        if (value.trim().length > 200) {
          return 'Deskripsi maksimal 200 karakter';
        }
        return '';
      
      default:
        return '';
    }
  };

  const validateForm = () => {
    const errors = {
      name: validateField('name', newChannelData.name),
      description: validateField('description', newChannelData.description)
    };
    
    setFormErrors(errors);
    return !errors.name && !errors.description;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Silakan periksa kembali form yang diisi');
      return;
    }

    setCreateLoading(true);
    try {
      const response = await channelAPI.create({
        name: newChannelData.name.trim(),
        description: newChannelData.description.trim(),
        createdBy: currentUser.id
      });

      if (response.success) {
        toast.success(
          response.message || 
          `Channel "${newChannelData.name}" berhasil dibuat! ${response.data.queueUrl ? '✅ SQS aktif' : '⚠️ Mode development'}`
        );
        loadChannels();
        loadStats();
        handleCloseCreateForm();
      } else {
        const errorMsg = response.error || 'Gagal membuat channel';
        toast.error(errorMsg);
        
        // Set specific field errors if available
        if (response.field) {
          setFormErrors(prev => ({
            ...prev,
            [response.field]: errorMsg
          }));
        }
      }
    } catch (error) {
      const errorMsg = error.error || error.message || 'Gagal membuat channel';
      toast.error(errorMsg);
      console.error('Channel creation error:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNewChannelData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Real-time validation after user stops typing
    setTimeout(() => {
      const error = validateField(field, value);
      setFormErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }, 500);
  };

  const channelMessages = messages.filter(msg => 
    !selectedChannel || msg.channelId === selectedChannel.id
  );

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <BackButton onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </BackButton>
          <div>
            <Title>
              <Radio size={24} style={{ marginRight: '0.5rem' }} />
              Studio Broadcast
            </Title>
            <Subtitle>Hai {currentUser.name}, selamat datang kembali!</Subtitle>
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
          <StatNumber>{stats.totalChannels}</StatNumber>
          <StatLabel>
            <MessageCircle size={16} />
            My Channels
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{stats.totalSubscribers}</StatNumber>
          <StatLabel>
            <Users size={16} />
            Total Subscribers
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{stats.messagesSent}</StatNumber>
          <StatLabel>
            <Send size={16} />
            Messages Sent
          </StatLabel>
        </StatCard>
        {/* Delivery Rate card removed per product request */}
      </StatsGrid>

      <MainContent>
        <LeftPanel>
          <Card>
            <SectionTitle>My Channels</SectionTitle>
            <CreateChannelButton
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateChannel}
            >
              <Plus size={20} />
              Create
            </CreateChannelButton>
            
            <ChannelList>
              {channels.length > 0 ? (
                channels.map(channel => (
                  <ChannelItem
                    key={channel.id}
                    isActive={selectedChannel?.id === channel.id}
                    onClick={() => handleChannelSelect(channel)}
                  >
                    <ChannelInfo>
                      <ChannelName>
                        <MessageCircle size={16} color={selectedChannel?.id === channel.id ? '#2196f3' : '#666'} />
                        {channel.name}
                      </ChannelName>
                      <ChannelDesc>{channel.description}</ChannelDesc>
                    </ChannelInfo>
                    <ChannelStats>
                      <div>{channel.subscriberCount} subscribers</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                        <User size={12} />
                        Select to Send
                      </div>
                    </ChannelStats>
                  </ChannelItem>
                ))
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 1rem',
                  color: '#666',
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  border: '2px dashed #dee2e6'
                }}>
                  <MessageCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <h4 style={{ marginBottom: '0.5rem', color: '#495057' }}>Belum Ada Channel</h4>
                  <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Buat channel pertama Anda untuk mulai mengirim pesan broadcast
                  </p>
                  <CreateChannelButton
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateChannel}
                    style={{ margin: 0 }}
                  >
                    <Plus size={20} />
                    Buat Channel Pertama
                  </CreateChannelButton>
                </div>
              )}
            </ChannelList>
          </Card>
        </LeftPanel>

        <RightPanel>
          <Card>
            <SectionTitle>Send Message</SectionTitle>
            
            {channels.length > 0 ? (
              <>
                <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
                  Selected Channel: <strong>{selectedChannel ? selectedChannel.name : 'None'}</strong>
                </div>
                
                <MessageForm onSubmit={handleSendMessage}>
                  <TextArea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message here..."
                    required
                  />
                  <SendButton
                    type="submit"
                    disabled={loading || !selectedChannel}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Send size={20} />
                    {loading ? 'Sending...' : 'Send Message'}
                  </SendButton>
                </MessageForm>
              </>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem 1rem',
                color: '#666',
                background: '#f8f9fa',
                borderRadius: '12px',
                border: '2px dashed #dee2e6'
              }}>
                <Send size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h4 style={{ marginBottom: '0.5rem', color: '#495057' }}>Siap untuk Broadcast?</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Buat channel terlebih dahulu untuk mulai mengirim pesan ke subscriber
                </p>
                <CreateChannelButton
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateChannel}
                  style={{ margin: 0 }}
                >
                  <Plus size={20} />
                  Buat Channel
                </CreateChannelButton>
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>Recent Messages • <span style={{ color: '#28a745' }}>Live</span></SectionTitle>
            <MessagesList>
              {channelMessages.slice(0, 10).map((message, index) => (
                <MessageItem key={message.id || index}>
                  <MessageHeader>
                    <span><strong>{message.senderName || message.senderId}</strong></span>
                    <span 
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#888' }}
                      title={`Sent at ${new Date(message.timestamp).toLocaleString()}`}
                    >
                      <Clock size={12} style={{ color: '#28a745' }} />
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </MessageHeader>
                  <MessageContent>{message.content}</MessageContent>
                </MessageItem>
              ))}
              {channelMessages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                  No messages yet. Send your first message!
                </div>
              )}
            </MessagesList>
          </Card>
        </RightPanel>
      </MainContent>

      {/* Create Channel Modal */}
      {showCreateForm && (
        <Modal
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCloseCreateForm}
        >
          <ModalContent
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative' }}
          >
            <CloseButton onClick={handleCloseCreateForm}>
              <X size={20} />
            </CloseButton>

            <ModalHeader>
              <ModalTitle>📺 Buat Channel Baru</ModalTitle>
              <ModalSubtitle>
                Buat channel untuk mengirim pesan broadcast ke subscriber
              </ModalSubtitle>
            </ModalHeader>

            <form onSubmit={handleFormSubmit}>
              <FormGroup>
                <FormLabel>Nama Channel *</FormLabel>
                <FormInputContainer>
                  <FormInput
                    type="text"
                    placeholder="Contoh: Tech News, Gaming Updates, Daily Announcements"
                    value={newChannelData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={!!formErrors.name}
                    success={newChannelData.name.trim().length >= 3 && !formErrors.name}
                    hasIcon={true}
                    required
                    autoFocus
                    maxLength={50}
                  />
                  <InputIcon 
                    error={!!formErrors.name} 
                    success={newChannelData.name.trim().length >= 3 && !formErrors.name}
                  >
                    {formErrors.name ? (
                      <AlertCircle size={16} />
                    ) : newChannelData.name.trim().length >= 3 ? (
                      <CheckCircle size={16} />
                    ) : null}
                  </InputIcon>
                </FormInputContainer>
                {formErrors.name && (
                  <ErrorMessage>
                    <AlertCircle size={14} />
                    {formErrors.name}
                  </ErrorMessage>
                )}
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#666', 
                  textAlign: 'right', 
                  marginTop: '0.3rem' 
                }}>
                  {newChannelData.name.length}/50 karakter
                </div>
              </FormGroup>

              <FormGroup>
                <FormLabel>Deskripsi Channel *</FormLabel>
                <FormTextArea
                  placeholder="Jelaskan tentang channel ini dan jenis konten yang akan dikirim..."
                  value={newChannelData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  error={!!formErrors.description}
                  success={newChannelData.description.trim().length >= 10 && !formErrors.description}
                  required
                  maxLength={200}
                />
                {formErrors.description && (
                  <ErrorMessage>
                    <AlertCircle size={14} />
                    {formErrors.description}
                  </ErrorMessage>
                )}
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: newChannelData.description.length >= 180 ? '#dc3545' : '#666', 
                  textAlign: 'right', 
                  marginTop: '0.3rem' 
                }}>
                  {newChannelData.description.length}/200 karakter
                </div>
              </FormGroup>

              {/* Development mode banner removed */}

              <ModalActions>
                <ModalButton
                  type="button"
                  onClick={handleCloseCreateForm}
                  disabled={createLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Batal
                </ModalButton>
                <ModalButton
                  type="submit"
                  primary
                  disabled={
                    createLoading || 
                    !newChannelData.name.trim() || 
                    !newChannelData.description.trim() ||
                    !!formErrors.name ||
                    !!formErrors.description
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {createLoading ? (
                    <>
                      <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Membuat...
                    </>
                  ) : (
                    '✨ Buat Channel'
                  )}
                </ModalButton>
              </ModalActions>
            </form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default StudioBroadcast;
