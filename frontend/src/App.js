import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import LobbyPage from './pages/LobbyPage';
import EditorPage from './pages/EditorPage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'#7c6dfa',fontFamily:'Syne,sans-serif' }}>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/" element={<PrivateRoute><LobbyPage /></PrivateRoute>} />
        <Route path="/room/:roomId" element={<PrivateRoute><EditorPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
