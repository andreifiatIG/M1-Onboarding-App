'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface BackendStatusContextType {
  isBackendAvailable: boolean;
  lastChecked: Date | null;
  checkBackendStatus: () => Promise<boolean>;
}

const BackendStatusContext = createContext<BackendStatusContextType>({
  isBackendAvailable: true,
  lastChecked: null,
  checkBackendStatus: async () => true,
});

export const useBackendStatus = () => useContext(BackendStatusContext);

export const BackendStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkBackendStatus = useCallback(async (): Promise<boolean> => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      const isAvailable = response.ok;
      setIsBackendAvailable(isAvailable);
      setLastChecked(new Date());
      
      return isAvailable;
    } catch (error) {
      setIsBackendAvailable(false);
      setLastChecked(new Date());
      return false;
    }
  }, []);

  // Check backend status on mount and every 30 seconds
  useEffect(() => {
    checkBackendStatus();
    
    const interval = setInterval(() => {
      checkBackendStatus();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkBackendStatus]);

  // Also check when the window regains focus
  useEffect(() => {
    const handleFocus = () => {
      checkBackendStatus();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkBackendStatus]);

  return (
    <BackendStatusContext.Provider value={{ isBackendAvailable, lastChecked, checkBackendStatus }}>
      {children}
    </BackendStatusContext.Provider>
  );
};
