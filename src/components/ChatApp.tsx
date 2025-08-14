import React, { useState, useEffect } from 'react';
import { useAuthenticationStatus, useUserData } from '@nhost/react';
import ChatSidebar from './ChatSidebar';
import ChatInterface from './ChatInterface';
import AuthForm from './AuthForm';
import { User } from '@nhost/react'; // Ensure User type is imported

export interface ChatInterfaceProps {
  selectedChatId: string | null;
  onToggleSidebar: () => void;
  isMobile: boolean;
  user: User; // Add this line
  // other props if any
}

const ChatApp: React.FC = () => {
  const { isLoading, isAuthenticated, isError } = useAuthenticationStatus();
  const user = useUserData();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Improved debug logging - only log when values actually change
  useEffect(() => {
    console.log('ChatApp - Auth Status:', { 
      isLoading, 
      isAuthenticated,
      isError,
      hasUser: !!user,
      userId: user?.id || 'MISSING',
      userEmail: user?.email || 'MISSING'
    });
  }, [isLoading, isAuthenticated, isError, user?.id, user?.email]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Add error handling
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Authentication Error</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Check for both authentication AND valid user ID
  if (!isAuthenticated || !user?.id) {
    console.log('Showing AuthForm - Auth:', isAuthenticated, 'User ID:', user?.id);
    return <AuthForm />;
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <ChatSidebar
        selectedChatId={selectedChatId}
        onChatSelect={handleChatSelect}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />
      <ChatInterface
        selectedChatId={selectedChatId}
        onToggleSidebar={toggleSidebar}
        isMobile={isMobile}
        user={user}
      />
    </div>
  );
};

export default ChatApp;