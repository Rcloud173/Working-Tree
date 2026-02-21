/**
 * Single Socket.IO client for chat. Connects with JWT on auth.
 * Exposes: connected, joinConversation, leaveConversation, sendMessage.
 * Subscribe to message:new, user:typing, user:stopped-typing via callbacks.
 */
import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

function getSocketUrl() {
  try {
    const base = import.meta.env.VITE_API_URL || '';
    if (base) {
      const u = new URL(base);
      return u.origin;
    }
  } catch (_) {}
  return window?.location?.origin || 'http://localhost:5005';
}

function getStoredToken() {
  try {
    const raw = localStorage.getItem('accessToken');
    if (!raw) return null;
    if (raw.startsWith('"') && raw.endsWith('"')) return JSON.parse(raw);
    return raw;
  } catch {
    return null;
  }
}

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const tokenRef = useRef(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }
    if (socketRef.current && tokenRef.current === token) return;
    tokenRef.current = token;
    const url = getSocketUrl();
    const socket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    setConnected(socket.connected);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      tokenRef.current = null;
      setConnected(false);
    };
  }, []);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('conversation:join', { conversationId });
    }
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.leave(conversationId);
    }
  }, []);

  const sendMessage = useCallback((conversationId, type, content) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('message:send', {
        conversationId,
        type: type || 'text',
        content: type === 'text' ? { text: content } : content,
      });
    }
  }, []);

  const emitTypingStart = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('typing:start', { conversationId });
    }
  }, []);

  const emitTypingStop = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('typing:stop', { conversationId });
    }
  }, []);

  const subscribe = useCallback((event, handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const value = {
    connected,
    joinConversation,
    leaveConversation,
    sendMessage,
    emitTypingStart,
    emitTypingStop,
    subscribe,
    socket: socketRef.current,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
