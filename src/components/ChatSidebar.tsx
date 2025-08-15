import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useUserData } from '@nhost/react';
import { GET_CHATS } from '../lib/graphql/queries';
import { CREATE_CHAT, DELETE_USER_CHATS } from '../lib/graphql/mutations';
import { Chat } from '../types';
import { Plus, MessageCircle, Search, Settings, LogOut, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSignOut } from '@nhost/react';

interface ChatSidebarProps {
  selectedChatId: string | null;
  onChatSelect: (chatId: string) => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  selectedChatId,
  onChatSelect,
  isMobile = false,
  isOpen = true,
  onToggle
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { signOut } = useSignOut();

  const user = useUserData();
  // Only render sidebar if user is authenticated and user_id is available
  if (!user?.id) return null;

  const { data, loading, refetch } = useQuery(GET_CHATS, {
    variables: { user_id: user.id },
    skip: !user.id,
    fetchPolicy: 'cache-and-network'
  });

  const [createChat] = useMutation(CREATE_CHAT, {
    onCompleted: (data) => {
      refetch();
      onChatSelect(data.insert_chats_one.id);
      if (isMobile && onToggle) {
        onToggle();
      }
    }
  });

  const [deleteUserChats, { loading: deleting }] = useMutation(DELETE_USER_CHATS, {
    onCompleted: async () => {
      await refetch();
      setSettingsOpen(false);
    }
  });

  const chats: Chat[] = data?.chats || [];

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateChat = async () => {
    const title = `Chat ${new Date().toLocaleDateString()}`;
    await createChat({ variables: { title, user_id: user.id } });
  };

  const handleSignOut = () => {
    signOut();
  };

  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleDeleteAllChats = async () => {
    if (!user?.id) return;
    const confirmed = window.confirm('Delete all your chats? This cannot be undone.');
    if (!confirmed) return;
    await deleteUserChats({ variables: { user_id: user.id } });
  };

  if (isMobile && !isOpen) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed left-0 top-0 h-full z-30 transform transition-transform duration-300' : 'relative'}
        ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
        w-80 bg-white border-r border-gray-200 flex flex-col
      `}>
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageCircle size={18} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">ChatBot</h1>
            </div>
            {isMobile && (
              <button
                onClick={onToggle}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            )}
          </div>

          {/* Search Bar (hidden until at least one chat exists) */}
          {chats.length > 0 && (
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search your chats (use New Chat to start)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="mt-1 text-xs text-gray-500">
                Search your existing chats. To start a new conversation, click <span className="font-medium text-gray-700">New Chat</span>.
              </p>
            </div>
          )}

          {/* New Chat Button */}
          <button
            onClick={handleCreateChat}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${chats.length === 0 ? 'animate-pulse ring-2 ring-blue-300' : ''}`}
          >
            <Plus size={16} />
            <span>New Chat</span>
            {chats.length === 0 && (
              <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">Start here</span>
            )}
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium">No chats yet</p>
              <p className="text-sm">Create your first chat to get started</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredChats.map((chat) => {
                const lastMessage = chat.messages?.[0];
                const isSelected = selectedChatId === chat.id;

                return (
                  <div
                    key={chat.id}
                    onClick={() => {
                      onChatSelect(chat.id);
                      if (isMobile && onToggle) {
                        onToggle();
                      }
                    }}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-all mb-1
                      ${isSelected
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className={`font-medium truncate pr-2 ${
                        isSelected ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {chat.title}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                    {lastMessage && (
                      <p className="text-sm text-gray-600 truncate">
                        {lastMessage.content}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings size={16} className="text-gray-600" />

              {settingsOpen && (
                <div className="absolute bottom-12 right-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-40">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">Settings</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleDeleteAllChats}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting…' : 'Delete all chats'}
                    </button>
                    <div className="my-2 h-px bg-gray-200" />
                    <div className="px-3 py-2 text-xs text-gray-500">
                      <p className="font-medium text-gray-700">About</p>
                      <p>ChatBot demo using Nhost + Apollo.</p>
                    </div>
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatSidebar;
