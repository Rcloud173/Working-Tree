import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare, Search, Send, Phone, Video, MoreHorizontal, ArrowLeft,
  Check, CheckCheck, Image, Paperclip, Smile, Loader, AlertCircle,
  RefreshCw, Users, X, Plus, MapPin
} from 'lucide-react';

// ============================================================================
// API PLACEHOLDER FUNCTIONS
// ============================================================================
const API_BASE = 'http://localhost:5000/api';
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const messagesApi = {
  fetchConversations: async () => {
    // TODO: GET ${API_BASE}/messages/conversations
    await delay(700);
    return { conversations: DEMO_CONVERSATIONS };
  },
  fetchMessages: async (conversationId) => {
    // TODO: GET ${API_BASE}/messages/${conversationId}
    await delay(500);
    return { messages: DEMO_MESSAGES[conversationId] || [] };
  },
  sendMessage: async (conversationId, content, type = 'text') => {
    // TODO: POST ${API_BASE}/messages/${conversationId}  body: { content, type }
    await delay(300);
    return {
      message: {
        _id: `msg-${Date.now()}`,
        senderId: 'current-user',
        content,
        type,
        timestamp: new Date().toISOString(),
        status: 'sent',
      },
    };
  },
  markAsRead: async (conversationId) => {
    // TODO: PUT ${API_BASE}/messages/${conversationId}/read
    await delay(200);
    return { success: true };
  },
  searchConversations: async (query) => {
    // TODO: GET ${API_BASE}/messages/search?q=${query}
    await delay(400);
    return { conversations: DEMO_CONVERSATIONS.filter(c => c.participant.name.toLowerCase().includes(query.toLowerCase())) };
  },
  createConversation: async (userId) => {
    // TODO: POST ${API_BASE}/messages/conversations  body: { userId }
    await delay(500);
    return { conversationId: `conv-${Date.now()}` };
  },
};

