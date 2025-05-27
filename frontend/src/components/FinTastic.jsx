import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, TrendingUp, DollarSign, BarChart3, Sparkles, LogOut, Menu, X } from "lucide-react";

export default function FinTastic({ 
  user, 
  onGoHome, 
  onLogout, 
  chatHistory, 
  setChatHistory, 
  currentChatId, 
  setCurrentChatId,
  onStartNewChat,
  onLoadChat 
}) {
  const [messages, setMessages] = useState(() => {
    if (currentChatId && chatHistory.length > 0) {
      const currentChat = chatHistory.find(chat => chat.id === currentChatId);
      return currentChat ? currentChat.messages : [
        {
          id: 1,
          type: 'bot',
          content: "👋 Hello! I'm FinTastic, your AI-powered financial research assistant...",
          timestamp: new Date()
        }
      ];
    }
    return [
      {
        id: 1,
        type: 'bot',
        content: "👋 Hello! I'm FinTastic, your AI-powered financial research assistant...",
        timestamp: new Date()
      }
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  const saveChatToHistory = (chatMessages) => {
    if (!currentChatId) return;
    
    const chatTitle = chatMessages.find(m => m.type === 'user')?.content.slice(0, 50) + '...' || 'New Chat';
    const updatedHistory = [...chatHistory];
    const existingChatIndex = updatedHistory.findIndex(chat => chat.id === currentChatId);
    
    const chatData = {
      id: currentChatId,
      title: chatTitle,
      messages: chatMessages,
      updatedAt: new Date().toISOString()
    };
    
    if (existingChatIndex >= 0) {
      updatedHistory[existingChatIndex] = chatData;
    } else {
      updatedHistory.unshift(chatData);
    }
    
    setChatHistory(updatedHistory);
    localStorage.setItem('fintastic_chats', JSON.stringify(updatedHistory));
  };


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!input.trim() || loading) return;

  // If no current chat, create new one
  if (!currentChatId) {
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
  }

  const userMessage = {
    id: Date.now(),
    type: 'user',
    content: input.trim(),
    timestamp: new Date()
  };

  const newMessages = [...messages, userMessage];
  setMessages(newMessages);
  setInput("");
  setLoading(true);

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input.trim() }),
    });
    
    const data = await res.json();
    
    const botMessage = {
      id: Date.now() + 1,
      type: 'bot',
      content: data.answer || "I apologize, but I couldn't generate a response. Please try rephrasing your question.",
      timestamp: new Date()
    };
    
    const finalMessages = [...newMessages, botMessage];
    setMessages(finalMessages);
    saveChatToHistory(finalMessages);
  } catch (error) {
    console.error("Error fetching answer:", error);
    const errorMessage = {
      id: Date.now() + 1,
      type: 'bot',
      content: "I'm experiencing some technical difficulties. Please check your connection and try again.",
      timestamp: new Date()
    };
    const finalMessages = [...newMessages, errorMessage];
    setMessages(finalMessages);
    saveChatToHistory(finalMessages);
  } finally {
    setLoading(false);
  }
};


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestedQuestions = [
    "What are Apple's recent financial highlights?",
    "Compare Tesla vs Ford's performance",
    "Show me Microsoft's revenue trends",
    "What's Amazon's debt-to-equity ratio?"
  ];

  const handleSuggestionClick = (question) => {
    setInput(question);
    textareaRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-green-100 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-green-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Chat History</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => {
              onStartNewChat();
              setMessages([{
                id: 1,
                type: 'bot',
                content: "👋 Hello! I'm FinTastic, your AI-powered financial research assistant. I can help you analyze company performance, compare financials, and provide insights on market trends. What would you like to know?",
                timestamp: new Date()
              }]);
            }}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            + New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                onLoadChat(chat.id);
                setMessages(chat.messages);
              }}
              className={`w-full p-3 text-left hover:bg-green-50 border-b border-green-50 ${
                currentChatId === chat.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
              }`}
            >
              <div className="text-sm font-medium text-gray-800 truncate">{chat.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(chat.updatedAt).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
        
        {/* User info at bottom */}
        <div className="p-4 border-t border-green-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{user?.username}</div>
              <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            </div>
            <button
              onClick={onLogout}
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
  
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-800 bg-clip-text text-transparent">
                  FinTastic
                </h1>
                <p className="text-sm text-green-600">AI Financial Research Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-600">
                <DollarSign className="w-4 h-4" />
                <BarChart3 className="w-4 h-4" />
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
          </div>
        </header>
  
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-6 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-green-600' 
                        : 'bg-gradient-to-r from-green-500 to-green-600'
                    }`}>
                      {message.type === 'user' ? 
                        <User className="w-5 h-5 text-white" /> : 
                        <Bot className="w-5 h-5 text-white" />
                      }
                    </div>
                  </div>
                  
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-green-100 text-gray-800'
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start mb-6">
                <div className="flex max-w-[80%]">
                  <div className="mr-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="bg-white border border-green-100 rounded-2xl px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-green-600 text-sm">Analyzing...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
  
        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="max-w-4xl mx-auto px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(question)}
                  className="text-left p-3 bg-white border border-green-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-sm text-gray-700"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
  
        {/* Input Area */}
        <div className="bg-white/80 backdrop-blur-sm border-t border-green-100">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="relative">
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask about company financials, market trends, or investment insights..."
                    className="w-full resize-none rounded-xl border border-green-200 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500 text-gray-800"
                    rows="1"
                    style={{
                      minHeight: '48px',
                      maxHeight: '120px',
                      overflowY: 'auto'
                    }}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!input.trim() || loading}
                    className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200 ${
                      input.trim() && !loading
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              FinTastic can make mistakes. Consider checking important financial information.
            </div>
          </div>
        </div>
      </div>
    </div>
  );}