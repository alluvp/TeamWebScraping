import React, { useState } from "react";
import { 
  TrendingUp, DollarSign, BarChart3, Sparkles, 
  MessageSquare, LogOut, Menu, X, ArrowRight, PieChart, LineChart,
  Building2, Globe, Clock, User
} from "lucide-react";

const HomePage = ({ 
  isAuthenticated, 
  user, 
  chatHistory, 
  onStartNewChat,  
  onLogout, 
  onLoadChat,
  onToggleSidebar,
  onAuth 
}) => {
  // Auth Modal Component
  const AuthModal = ({ showAuth, onClose, authMode, setAuthMode, onAuth }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    if (!showAuth) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {authMode === 'login' ? 'Welcome Back' : 'Join FiscaleAI'}
            </h2>
            <p className="text-gray-600 mt-2">
              {authMode === 'login' ? 'Sign in to access your financial insights' : 'Create your free account'}
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            onAuth(email, password, username);
          }} className="space-y-4">
            {authMode === 'signup' && (
              <input
                type="text"
                placeholder="Username (optional)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            )}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-green-600 hover:text-green-700"
            >
              {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleAuth = (email, password, username = '') => {
    onAuth && onAuth(email, password, username, authMode);
    setShowAuth(false);
  }

  if (isAuthenticated) {
    // Authenticated Home Page
    return (
      <div className="h-full">
        {/* Top Navigation for Authenticated Home */}
        <nav className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onToggleSidebar}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-green-700 to-green-800 bg-clip-text text-transparent">
                  FiscaleAI
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 hidden sm:block">Welcome, {user?.username}</span>
              <button
                onClick={onLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>
        
        {/* Authenticated Home Page Content */}
        <div className="p-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-700 to-green-800 bg-clip-text text-transparent mb-6">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Ready to dive into financial analysis? Start a new conversation or continue where you left off.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={onStartNewChat}
                className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Start New Analysis</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Recent Chats Preview */}
            {chatHistory.length > 0 && (
              <div className="text-left">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Conversations</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {chatHistory.slice(0, 4).map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => onLoadChat(chat.id)}
                      className="bg-white p-4 rounded-xl border border-green-100 hover:border-green-300 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-800 truncate flex-1">{chat.title}</h3>
                        <Clock className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Non-authenticated Home Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Top Navigation for Non-authenticated */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-green-700 to-green-800 bg-clip-text text-transparent">
              FiscaleAI
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setAuthMode('login');
                setShowAuth(true);
              }}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setShowAuth(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-700 to-green-800 bg-clip-text text-transparent mb-6">
            FiscaleAI
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-powered financial research assistant that transforms complex market data into actionable insights
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowAuth(true)}
              className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Start Financial Analysis</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAuth(true)}
              className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-xl hover:bg-green-50 transition-all duration-200 font-semibold"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-16">
            Powerful Financial Intelligence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="w-8 h-8 text-green-600" />,
                title: "Company Analysis",
                description: "Deep dive into financial statements, ratios, and performance metrics with AI-powered insights."
              },
              {
                icon: <PieChart className="w-8 h-8 text-green-600" />,
                title: "Market Comparisons",
                description: "Compare companies side-by-side across industries with comprehensive benchmarking."
              },
              {
                icon: <LineChart className="w-8 h-8 text-green-600" />,
                title: "Trend Analysis",
                description: "Identify patterns and trends in financial data to make informed investment decisions."
              },
              {
                icon: <DollarSign className="w-8 h-8 text-green-600" />,
                title: "Valuation Models",
                description: "Access sophisticated valuation techniques and financial modeling capabilities."
              },
              {
                icon: <Building2 className="w-8 h-8 text-green-600" />,
                title: "Industry Insights",
                description: "Understand sector dynamics and industry-specific financial metrics."
              },
              {
                icon: <Globe className="w-8 h-8 text-green-600" />,
                title: "Global Markets",
                description: "Analyze companies across international markets with real-time data integration."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-green-100 hover:shadow-lg transition-all duration-200">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "1000+", label: "Companies Analyzed" },
              { number: "50+", label: "Financial Metrics" },
              { number: "99.9%", label: "Data Accuracy" },
              { number: "24/7", label: "Available Support" }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Financial Analysis?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join investors and analysts using FiscaleAI for smarter financial decisions
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-white text-green-600 px-8 py-4 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold flex items-center justify-center space-x-2 mx-auto"
          >
            <Sparkles className="w-5 h-5" />
            <span>Get Started Free</span>
          </button>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal 
        showAuth={showAuth}
        onClose={() => setShowAuth(false)}
        authMode={authMode}
        setAuthMode={setAuthMode}
        onAuth={handleAuth}
      />
    </div>
  );
};

export default HomePage;