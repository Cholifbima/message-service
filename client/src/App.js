import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import HomePage from './pages/HomePage';
import StudioBroadcast from './pages/StudioBroadcast';
import SubscriberHub from './pages/SubscriberHub';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
