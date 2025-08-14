import React, { useEffect, useRef } from 'react';
import { useSubscription } from '@apollo/client';
import { useUserData } from '@nhost/react';
import { MESSAGES_SUBSCRIPTION } from '../lib/graphql/queries';
import { Message } from '../types';
import { format, isToday, isYesterday } from 'date-fns';
import { Bot, User, Loader2 } from 'lucide-react';

interface ChatMessagesProps {
  chatId: string;
  isLoading?: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ chatId, isLoading = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const user = useUserData();
  const { data, loading } = useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: { chat_id: chatId, user_id: user?.id },
    skip: !user?.id || !chatId
  });

  const messages: Message[] = data?.messages || [];

  // Remove near-duplicate messages within a short window even if separated by a bot reply
  // Handles cases where the client inserts a user message and the backend echoes it later
  const normalize = (text: string | null | undefined): string =>
    (text || '').replace(/\s+/g, ' ').trim().toLowerCase();

  const getDisplayMessages = (items: Message[]): Message[] => {
    const result: Message[] = [];
    const lastSeen = new Map<string, number>();
    const WINDOW_MS = 60_000; // 60 seconds

    for (const current of items) {
      const key = `${current.is_bot ? 'bot' : 'user'}:${current.user_id}:${normalize(current.content)}`;
      const currTime = new Date(current.created_at).getTime();
      const last = lastSeen.get(key);

      if (last !== undefined && Math.abs(currTime - last) <= WINDOW_MS) {
        // skip duplicate within the time window (e.g., client insert + backend echo)
        continue;
      }

      result.push(current);
      lastSeen.set(key, currTime);
    }

    return result;
  };

  const displayMessages = getDisplayMessages(messages);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <Bot size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start the conversation</h3>
          <p className="text-gray-600">Send a message to begin chatting with the AI assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-slate-900/20"
    >
      {displayMessages.map((message, index) => {
        const isBot = message.is_bot;
        const showAvatar = index === 0 || displayMessages[index - 1].is_bot !== isBot;

        return (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'} transition-all`}
          >
            {/* Bot Avatar */}
            {isBot && (
              <div className={`flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
              </div>
            )}

            {/* Message Bubble */}
              <div className={`max-w-xs lg:max-w-md ${isBot ? 'order-2' : 'order-1'}`}>
              <div
                className={`
                  px-4 py-2 rounded-2xl shadow-lg ring-1
                  ${isBot
                    ? 'bg-white/90 ring-white/20 text-slate-900 backdrop-blur'
                    : 'bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500 text-white'
                  }
                  ${isBot && !showAvatar ? 'ml-2' : ''}
                `}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
              
              {/* Timestamp */}
                <div className={`mt-1 text-xs text-slate-400 ${isBot ? 'text-left ml-2' : 'text-right'}`}>
                {formatMessageTime(message.created_at)}
              </div>
            </div>

            {/* User Avatar */}
            {!isBot && (
              <div className={`flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Typing Indicator */}
      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl shadow-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;