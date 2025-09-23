import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { MessageSquare, Users, Send, Bell, User, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Logo = styled.div`
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  backdrop-filter: blur(10px);
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: -1px;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0.5rem 0 0 0;
`;

const WelcomeCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 2rem;
  margin-bottom: 2rem;
  max-width: 600px;
  width: 100%;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
`;

const WelcomeTitle = styled.h2`
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 1rem;
  text-align: center;
`;

const UserInfo = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
`;

const RoleSelection = styled.div`
  margin-bottom: 2rem;
`;

const RoleTitle = styled.h3`
  font-size: 1.2rem;
  color: #555;
  margin-bottom: 1rem;
  text-align: center;
`;

const RoleGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const RoleCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
  }
`;

const RoleIcon = styled.div`
  width: 60px;
  height: 60px;
  background: ${props => props.color};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
`;

const RoleCardTitle = styled.h4`
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 0.5rem;
`;

const RoleDescription = styled.p`
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0 0 0;
`;

const FeatureItem = styled.li`
  font-size: 0.85rem;
  color: #555;
  margin: 0.3rem 0;
  padding-left: 1rem;
  position: relative;
  
  &:before {
    content: '▶';
    position: absolute;
    left: 0;
    color: #667eea;
    font-size: 0.7rem;
  }
`;

const ChatButton = styled(motion.button)`
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  }
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const LoginInput = styled.input`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &::placeholder {
    color: #adb5bd;
  }
`;

const LoginButton = styled(motion.button)`
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  }
`;

const LogoutButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 12px;
  padding: 0.8rem 1.2rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const HomePage = ({ currentUser, isAuthenticated }) => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    const success = await login(username, 'subscriber');
    setLoading(false);
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'publisher') {
      navigate('/studio');
    } else {
      navigate('/subscriber');
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <Container>
      <Header>
        <Logo>
          <MessageSquare size={40} color="white" />
        </Logo>
        <Title>INGFO MIN</Title>
        <Subtitle>Demo Messaging Service</Subtitle>
        
        {isAuthenticated && (
          <LogoutButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
          >
            <User size={16} />
            {currentUser?.name} - Logout
          </LogoutButton>
        )}
      </Header>

      <WelcomeCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {!isAuthenticated ? (
          // Login Form
          <>
            <WelcomeTitle>Masukkan Username Anda</WelcomeTitle>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#666' }}>
              <User size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
              <p>Silakan masukkan username untuk melanjutkan</p>
            </div>

            <LoginForm onSubmit={handleLogin}>
              <LoginInput
                type="text"
                placeholder="Masukkan username (minimal 2 karakter)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={2}
                autoFocus
              />
              <LoginButton
                type="submit"
                disabled={loading || username.trim().length < 2}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogIn size={20} />
                {loading ? 'Masuk...' : 'Masuk'}
              </LoginButton>
            </LoginForm>

            <div style={{ 
              fontSize: '0.9rem', 
              color: '#666', 
              textAlign: 'center',
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              💡 <strong>Tips:</strong> Username akan disimpan untuk sesi selanjutnya
            </div>
          </>
        ) : (
          // Role Selection (when logged in)
          <>
            <WelcomeTitle>Selamat datang kembali!</WelcomeTitle>
            
            <UserInfo>
              <div>👋 Halo, <strong>{currentUser?.name}</strong></div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                Terakhir login: {new Date().toLocaleString('id-ID')}
              </div>
            </UserInfo>

            <RoleSelection>
              <RoleTitle>Pilih Peran Kamu</RoleTitle>
              
              <RoleGrid>
                <RoleCard
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect('publisher')}
                >
                  <RoleIcon color="linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)">
                    <Send size={24} />
                  </RoleIcon>
                  <RoleCardTitle>Pengirim Pesan</RoleCardTitle>
                  <RoleDescription>
                    Buat channel dan kirim pesan ke banyak orang sekaligus
                  </RoleDescription>
                  <FeatureList>
                    <FeatureItem>Buat channel baru</FeatureItem>
                    <FeatureItem>Kirim pesan broadcast</FeatureItem>
                    <FeatureItem>Lihat statistik</FeatureItem>
                    <FeatureItem>Kelola subscriber</FeatureItem>
                  </FeatureList>
                </RoleCard>

                <RoleCard
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect('subscriber')}
                >
                  <RoleIcon color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                    <Users size={24} />
                  </RoleIcon>
                  <RoleCardTitle>Penerima Pesan</RoleCardTitle>
                  <RoleDescription>
                    Cari dan subscribe channel untuk dapat notifikasi real-time
                  </RoleDescription>
                  <FeatureList>
                    <FeatureItem>Jelajahi channel</FeatureItem>
                    <FeatureItem>Subscribe/unsubscribe</FeatureItem>
                    <FeatureItem>Notifikasi real-time</FeatureItem>
                    <FeatureItem>Riwayat pesan</FeatureItem>
                  </FeatureList>
                </RoleCard>
              </RoleGrid>
            </RoleSelection>

            <ChatButton
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/subscriber')}
            >
              <MessageSquare size={20} />
              Mulai Chat
            </ChatButton>
          </>
        )}
      </WelcomeCard>
    </Container>
  );
};

export default HomePage;
