import React, { useState, useEffect } from 'react';
import HomePage from './components/Homepage';
import FinTastic from './components/FinTastic';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'chat'
  const [chatHistory, setChatHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null)

  // Check for existing authentication on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('fintastic_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
    
    // Load chat history if authenticated
    const savedChats = localStorage.getItem('fintastic_chats');
    if (savedChats) {
      setChatHistory(JSON.parse(savedChats));
    }
  }, []);

  const handleAuth = (email, password, username = '', authMode) => {
    if (authMode === 'signup') {
      const newUser = {
        id: Date.now(),
        email,
        username: username || email.split('@')[0],
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('fintastic_user', JSON.stringify(newUser));
      setUser(newUser);

    } else {
      // For demo purposes, create user from login info
      // In real app, you'd validate against a backend
      const loginUser = {
        id: Date.now(),
        email,
        username: email.split('@')[0],
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('fintastic_user', JSON.stringify(loginUser));
      setUser(loginUser);
    }
    setIsAuthenticated(true);
    setCurrentView('chat');
  };

  const handleLogout = () => {
    localStorage.removeItem('fintastic_user');
    setUser(null);
    setIsAuthenticated(false);
    setCurrentView('home');
  };

  const handleStartNewChat = () => {
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setCurrentView('chat');
  };

  const handleGoHome = () => {
    setCurrentView('home');
  };

  const handleLoadChat = (chatId) => {
    setCurrentChatId(chatId);
    setCurrentView('chat');
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (currentView === 'chat' && isAuthenticated) {
    return (
      <FinTastic
        user={user}
        onGoHome={handleGoHome}
        onLogout={handleLogout}
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
        onStartNewChat={handleStartNewChat}
        onLoadChat={handleLoadChat}
      />
    );
  }

  return (
    <HomePage
      isAuthenticated={isAuthenticated}
      user={user}
      chatHistory={chatHistory}
      onStartNewChat={handleStartNewChat}
      onLogout={handleLogout}
      onLoadChat={handleLoadChat}
      onToggleSidebar={handleToggleSidebar}
      onAuth={handleAuth}
    />
  );
}