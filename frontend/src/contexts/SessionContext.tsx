import { createContext, useContext, useState, useEffect, useCallback, ReactNode, FC } from 'react';
import { Session, SessionDetail } from '../types/session.types';
import { sessionApi } from '../services/session.api';
import { useAuth } from '../hooks/useAuth';

interface SessionContextType {
  sessions: Session[];
  activeSessionId: string | null;
  activeSession: Session | null;
  isLoadingSessions: boolean;
  isSidebarOpen: boolean;
  activeTab: 'chats' | 'storage';
  setActiveTab: (tab: 'chats' | 'storage') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  fetchSessions: () => Promise<void>;
  selectSession: (sessionId: string) => Promise<SessionDetail | null>;
  createNewSession: (title?: string, initialPrompt?: string) => Promise<Session>;
  renameSession: (id: string, title: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  updateActiveSessionLatestHtml: (html: string) => void;
  setActiveSessionId: (id: string | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'chats' | 'storage'>('chats');

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setActiveSession(null);
      setActiveSessionId(null);
      return;
    }

    try {
      setIsLoadingSessions(true);
      const data = await sessionApi.fetchSessions();
      setSessions(data || []);
    } catch (err) {
      console.error('[SessionContext] Failed to fetch sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (activeSessionId) {
      const found = sessions.find((s) => s.id === activeSessionId) || null;
      setActiveSession(found);
    } else {
      setActiveSession(null);
    }
  }, [activeSessionId, sessions]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const selectSession = useCallback(
    async (sessionId: string): Promise<SessionDetail | null> => {
      try {
        setActiveSessionId(sessionId);
        const detail = await sessionApi.fetchSessionDetail(sessionId);
        if (detail?.session) {
          setActiveSession(detail.session);
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? detail.session : s))
          );
        }
        return detail;
      } catch (err) {
        console.error('[SessionContext] Failed to select session:', err);
        return null;
      }
    },
    []
  );

  const createNewSession = useCallback(
    async (title = 'Dự án Mới', initialPrompt?: string): Promise<Session> => {
      try {
        const created = await sessionApi.createSession(title, initialPrompt);
        setSessions((prev) => [created, ...prev]);
        setActiveSessionId(created.id);
        setActiveSession(created);
        return created;
      } catch (err) {
        console.error('[SessionContext] Failed to create session:', err);
        throw err;
      }
    },
    []
  );

  const renameSession = useCallback(
    async (id: string, title: string): Promise<void> => {
      try {
        const updated = await sessionApi.renameSession(id, title);
        setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
        if (activeSessionId === id) {
          setActiveSession(updated);
        }
      } catch (err) {
        console.error('[SessionContext] Failed to rename session:', err);
        throw err;
      }
    },
    [activeSessionId]
  );

  const deleteSession = useCallback(
    async (id: string): Promise<void> => {
      try {
        await sessionApi.deleteSession(id);
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (activeSessionId === id) {
          setActiveSessionId(null);
          setActiveSession(null);
        }
      } catch (err) {
        console.error('[SessionContext] Failed to delete session:', err);
        throw err;
      }
    },
    [activeSessionId]
  );

  const updateActiveSessionLatestHtml = useCallback((html: string) => {
    setActiveSession((prev) => (prev ? { ...prev, latestHtml: html } : null));
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, latestHtml: html } : s))
    );
  }, [activeSessionId]);

  return (
    <SessionContext.Provider
      value={{
        sessions,
        activeSessionId,
        activeSession,
        isLoadingSessions,
        isSidebarOpen,
        activeTab,
        setActiveTab,
        toggleSidebar,
        setSidebarOpen: setIsSidebarOpen,
        fetchSessions,
        selectSession,
        createNewSession,
        renameSession,
        deleteSession,
        updateActiveSessionLatestHtml,
        setActiveSessionId,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
