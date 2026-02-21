import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Search, Send, Phone, Video, MoreHorizontal, ArrowLeft,
  Check, CheckCheck, Image, Paperclip, Smile, Loader, AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { chatService } from '../services/chat.service';
import { useSocket } from '../context/SocketContext';

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

// Map backend conversation to list item shape (other participant, lastMessage text/time).
function mapConversation(conv, currentUserId) {
  const other = conv.participants?.find((p) => String(p.user?._id ?? p.user) !== String(currentUserId));
  const user = other?.user ?? other;
  const lastSenderId = conv.lastMessage?.sender ? (conv.lastMessage.sender._id ?? conv.lastMessage.sender) : null;
  return {
    _id: conv._id,
    participant: {
      _id: user?._id ?? user,
      name: user?.name ?? 'User',
      avatar: user?.avatar ?? user?.profilePhoto,
      specialty: user?.headline ?? '',
      online: false,
    },
    lastMessage: conv.lastMessage?.text ?? '',
    lastMessageTime: conv.lastMessage?.sentAt ? formatTime(conv.lastMessage.sentAt) : '',
    unreadCount: 0,
    lastMessageSenderId: lastSenderId ?? null,
  };
}

// Map backend message to bubble shape (senderId, content, timestamp, status).
function mapMessage(msg, currentUserId) {
  const senderId = msg.sender?._id ?? msg.sender ?? msg.senderId;
  const content = typeof msg.content === 'object' && msg.content?.text != null ? msg.content.text : (msg.content ?? '');
  return {
    _id: msg._id,
    senderId: String(senderId),
    content,
    type: msg.type || 'text',
    timestamp: msg.createdAt ?? msg.timestamp,
    status: msg.status ?? 'sent',
  };
}

// ============================================================================
// UTILITY
// ============================================================================
const groupMessagesByDate = (messages) => {
  const groups = {};
  messages.forEach((msg) => {
    const date = new Date(msg.timestamp || msg.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
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
  const location = useLocation();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((s) => s.user?._id ?? null);
  const { joinConversation, leaveConversation, sendMessage: socketSendMessage, emitTypingStart, emitTypingStop, subscribe, connected } = useSocket();

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
  const typingTimeoutRef = useRef(null);
  const activeConvoIdRef = useRef(null);
  activeConvoIdRef.current = activeConvo?._id;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { conversations: list } = await chatService.getConversations();
      const mapped = (list || []).map((c) => mapConversation(c, currentUserId));
      const openConv = location.state?.openConversation;
      const toSet = openConv
        ? [mapConversation(openConv, currentUserId), ...mapped.filter((c) => String(c._id) !== String(openConv._id))]
        : mapped;
      setConversations(toSet);
      return toSet;
    } catch {
      setError('Failed to load conversations.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUserId, location]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Open conversation from profile "Chat" (state.openConversationId or state.openConversation)
  const openFromState = location.state?.openConversationId ?? location.state?.openConversation?._id;
  useEffect(() => {
    if (!openFromState || !currentUserId) return;
    const openConv = location.state?.openConversation;
    if (openConv) {
      const mapped = mapConversation(openConv, currentUserId);
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === mapped._id);
        if (exists) return prev;
        return [mapped, ...prev];
      });
      setActiveConvo(mapped);
      setShowSidebar(false);
      setMessagesLoading(true);
      chatService.getMessages(mapped._id).then(({ messages: msgs }) => {
        setMessages((msgs || []).map((m) => mapMessage(m, currentUserId)).reverse());
        setMessagesLoading(false);
      }).catch(() => setMessagesLoading(false));
    } else {
      const run = async () => {
        const list = await loadConversations();
        const found = list.find((c) => c._id === openFromState);
        if (found) {
          setActiveConvo(found);
          setShowSidebar(false);
          setMessagesLoading(true);
          try {
            const { messages: msgs } = await chatService.getMessages(openFromState);
            setMessages((msgs || []).map((m) => mapMessage(m, currentUserId)).reverse());
          } finally {
            setMessagesLoading(false);
          }
        }
      };
      run();
    }
    navigate('/messages', { replace: true, state: {} });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSelectConvo = useCallback(async (convo) => {
    if (activeConvo?._id) leaveConversation(activeConvo._id);
    setActiveConvo(convo);
    setShowSidebar(false);
    setMessagesLoading(true);
    joinConversation(convo._id);
    try {
      const { messages: msgs } = await chatService.getMessages(convo._id);
      setMessages((msgs || []).map((m) => mapMessage(m, currentUserId)).reverse());
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [activeConvo?._id, currentUserId, joinConversation, leaveConversation]);

  const handleSend = useCallback(() => {
    if (!messageInput.trim() || !activeConvo || sending) return;
    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      senderId: String(currentUserId),
      content,
      type: 'text',
      timestamp: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    socketSendMessage(activeConvo._id, 'text', content);
    setConversations((prev) =>
      prev.map((c) =>
        c._id === activeConvo._id
          ? { ...c, lastMessage: content, lastMessageTime: 'now', lastMessageSenderId: String(currentUserId) }
          : c
      )
    );
    setSending(false);
  }, [messageInput, activeConvo, sending, currentUserId, socketSendMessage]);

  useEffect(() => {
    if (!activeConvo?._id) return;
    const unsubNew = subscribe('message:new', (payload) => {
      const convId = payload?.conversation ?? payload?.conversationId;
      if (String(convId) !== String(activeConvo._id)) return;
      const mapped = mapMessage(payload, currentUserId);
      setMessages((prev) => {
        if (prev.some((m) => m._id === mapped._id)) return prev;
        const isFromMe = String(mapped.senderId) === String(currentUserId);
        if (isFromMe) {
          const withoutTemp = prev.filter((m) => !String(m._id).startsWith('temp-'));
          return [...withoutTemp, mapped];
        }
        return [...prev, mapped];
      });
    });
    const unsubTyping = subscribe('user:typing', ({ conversationId, userId }) => {
      if (conversationId === activeConvo._id && String(userId) !== String(currentUserId)) setIsTyping(true);
    });
    const unsubStopped = subscribe('user:stopped-typing', ({ conversationId }) => {
      if (conversationId === activeConvo._id) setIsTyping(false);
    });
    const unsubErr = subscribe('error', (err) => {
      if (err?.message) setError(err.message);
    });
    return () => {
      unsubNew();
      unsubTyping();
      unsubStopped();
      unsubErr();
    };
  }, [activeConvo?._id, currentUserId, subscribe]);

  const handleTypingChange = useCallback(() => {
    if (!activeConvo?._id) return;
    emitTypingStart(activeConvo._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(activeConvo._id);
      typingTimeoutRef.current = null;
    }, 2000);
  }, [activeConvo?._id, emitTypingStart, emitTypingStop]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      const id = activeConvoIdRef.current;
      if (id) leaveConversation(id);
    };
  }, [leaveConversation]);

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) loadConversations();
    else setConversations((prev) => prev.filter((c) => c.participant?.name?.toLowerCase().includes(q.toLowerCase())));
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
                            <MessageBubble key={msg._id} message={msg} isMine={String(msg.senderId) === String(currentUserId)} />
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
                        onChange={(e) => { setMessageInput(e.target.value); handleTypingChange(); }}
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
