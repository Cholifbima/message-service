import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import Particles from './components/Particles';
import HomePage from './pages/HomePage';
import StudioBroadcast from './pages/StudioBroadcast';
import SubscriberHub from './pages/SubscriberHub';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContainer = styled.div`
  min-height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #0e0e12 0%, #151520 100%);
  overflow: hidden;
`;

const LoadingScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: white;
  font-size: 18px;
`;

function AppRoutes() {
  const { currentUser, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <AppContainer>
        <LoadingScreen>
          Loading...
        </LoadingScreen>
      </AppContainer>
    );
  }

  return (
    <SocketProvider>
      <AppContainer>
        <Particles
          particleColors={['#ffffff', '#ffffff']}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage 
                currentUser={currentUser} 
                isAuthenticated={isAuthenticated} 
              />
            } 
          />
          <Route 
            path="/studio" 
            element={
              isAuthenticated ? 
                <StudioBroadcast currentUser={currentUser} /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/subscriber" 
            element={
              isAuthenticated ? 
                <SubscriberHub currentUser={currentUser} /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppContainer>
    </SocketProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
