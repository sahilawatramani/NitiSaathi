import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const AppContext = createContext();

const INITIAL_CHAT = [
  { role: 'bot', text: 'Hi! I\'m your FinAssist Life Event Advisor 🤖\n\nI know your financial profile, income, and FIRE goals. Ask me how to handle:\n• Got a ₹1L bonus?\n• Having a baby next year?\n• Need to rebalance for an upcoming wedding?' }
];

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [chatMessages, setChatMessages] = useState(INITIAL_CHAT);
  
  const [portfolioData, setPortfolioData] = useState(null); 
  const [isXRayLoading, setIsXRayLoading] = useState(false);
  const [xrayComplete, setXrayComplete] = useState(false);

  const [uploadState, setUploadState] = useState({
    file: null,
    uploading: false,
    result: null,
    error: ''
  });
  
  const [smsState, setSmsState] = useState({
    text: '',
    sender: 'BANK-SMS',
    loading: false,
    result: null,
    error: ''
  });

  const clearSessionData = () => {
    setChatMessages(INITIAL_CHAT);
    setPortfolioData(null);
    setIsXRayLoading(false);
    setXrayComplete(false);
    setUploadState({ file: null, uploading: false, result: null, error: '' });
    setSmsState({ text: '', sender: 'BANK-SMS', loading: false, result: null, error: '' });
  };

  // Auto-clear on logout
  useEffect(() => {
    if (!user) clearSessionData();
  }, [user]);

  return (
    <AppContext.Provider value={{ 
      chatMessages, setChatMessages, 
      portfolioData, setPortfolioData,
      isXRayLoading, setIsXRayLoading,
      xrayComplete, setXrayComplete,
      uploadState, setUploadState,
      smsState, setSmsState,
      clearSessionData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
