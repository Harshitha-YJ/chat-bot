import React, { useState, useCallback, useRef } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import ChatMessages from './ChatMessages';
import MessageInput from './MessageInput';
import { Menu } from 'lucide-react';
import BotArt from '../assets/ai-bot.png';
import BrandLogo from '../assets/brand-logo.png';

// Use your existing GraphQL operations

const INSERT_MESSAGE = gql`
  mutation InsertMessage($chat_id: uuid!, $content: String!, $isBot: Boolean = false, $user_id: uuid!) {
    insert_messages_one(
      object: { chat_id: $chat_id, content: $content, is_bot: $isBot, user_id: $user_id }
    ) {
      id
      content
      is_bot
      created_at
      user_id
    }
  }
`;

const UPDATE_CHAT_TIMESTAMP = gql`
  mutation UpdateChatTimestamp($chat_id: uuid!) {
    update_chats_by_pk(pk_columns: { id: $chat_id }, _set: { updated_at: "now()" }) {
      id
      updated_at
    }
  }
`;

interface ChatInterfaceProps {
  selectedChatId: string | null;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
  user: any;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  selectedChatId,
  onToggleSidebar,
  isMobile = false,
  user
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const isSendingRef = useRef(false);

  const [insertMessage] = useMutation(INSERT_MESSAGE, {
    onError: (error) => {
      console.error('Insert message error:', error);
      console.error('Error details:', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
    },
    onCompleted: (data) => {
      console.log('Message inserted successfully:', data);
    }
  });

  const [updateChatTimestamp] = useMutation(UPDATE_CHAT_TIMESTAMP, {
    onError: (error) => {
      console.error('Update chat timestamp error:', error);
    }
  });

  // Function to call n8n webhook
  const callN8nWebhook = async (message: string): Promise<string> => {
    try {
      console.log('Calling n8n webhook with message:', message);
      
      const webhookUrl = import.meta.env?.DEV
        ? '/api/webhook'
        : 'https://harshithayj-2022.app.n8n.cloud/webhook/chatbot';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          chat_id: selectedChatId,
          user_id: user.id
        }),
      });

      console.log('n8n webhook response status:', response.status);

      if (!response.ok) {
        throw new Error(`n8n webhook responded with status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const rawBody = await response.text();
      let result: any;
      if (!rawBody || rawBody.trim().length === 0) {
        console.warn('n8n webhook returned empty body');
        result = {};
      } else if (contentType.includes('application/json')) {
        try {
          result = JSON.parse(rawBody);
        } catch (parseError) {
          console.warn('Failed to parse JSON, using raw text body');
          result = { text: rawBody };
        }
      } else {
        result = { text: rawBody };
      }
      // Normalize possible plain-text responses (n8n Text mode sometimes sends a leading '=')
      if (typeof (result as any) === 'string') {
        result = { text: String(result) } as any;
      }
      if (result && typeof (result as any).text === 'string') {
        (result as any).text = (result as any).text.replace(/^=\s*/, '');
      }
      console.log('n8n webhook result:', result);
      console.log('Full n8n response object keys:', Object.keys(result));
      console.log('Full n8n response object:', JSON.stringify(result, null, 2));

      // Extract the bot response from n8n result
      // Try multiple possible response fields
      const botResponse = result.bot_response || 
                         result.response || 
                         result.message || 
                         result.output || 
                         result.data || 
                         result.result || 
                         result.text ||
                         result.content ||
                         (result.body && result.body.response) ||
                         (result.body && result.body.message) ||
                         'I received your message but had trouble generating a response.';
      
      console.log('Extracted bot response:', botResponse);
      return botResponse;
    } catch (error) {
      console.error('n8n webhook call failed:', error);
      throw error;
    }
  };

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedChatId || isLoading || isSendingRef.current) {
      console.log('Cannot send message:', { selectedChatId, isLoading });
      return;
    }
    
    if (!user?.id) {
      console.error('CRITICAL ERROR: No user ID found in ChatInterface', {
        user,
        userId: user?.id,
        userType: typeof user,
        userKeys: user ? Object.keys(user) : 'no user object'
      });
      alert('Authentication error: User ID missing. Please refresh the page and try again.');
      return;
    }

    console.log('Sending message with details:', {
      userId: user.id,
      chatId: selectedChatId,
      content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      contentLength: content.length
    });

    setIsLoading(true);
    isSendingRef.current = true;

    try {
      // Step 1: Insert user message first
      console.log('Step 1: Inserting user message...');
      const userMessageResult = await insertMessage({
        variables: {
          chat_id: selectedChatId,
          content: content,
          isBot: false,
          user_id: user.id
        }
      });

      console.log('User message inserted successfully:', userMessageResult?.data);

      // Step 2: Update chat timestamp
      console.log('Step 2: Updating chat timestamp...');
      try {
        await updateChatTimestamp({
          variables: { chat_id: selectedChatId }
        });
        console.log('Chat timestamp updated successfully');
      } catch (timestampError) {
        console.warn('Failed to update timestamp, continuing anyway:', timestampError);
      }

      // Step 3: Call n8n webhook to get AI response
      console.log('Step 3: Calling n8n webhook...');
      try {
        const botResponse = await callN8nWebhook(content);

        console.log('n8n webhook returned response:', botResponse);

        // Step 4: Insert bot response
        console.log('Step 4: Inserting bot response...');
        const botMessageResult = await insertMessage({
          variables: {
            chat_id: selectedChatId,
            content: botResponse,
            isBot: true,
            user_id: user.id
          }
        });

        console.log('Bot message inserted successfully:', botMessageResult?.data);

        // Update timestamp again
        try {
          await updateChatTimestamp({
            variables: { chat_id: selectedChatId }
          });
        } catch (timestampError) {
          console.warn('Failed to update timestamp after bot response:', timestampError);
        }

      } catch (webhookError) {
        console.error('n8n webhook failed, providing fallback response:', webhookError);
        
        // Fallback: Insert a simple bot response
        const fallbackResponse = "I'm sorry, I'm having trouble connecting to my AI service right now. Please try again in a moment.";
        
        try {
          const fallbackResult = await insertMessage({
            variables: {
              chat_id: selectedChatId,
              content: fallbackResponse,
              isBot: true,
              user_id: user.id
            }
          });
          console.log('Fallback bot response inserted:', fallbackResult?.data);

          await updateChatTimestamp({
            variables: { chat_id: selectedChatId }
          });
        } catch (fallbackError) {
          console.error('Even fallback response failed:', fallbackError);
        }
      }

    } catch (error) {
      console.error('Critical error in handleSendMessage:', error);
      // Type guard for error object
      const errorDetails =
        typeof error === 'object' && error !== null
          ? {
              chatId: selectedChatId,
              userId: user?.id,
              content: content.substring(0, 50) + '...',
              errorMessage: (error as any).message,
              errorStack: (error as any).stack,
              graphQLErrors: (error as any).graphQLErrors,
              networkError: (error as any).networkError
            }
          : {
              chatId: selectedChatId,
              userId: user?.id,
              content: content.substring(0, 50) + '...',
              errorMessage: String(error)
            };
      console.error('Full error details:', errorDetails);
      
      // Last resort: Insert error message from bot
      try {
        await insertMessage({
          variables: {
            chat_id: selectedChatId,
            content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
            isBot: true,
            user_id: user.id
          }
        });
      } catch (insertError) {
        console.error('Failed to insert error message:', insertError);
      }
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  }, [selectedChatId, isLoading, insertMessage, updateChatTimestamp, user]);

  if (!selectedChatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center max-w-md p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl transition-all">
          <img src={BotArt} alt="AI Bot" className="mx-auto mb-6 w-24 drop-shadow-lg" />
          <h2 className="text-2xl font-bold text-white mb-2">Welcome</h2>
          <p className="text-slate-300 mb-6">
            Select a chat from the sidebar, or create a new conversation to begin.
          </p>
          {isMobile && (
            <button
              onClick={onToggleSidebar}
              className="px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-colors shadow-lg"
            >
              Open Chats
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex-shrink-0 bg-slate-900/60 backdrop-blur border-b border-white/10 p-4 flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu size={20} className="text-slate-200" />
          </button>
          <img src={BrandLogo} alt="Buddy Logo" className="w-6 h-6" />
          <h2 className="font-semibold text-white">Buddy Chat</h2>
        </div>
      )}

      {/* Messages */}
      <ChatMessages chatId={selectedChatId} isLoading={isLoading} />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        placeholder={isLoading ? "Bot is typing..." : "Type your message..."}
      />
    </div>
  );
};

export default ChatInterface;