// ============================================================================
// DEMO DATA
// ============================================================================
const DEMO_CONVERSATIONS = [
  {
    _id: 'conv-1',
    participant: { _id: 'u1', name: 'Priya Singh', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', specialty: 'Vegetable Farmer', online: true },
    lastMessage: 'Yes, the drip system works perfectly for tomatoes!',
    lastMessageTime: '2m ago', unreadCount: 2, lastMessageSenderId: 'u1',
  },
  {
    _id: 'conv-2',
    participant: { _id: 'u2', name: 'Amit Patel', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', specialty: 'Sugarcane Consultant', online: false },
    lastMessage: 'Can you share the subsidy application form?',
    lastMessageTime: '1h ago', unreadCount: 0, lastMessageSenderId: 'current-user',
  },
  {
    _id: 'conv-3',
    participant: { _id: 'u3', name: 'Neha Sharma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', specialty: 'Rice Farmer', online: true },
    lastMessage: 'The new variety gives 20% more yield 🌾',
    lastMessageTime: '3h ago', unreadCount: 5, lastMessageSenderId: 'u3',
  },
  {
    _id: 'conv-4',
    participant: { _id: 'u4', name: 'Ramesh Yadav', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', specialty: 'Rice Cultivation', online: false },
    lastMessage: 'Thanks for the advice on fertilizer timing!',
    lastMessageTime: 'Yesterday', unreadCount: 0, lastMessageSenderId: 'u4',
  },
  {
    _id: 'conv-5',
    participant: { _id: 'u5', name: 'Meena Kumari', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop', specialty: 'Dairy & Poultry', online: false },
    lastMessage: 'When is the next KrishiMela event?',
    lastMessageTime: '2 days ago', unreadCount: 1, lastMessageSenderId: 'u5',
  },
];

const DEMO_MESSAGES = {
  'conv-1': [
    { _id: 'm1', senderId: 'u1', content: 'Namaste! I saw your post about drip irrigation. Very helpful!', type: 'text', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'read' },
    { _id: 'm2', senderId: 'current-user', content: 'Thank you Priya ji! Are you using drip for tomatoes?', type: 'text', timestamp: new Date(Date.now() - 3500000).toISOString(), status: 'read' },
    { _id: 'm3', senderId: 'u1', content: 'Yes! I installed it last season. Water usage dropped by 40%.', type: 'text', timestamp: new Date(Date.now() - 3400000).toISOString(), status: 'read' },
    { _id: 'm4', senderId: 'current-user', content: 'That is excellent! What brand did you use? I am planning for my farm.', type: 'text', timestamp: new Date(Date.now() - 3300000).toISOString(), status: 'read' },
    { _id: 'm5', senderId: 'u1', content: 'Netafim — but Jain Irrigation is also good and cheaper.', type: 'text', timestamp: new Date(Date.now() - 180000).toISOString(), status: 'read' },
    { _id: 'm6', senderId: 'u1', content: 'Yes, the drip system works perfectly for tomatoes!', type: 'text', timestamp: new Date(Date.now() - 120000).toISOString(), status: 'delivered' },
  ],
  'conv-2': [
    { _id: 'n1', senderId: 'u2', content: 'Bhai, I need advice on sugarcane ratoon management.', type: 'text', timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'read' },
    { _id: 'n2', senderId: 'current-user', content: 'Sure! How old is your first crop?', type: 'text', timestamp: new Date(Date.now() - 7100000).toISOString(), status: 'read' },
    { _id: 'n3', senderId: 'u2', content: '10 months. Should I apply nitrogen now?', type: 'text', timestamp: new Date(Date.now() - 7000000).toISOString(), status: 'read' },
    { _id: 'n4', senderId: 'current-user', content: 'Yes, split dose is best. 1/3 at ratoon emergence, 2/3 after 45 days.', type: 'text', timestamp: new Date(Date.now() - 6900000).toISOString(), status: 'read' },
    { _id: 'n5', senderId: 'current-user', content: 'Can you share the subsidy application form?', type: 'text', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'sent' },
  ],
};

// ============================================================================
// UTILITY
// ============================================================================
const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const groupMessagesByDate = (messages) => {
  const groups = {};
  messages.forEach(msg => {
    const date = new Date(msg.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
  });
  return groups;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const ConversationItem = ({ convo, isActive, onClick }) => (
  <button onClick={() => onClick(convo)}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:bg-gray-50 ${isActive ? 'bg-green-50 border border-green-100' : ''}`}>
    <div className="relative flex-shrink-0">
      <img src={convo.participant.avatar} alt={convo.participant.name}
        className={`w-12 h-12 rounded-full object-cover border-2 ${isActive ? 'border-green-400' : 'border-gray-100'}`} />
      {convo.participant.online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <p className={`text-sm font-bold truncate ${isActive ? 'text-green-800' : 'text-gray-900'}`}>{convo.participant.name}</p>
        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{convo.lastMessageTime}</span>
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <p className={`text-xs truncate max-w-[140px] ${convo.unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
          {convo.lastMessageSenderId === 'current-user' && <span className="text-gray-400">You: </span>}
          {convo.lastMessage}
        </p>
        {convo.unreadCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-green-600 text-white text-xs rounded-full font-bold flex-shrink-0 min-w-[18px] text-center">{convo.unreadCount}</span>
        )}
      </div>
    </div>
  </button>
);

const MessageBubble = ({ message, isMine }) => (
  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
      isMine
        ? 'bg-green-600 text-white rounded-br-sm'
        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
    }`}>
      <p>{message.content}</p>
      <div className={`flex items-center gap-1 justify-end mt-1 ${isMine ? 'opacity-70' : 'opacity-50'}`}>
        <span className="text-xs">{formatTime(message.timestamp)}</span>
        {isMine && (
          message.status === 'read' ? <CheckCheck size={12} className="text-green-200" /> :
          message.status === 'delivered' ? <CheckCheck size={12} /> :
          <Check size={12} />
        )}
      </div>
    </div>
  </div>
);

const TypingIndicator = () => (
  <div className="flex justify-start mb-2">
    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1">
        {[0, 150, 300].map(delay => (
          <div key={delay} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN MESSAGES PAGE
// ============================================================================
const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { conversations: convos } = await messagesApi.fetchConversations();
      setConversations(convos);
    } catch {
      setError('Failed to load messages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSelectConvo = async (convo) => {
    setActiveConvo(convo);
    setShowSidebar(false);
    setMessagesLoading(true);
    try {
      const { messages: msgs } = await messagesApi.fetchMessages(convo._id);
      setMessages(msgs);
      await messagesApi.markAsRead(convo._id);
      setConversations(prev => prev.map(c => c._id === convo._id ? { ...c, unreadCount: 0 } : c));
    } catch { } finally { setMessagesLoading(false); }
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !activeConvo || sending) return;
    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    // Optimistic update
    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      senderId: 'current-user',
      content,
      type: 'text',
      timestamp: new Date().toISOString(),
      status: 'sent',
    };
    setMessages(prev => [...prev, optimisticMsg]);

    // Simulate typing indicator from other side
    setTimeout(() => setIsTyping(true), 800);
    setTimeout(() => setIsTyping(false), 2500);

    try {
      const { message } = await messagesApi.sendMessage(activeConvo._id, content);
      setMessages(prev => prev.map(m => m._id === optimisticMsg._id ? message : m));
      setConversations(prev => prev.map(c => c._id === activeConvo._id
        ? { ...c, lastMessage: content, lastMessageTime: 'now', lastMessageSenderId: 'current-user' } : c));
    } catch {
      setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
    } finally {
      setSending(false);
    }
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { loadConversations(); return; }
    const { conversations: results } = await messagesApi.searchConversations(q);
    setConversations(results);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
          <MessageSquare size={20} className="text-green-600" />
          <h1 className="font-black text-gray-900">Messages</h1>
          {totalUnread > 0 && (
            <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-bold">{totalUnread}</span>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Conversations Sidebar */}
          <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 bg-white border-r border-gray-100 flex-shrink-0`}>
            {/* Search */}
            <div className="p-3 border-b border-gray-50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="search" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:bg-white transition" />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {loading ? (
                <div className="space-y-2 p-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{error}</p>
                  <button onClick={loadConversations} className="mt-3 text-xs text-green-600 font-semibold hover:underline flex items-center gap-1 mx-auto">
                    <RefreshCw size={12} /> Retry
                  </button>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="font-semibold text-gray-700 text-sm">No conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1">Connect with farmers to start chatting</p>
                </div>
              ) : (
                conversations.map(convo => (
                  <ConversationItem key={convo._id} convo={convo}
                    isActive={activeConvo?._id === convo._id}
                    onClick={handleSelectConvo} />
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${!showSidebar ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-gray-50 min-w-0`}>
            {!activeConvo ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">🌾</div>
                <p className="font-bold text-gray-700 text-lg">Welcome to KrishiConnect Messages</p>
                <p className="text-gray-400 text-sm mt-2">Select a conversation to start chatting with farmers</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
                  <button onClick={() => setShowSidebar(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-xl text-gray-500">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="relative">
                    <img src={activeConvo.participant.avatar} alt={activeConvo.participant.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-green-100" />
                    {activeConvo.participant.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{activeConvo.participant.name}</p>
                    <p className="text-xs text-gray-400">
                      {activeConvo.participant.online ? (
                        <span className="text-green-600 font-medium">● Online</span>
                      ) : (
                        activeConvo.participant.specialty
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition">
                      <Phone size={16} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition">
                      <Video size={16} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader size={24} className="text-green-600 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-4xl mb-3">👋</div>
                      <p className="font-semibold text-gray-700">Say hello to {activeConvo.participant.name}!</p>
                      <p className="text-xs text-gray-400 mt-1">Start a conversation about farming</p>
                    </div>
                  ) : (
                    <>
                      {Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400 font-medium px-2">{date}</span>
                            <div className="flex-1 h-px bg-gray-200" />
                          </div>
                          {msgs.map(msg => (
                            <MessageBubble key={msg._id} message={msg} isMine={msg.senderId === 'current-user'} />
                          ))}
                        </div>
                      ))}
                      {isTyping && <TypingIndicator />}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0">
                  <div className="flex items-end gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition flex-shrink-0 mb-0.5">
                      <Paperclip size={18} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition flex-shrink-0 mb-0.5">
                      <Image size={18} />
                    </button>
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        rows={1}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full px-4 py-2.5 text-sm bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-200 resize-none transition leading-relaxed max-h-28 overflow-y-auto"
                        style={{ minHeight: '42px' }}
                      />
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition flex-shrink-0 mb-0.5">
                      <Smile size={18} />
                    </button>
                    <button onClick={handleSend} disabled={!messageInput.trim() || sending}
                      className="p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-40 transition flex-shrink-0 mb-0.5 shadow-sm hover:shadow-md">
                      {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">Press Enter to send • Shift+Enter for new line</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
