import { NhostClient } from '@nhost/nhost-js';

export const nhost = new NhostClient({
  subdomain: 'pwlhmvhffbvvxhvjxekc',
  region: 'ap-south-1',
  autoRefreshToken: true,
  autoSignIn: true
});

// Add debug logging for auth state changes
nhost.auth.onAuthStateChanged((event, session) => {
  console.log('🔐 Auth State Changed:', {
    event,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    hasAccessToken: !!session?.accessToken,
    hasRefreshToken: !!session?.refreshToken,
    isEmailVerified: session?.user?.emailVerified
  });
  
  if (event === 'SIGNED_IN') {
    console.log('✅ User signed in successfully');
  } else if (event === 'SIGNED_OUT') {
    console.log('👋 User signed out');
  } else if (event === 'TOKEN_CHANGED') {
    console.log('🔄 Token refreshed');
  }
});

// Add token change logging
nhost.auth.onTokenChanged((session) => {
  if (!session) {
    console.warn('⚠️ Token refresh failed - session is null');
  } else {
    console.log('🔑 Token updated successfully');
  }
});

// Helper functions for debugging
export const clearAuthData = () => {
  try {
    localStorage.removeItem('nhostRefreshToken');
    localStorage.removeItem('nhostAccessToken');
    console.log('🧹 Cleared auth data');
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
};

export const checkAuthStatus = () => {
  const status = {
    isAuthenticated: nhost.auth.isAuthenticated(),
    // isLoading: nhost.auth.isLoading(), // Removed: no such property
    user: nhost.auth.getUser(),
    hasAccessToken: !!nhost.auth.getAccessToken(),
    hasRefreshToken: !!nhost.auth.getSession()?.refreshToken
  };
  
  console.log('🏥 Auth Status:', status);
  return status;
};