// ============================================
// MESSAGES HOOK
// Sistema de mensagens integrado com atletas reais
// ============================================

import { useState, useEffect, useCallback } from 'react';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

export interface Conversation {
  id: string;
  athleteId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  online: boolean;
  typing?: boolean;
}

const STORAGE_KEY_CONVERSATIONS = 'app_conversations';
const STORAGE_KEY_MESSAGES = 'app_messages';

/**
 * Hook de mensagens
 * Gerencia conversas e mensagens com atletas
 */
export function useMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});

  // ============================================
  // LOAD/SAVE
  // ============================================

  useEffect(() => {
    loadData();
    
    // Listener para mudanças em outras tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_CONVERSATIONS || e.key === STORAGE_KEY_MESSAGES) {
        loadData();
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const loadData = () => {
    try {
      // Load conversations
      const storedConvs = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (storedConvs) {
        const parsed = JSON.parse(storedConvs);
        const convs = parsed.map((c: any) => ({
          ...c,
          lastMessageTime: new Date(c.lastMessageTime)
        }));
        setConversations(convs);
      }

      // Load messages
      const storedMsgs = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (storedMsgs) {
        const parsed = JSON.parse(storedMsgs);
        // Convert timestamp strings back to Date objects
        const messages: Record<string, Message[]> = {};
        for (const [convId, msgs] of Object.entries(parsed)) {
          messages[convId] = (msgs as any[]).map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
        }
        setAllMessages(messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveConversations = (convs: Conversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(convs));
      setConversations(convs);
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  };

  const saveMessages = (messages: Record<string, Message[]>) => {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
      setAllMessages(messages);
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  // ============================================
  // CONVERSATION MANAGEMENT
  // ============================================

  /**
   * Inicia ou retorna conversa existente com atleta
   */
  const getOrCreateConversation = useCallback((athleteId: string, athleteName: string, athleteAvatar?: string) => {
    // Check if conversation exists
    let conversation = conversations.find(c => c.athleteId === athleteId);
    
    if (!conversation) {
      // Create new conversation
      const initials = athleteName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      conversation = {
        id: `conv-${athleteId}`,
        athleteId,
        name: athleteName,
        avatar: athleteAvatar || initials,
        lastMessage: '',
        lastMessageTime: new Date(),
        unreadCount: 0,
        online: Math.random() > 0.5 // Mock online status
      };

      const updated = [conversation, ...conversations];
      saveConversations(updated);

      // Initialize empty message list
      const updatedMessages = { ...allMessages, [conversation.id]: [] };
      saveMessages(updatedMessages);
    }

    return conversation;
  }, [conversations, allMessages]);

  /**
   * Atualiza status online de um atleta
   */
  const updateOnlineStatus = useCallback((athleteId: string, online: boolean) => {
    const updated = conversations.map(c =>
      c.athleteId === athleteId ? { ...c, online } : c
    );
    saveConversations(updated);
  }, [conversations]);

  /**
   * Atualiza typing indicator
   */
  const updateTypingStatus = useCallback((athleteId: string, typing: boolean) => {
    const updated = conversations.map(c =>
      c.athleteId === athleteId ? { ...c, typing } : c
    );
    setConversations(updated);
  }, [conversations]);

  // ============================================
  // MESSAGE MANAGEMENT
  // ============================================

  /**
   * Busca mensagens de uma conversa
   */
  const getMessages = useCallback((conversationId: string): Message[] => {
    return allMessages[conversationId] || [];
  }, [allMessages]);

  /**
   * Envia mensagem
   */
  const sendMessage = useCallback((conversationId: string, text: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${crypto.randomUUID()}`,
      conversationId,
      senderId: 'me',
      text,
      timestamp: new Date(),
      read: false,
      type: 'text'
    };

    // Add message to conversation
    const conversationMessages = allMessages[conversationId] || [];
    const updatedMessages = {
      ...allMessages,
      [conversationId]: [...conversationMessages, newMessage]
    };
    saveMessages(updatedMessages);

    // Update conversation's last message
    const updated = conversations.map(c => {
      if (c.id === conversationId) {
        return {
          ...c,
          lastMessage: text,
          lastMessageTime: new Date()
        };
      }
      return c;
    });
    saveConversations(updated);

    return newMessage;
  }, [conversations, allMessages]);

  /**
   * Recebe mensagem (de outro user)
   */
  const receiveMessage = useCallback((conversationId: string, senderId: string, text: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${crypto.randomUUID()}`,
      conversationId,
      senderId,
      text,
      timestamp: new Date(),
      read: false,
      type: 'text'
    };

    // Add message to conversation
    const conversationMessages = allMessages[conversationId] || [];
    const updatedMessages = {
      ...allMessages,
      [conversationId]: [...conversationMessages, newMessage]
    };
    saveMessages(updatedMessages);

    // Update conversation's last message and unread count
    const updated = conversations.map(c => {
      if (c.id === conversationId) {
        return {
          ...c,
          lastMessage: text,
          lastMessageTime: new Date(),
          unreadCount: c.unreadCount + 1
        };
      }
      return c;
    });
    saveConversations(updated);

    return newMessage;
  }, [conversations, allMessages]);

  /**
   * Marca mensagens como lidas
   */
  const markConversationAsRead = useCallback((conversationId: string) => {
    // Update messages
    const conversationMessages = allMessages[conversationId] || [];
    const updatedConvMessages = conversationMessages.map(m => ({ ...m, read: true }));
    const updatedMessages = {
      ...allMessages,
      [conversationId]: updatedConvMessages
    };
    saveMessages(updatedMessages);

    // Update conversation unread count
    const updated = conversations.map(c =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
    saveConversations(updated);
  }, [conversations, allMessages]);

  // ============================================
  // COMPUTED
  // ============================================

  const totalUnreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return {
    conversations,
    getMessages,
    sendMessage,
    receiveMessage,
    getOrCreateConversation,
    updateOnlineStatus,
    updateTypingStatus,
    markConversationAsRead,
    totalUnreadCount
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Simula recebimento de mensagem de atleta
 * Usar para testing ou demo
 */
export function simulateAthleteMessage(conversationId: string, athleteId: string, text: string) {
  const event = new CustomEvent('app:message-received', {
    detail: { conversationId, athleteId, text }
  });
  window.dispatchEvent(event);
}
