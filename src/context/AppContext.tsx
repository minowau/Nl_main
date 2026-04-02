import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { nlpApi, Resource, AgentState, Position } from '../services/nlpApi';

interface AppContextType {
  resources: Resource[];
  agent: AgentState;
  bookmarks: string[];
  isLoading: boolean;
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
  setAgent: React.Dispatch<React.SetStateAction<AgentState>>;
  setBookmarks: React.Dispatch<React.SetStateAction<string[]>>;
  refreshData: () => Promise<void>;
  toggleBookmark: (resourceId: string) => Promise<void>;
  updateAgentPosition: (position: Position) => Promise<void>;
  visitResource: (resourceId: string) => Promise<void>;
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
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resData, agentData, bookmarkData] = await Promise.all([
        nlpApi.getResources(),
        nlpApi.getAgentState('default'),
        nlpApi.getBookmarks('default')
      ]);
      setResources(resData);
      setAgent(agentData);
      setBookmarks(bookmarkData);
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
      visitResource
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
