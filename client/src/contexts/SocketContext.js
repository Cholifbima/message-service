import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const connectSocket = () => {
      const originBase = typeof window !== 'undefined' ? window.location.origin : '';
      const serverUrl = process.env.REACT_APP_SERVER_URL || originBase || 'http://localhost:5000';
      const newSocket = io(serverUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
      });

      newSocket.on('connect', () => {
        console.log('✅ WebSocket: Connected to server');
        setConnected(true);
        setReconnectAttempts(0);
        
        // Only show success toast on first connect or after failed attempts
        if (reconnectAttempts > 0) {
          toast.success('🔗 Reconnected to messaging service');
        } else {
          console.log('🔗 WebSocket: Initial connection established');
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ WebSocket: Disconnected from server. Reason:', reason);
        setConnected(false);
        
        // Only show error toast for unexpected disconnects, not server restarts
        if (reason !== 'transport close' && reason !== 'transport error') {
          toast.error('⚠️ Connection lost. Trying to reconnect...');
        }
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 WebSocket: Reconnection attempt ${attemptNumber}`);
        setReconnectAttempts(attemptNumber);
      });

      newSocket.on('reconnect_failed', () => {
        console.log('💥 WebSocket: Failed to reconnect after all attempts');
        toast.error('❌ Could not reconnect to messaging service');
      });

      newSocket.on('new-message', (data) => {
        console.log('🔔 WebSocket: New message received:', {
          channelId: data.channelId,
          messageId: data.message.id,
          sender: data.message.senderName
        });
        setMessages(prev => [data.message, ...prev]);
        toast.success(`📨 New message from ${data.message.senderName}`);
      });

      newSocket.on('broadcast-message', (data) => {
        console.log('📢 WebSocket: Broadcast message received:', {
          channelId: data.channelId,
          messageId: data.message.id,
          sender: data.message.senderName,
          subscriberCount: data.subscriberCount
        });
        setMessages(prev => [data.message, ...prev]);
        toast.success(`📢 Broadcast from ${data.message.senderName}`);
      });

      newSocket.on('connect_error', (error) => {
        console.error('💥 WebSocket: Connection error:', error.message);
        setReconnectAttempts(prev => prev + 1);
        
        // Only show error after multiple failed attempts
        if (reconnectAttempts >= 2) {
          toast.error('🔌 Connection issues. Please check your internet.');
        }
      });

      setSocket(newSocket);
      return newSocket;
    };

    const newSocket = connectSocket();

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const joinChannel = (channelId) => {
    if (socket && connected) {
      socket.emit('join-channel', channelId);
      console.log(`🔗 WebSocket: Joined channel: ${channelId}`);
    } else {
      console.log(`❌ WebSocket: Cannot join channel ${channelId} - socket not connected`, {
        hasSocket: !!socket,
        connected
      });
    }
  };

  const leaveChannel = (channelId) => {
    if (socket && connected) {
      socket.emit('leave-channel', channelId);
      console.log(`👋 WebSocket: Left channel: ${channelId}`);
    } else {
      console.log(`❌ WebSocket: Cannot leave channel ${channelId} - socket not connected`);
    }
  };

  const value = {
    socket,
    connected,
    messages,
    setMessages,
    joinChannel,
    leaveChannel
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
