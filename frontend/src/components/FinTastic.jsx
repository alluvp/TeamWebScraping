import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, TrendingUp,LogOut, Menu, X, HelpCircle, BookOpen} from "lucide-react";

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
  // Default welcome message
  const defaultMessage = {
    id: 1,
    type: 'bot',
    content: "👋 Hello! I'm FiscaleAI, your AI-powered financial research assistant. I can help you analyze company performance, compare financials, and provide insights on market trends. What would you like to know?",
    timestamp: new Date()
  };

  const [messages, setMessages] = useState(() => {
    try {
      if (currentChatId && chatHistory && chatHistory.length > 0) {
        const currentChat = chatHistory.find(chat => chat.id === currentChatId);
        if (currentChat && currentChat.messages) {
          return currentChat.messages;
        }
      }
      return [defaultMessage];
    } catch (error) {
      console.error("Error initializing messages:", error);
      return [defaultMessage];
    }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const scrollToBottom = () => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error scrolling to bottom:", error);
    }
  };

  const saveChatToHistory = (chatMessages) => {
    try {
      if (!currentChatId || !chatMessages || !user) {
        console.warn("Cannot save chat: missing required data");
        return;
      }
      
      const chatTitle = chatMessages.find(m => m.type === 'user')?.content?.slice(0, 50) + '...' || 'New Chat';
      const updatedHistory = Array.isArray(chatHistory) ? [...chatHistory] : [];
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
      
      // Safe localStorage access
      if (typeof window !== 'undefined' && window.localStorage && user.email) {
        try {
          localStorage.setItem(`fintastic_chats_${user.email}`, JSON.stringify(updatedHistory));
        } catch (storageError) {
          console.warn("Could not save to localStorage:", storageError);
        }
      }
    } catch (error) {
      console.error("Error saving chat to history:", error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    try {
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

      // API call with better error handling
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input.trim() }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
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
      console.error("Error in handleSubmit:", error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: error.message.includes('Failed to fetch') 
          ? "I'm having trouble connecting to the server. Please check your internet connection and try again."
          : "I'm experiencing some technical difficulties. Please try again in a moment.",
        timestamp: new Date()
      };
      
      const newMessages = [...messages, {
        id: Date.now(),
        type: 'user',
        content: input.trim(),
        timestamp: new Date()
      }];
      
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      saveChatToHistory(finalMessages);
      setInput("");
      
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
    "Compare NFLX and Google's EBITDA",
    "Show me Microsoft's revenue trends",
    "What's Amazon's debt-to-equity ratio?"
  ];

  const handleSuggestionClick = (question) => {
    setInput(question);
    textareaRef.current?.focus();
  };

  const handleNewChat = () => {
    try {
      onStartNewChat();
      setMessages([defaultMessage]);
    } catch (error) {
      console.error("Error starting new chat:", error);
    }
  };

  const handleLoadChat = (chatId) => {
    try {
      const chat = chatHistory.find(c => c.id === chatId);
      if (chat && chat.messages) {
        onLoadChat(chatId);
        setMessages(chat.messages);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  const financialMetrics = {
    "Revenue & Profitability": {
      "Revenue": "Total income generated from business operations before any expenses. Also called 'Sales' or 'Top Line'.",
      "Net Income": "Company's total profit after all expenses, taxes, and costs. Also called 'Bottom Line' or 'Earnings'.",
      "Gross Profit": "Revenue minus the cost of goods sold (COGS). Shows profitability before operating expenses.",
      "Operating Income": "Profit from regular business operations, excluding interest and taxes (EBIT).",
      "EBITDA": "Earnings Before Interest, Taxes, Depreciation, and Amortization. Measures operating performance.",
      "Profit Margin": "Percentage of revenue that becomes profit. Higher percentages indicate better profitability."
    },
    "Financial Health": {
      "Market Cap": "Total value of a company's shares. Calculated as stock price × total shares outstanding.",
      "Debt-to-Equity Ratio": "Compares company's debt to shareholders' equity. Lower ratios generally indicate less financial risk.",
      "Current Ratio": "Current assets divided by current liabilities. Measures ability to pay short-term debts.",
      "Cash Flow": "Net amount of cash moving in and out of business. Positive cash flow means more money coming in than going out.",
      "ROE (Return on Equity)": "Measures profitability relative to shareholder equity. Shows how well company uses shareholder investments.",
      "ROA (Return on Assets)": "Measures how efficiently company uses its assets to generate profit."
    },
    "Valuation Metrics": {
      "P/E Ratio": "Price-to-Earnings ratio. Stock price divided by earnings per share. Lower ratios may indicate undervalued stocks.",
      "EPS (Earnings Per Share)": "Company's profit divided by number of outstanding shares. Higher EPS generally better.",
      "Book Value": "Company's net worth if liquidated today. Assets minus liabilities divided by shares outstanding.",
      "PEG Ratio": "P/E ratio adjusted for earnings growth rate. Helps identify fairly valued growth stocks.",
      "Dividend Yield": "Annual dividend payment as percentage of stock price. Higher yields provide more income."
    },
    "Growth & Performance": {
      "Revenue Growth": "Percentage increase in revenue compared to previous period. Shows business expansion.",
      "Earnings Growth": "Percentage increase in earnings compared to previous period. Indicates improving profitability.",
      "Free Cash Flow": "Cash left after capital expenditures. Available for dividends, debt repayment, or reinvestment.",
      "Operating Margin": "Operating income as percentage of revenue. Shows operational efficiency."
    }
  };

  const CheatSheetModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Financial Cheat Sheet</h2>
              <p className="text-gray-600">Understanding key financial metrics</p>
            </div>
          </div>
          <button
            onClick={() => setShowCheatSheet(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-8">
            {Object.entries(financialMetrics).map(([category, metrics]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  {category}
                </h3>
                <div className="grid gap-4">
                  {Object.entries(metrics).map(([term, definition]) => (
                    <div key={term} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-700 mb-2">{term}</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">💡 Pro Tip</h4>
              <p className="text-green-700 text-sm">
                Don't rely on just one metric! Use multiple financial indicators together to get a complete picture of a company's health. 
                Compare metrics to industry averages and competitors for better context.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Safety check for user object
  const safeUser = user || { username: 'Guest', email: 'guest@example.com' };
  const safeChatHistory = Array.isArray(chatHistory) ? chatHistory : [];

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
            onClick={handleNewChat}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            + New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {safeChatHistory.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleLoadChat(chat.id)}
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
              <div className="text-sm font-medium text-gray-800 truncate">{safeUser.username}</div>
              <div className="text-xs text-gray-500 truncate">{safeUser.email}</div>
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
                  FiscaleAI
                </h1>
                <p className="text-sm text-green-600">AI Financial Research Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-600">
              </div>
              <button
                onClick={() => setShowCheatSheet(true)}
                className="flex items-center space-x-2 text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-2 rounded-lg transition-all duration-200"
                title="Financial Cheat Sheet"
              >
                <HelpCircle className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Guide</span>
              </button>
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
              FiscaleAI can make mistakes. Consider checking important financial information.
            </div>
          </div>
        </div>
      </div>
      
      {showCheatSheet && <CheatSheetModal />}
    </div>
  );
}