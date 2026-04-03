import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { nlpApi, Resource, AgentState, Position, Notification, LearningData } from '../services/nlpApi';

interface AppContextType {
  resources: Resource[];
  agent: AgentState;
  learningData: LearningData | null;
  bookmarks: string[];
  isLoading: boolean;
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
  setAgent: React.Dispatch<React.SetStateAction<AgentState>>;
  setBookmarks: React.Dispatch<React.SetStateAction<string[]>>;
  refreshData: () => Promise<void>;
  toggleBookmark: (resourceId: string) => Promise<void>;
  updateAgentPosition: (position: Position) => Promise<void>;
  visitResource: (resourceId: string) => Promise<void>;
  levelUpMessage: string | null;
  setLevelUpMessage: React.Dispatch<React.SetStateAction<string | null>>;
  notifications: Notification[];
  addNotification: (message: string, type?: 'info' | 'success' | 'warning') => Promise<void>;
  markNotificationsAsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [agent, setAgent] = useState<AgentState>({
    position: { x: 10, y: 10 },
    level: 1,
    totalReward: 0,
    visitedResources: []
  });
  const [learningData, setLearningData] = useState<LearningData | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null);
  const [prevLevel, setPrevLevel] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(async (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    try {
      const newNotif = await nlpApi.addNotification('default', message, type);
      setNotifications(prev => [newNotif, ...prev]);
    } catch (error) {
      console.error('Failed to add notification:', error);
    }
  }, []);

  const markNotificationsAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await nlpApi.markNotificationsRead('default');
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }, []);

  // Trigger Notification
  useEffect(() => {
    if (prevLevel !== null && agent.level > prevLevel) {
        const msg = `Level up! You are now Stage ${agent.level}`;
        setLevelUpMessage(msg);
        addNotification(msg, 'success');
        setTimeout(() => setLevelUpMessage(null), 5000); // 5 sec toast
    }
    setPrevLevel(agent.level);
  }, [agent.level, prevLevel, addNotification]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resData, agentData, bookmarkData, lData] = await Promise.all([
        nlpApi.getResources(),
        nlpApi.getAgentState('default'),
        nlpApi.getBookmarks('default'),
        nlpApi.getLearningData('default')
      ]);
      setResources(resData);
      setAgent(agentData);
      setBookmarks(bookmarkData);
      setLearningData(lData);
      if (agentData.notifications) {
        setNotifications(agentData.notifications);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const toggleBookmark = async (resourceId: string) => {
    const isBookmarked = bookmarks.includes(resourceId);
    try {
      if (isBookmarked) {
        await nlpApi.removeBookmark('default', resourceId);
        setBookmarks(prev => prev.filter(id => id !== resourceId));
      } else {
        await nlpApi.addBookmark('default', resourceId);
        setBookmarks(prev => [...prev, resourceId]);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const updateAgentPosition = async (position: Position) => {
    try {
      const newState = await nlpApi.moveAgent('default', position);
      setAgent(newState);
    } catch (error) {
      console.error('Failed to update agent position:', error);
    }
  };

  const visitResource = async (resourceId: string) => {
    try {
      const newState = await nlpApi.visitResource('default', resourceId);
      setAgent(newState);
      setResources(prev => prev.map(r => r.id === resourceId ? { ...r, visited: true } : r));
    } catch (error) {
      console.error('Failed to visit resource:', error);
    }
  };

  return (
    <AppContext.Provider value={{
      resources,
      agent,
      bookmarks,
      isLoading,
      setResources,
      setAgent,
      setBookmarks,
      refreshData,
      toggleBookmark,
      updateAgentPosition,
      visitResource,
      levelUpMessage,
      setLevelUpMessage,
      learningData,
      notifications,
      addNotification,
      markNotificationsAsRead
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
