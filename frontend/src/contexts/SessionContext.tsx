import { createContext, useContext, useState, useEffect, useCallback, ReactNode, FC } from 'react';
import { Session, SessionDetail } from '../types/session.types';
import { StorageFileItem, GroupedSessionStorageItem } from '../types/storage.types';
import { sessionApi } from '../services/session.api';
import { storageService } from '../services/storage.service';
import { useAuth } from '../hooks/useAuth';

interface SessionContextType {
  sessions: Session[];
  storageFiles: StorageFileItem[];
  groupedStorageFiles: GroupedSessionStorageItem[];
  activeSessionId: string | null;
  activeSession: Session | null;
  isLoadingSessions: boolean;
  isLoadingStorage: boolean;
  fetchSessions: () => Promise<void>;
  fetchStorageFiles: () => Promise<void>;
  fetchGroupedStorageFiles: () => Promise<void>;
  selectSession: (sessionId: string) => Promise<SessionDetail | null>;
  createNewSession: (title?: string, initialPrompt?: string) => Promise<Session>;
  renameSession: (id: string, title: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  deleteStorageFile: (fileId: string) => Promise<boolean>;
  updateActiveSessionLatestHtml: (html: string) => void;
  setActiveSessionId: (id: string | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [storageFiles, setStorageFiles] = useState<StorageFileItem[]>([]);
  const [groupedStorageFiles, setGroupedStorageFiles] = useState<GroupedSessionStorageItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);
  const [isLoadingStorage, setIsLoadingStorage] = useState<boolean>(false);

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

  const fetchStorageFiles = useCallback(async () => {
    if (!user) {
      setStorageFiles([]);
      return;
    }

    try {
      setIsLoadingStorage(true);
      const files = await storageService.getStorageFiles();
      setStorageFiles(files || []);
    } catch (err) {
      console.error('[SessionContext] Failed to fetch storage files:', err);
    } finally {
      setIsLoadingStorage(false);
    }
  }, [user]);

  const fetchGroupedStorageFiles = useCallback(async () => {
    if (!user) {
      setGroupedStorageFiles([]);
      return;
    }

    try {
      const groups = await storageService.getGroupedStorageFiles();
      setGroupedStorageFiles(groups || []);
    } catch (err) {
      console.error('[SessionContext] Failed to fetch grouped storage files:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
    fetchStorageFiles();
    fetchGroupedStorageFiles();
  }, [fetchSessions, fetchStorageFiles, fetchGroupedStorageFiles]);

  useEffect(() => {
    if (activeSessionId) {
      const found = sessions.find((s) => s.id === activeSessionId) || null;
      setActiveSession(found);
    } else {
      setActiveSession(null);
    }
  }, [activeSessionId, sessions]);

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

  const deleteStorageFile = useCallback(
    async (fileId: string): Promise<boolean> => {
      try {
        const ok = await storageService.deleteStorageFile(fileId);
        if (ok) {
          setStorageFiles((prev) => prev.filter((f) => f.id !== fileId));
          setGroupedStorageFiles((prev) =>
            prev
              .map((g) => {
                const remainingFiles = g.files.filter((f) => f.id !== fileId);
                return {
                  ...g,
                  files: remainingFiles,
                  totalFiles: remainingFiles.length,
                };
              })
              .filter((g) => g.files.length > 0)
          );
        }
        return ok;
      } catch (err) {
        console.error('[SessionContext] Failed to delete storage file:', err);
        return false;
      }
    },
    []
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
        storageFiles,
        groupedStorageFiles,
        activeSessionId,
        activeSession,
        isLoadingSessions,
        isLoadingStorage,
        fetchSessions,
        fetchStorageFiles,
        fetchGroupedStorageFiles,
        selectSession,
        createNewSession,
        renameSession,
        deleteSession,
        deleteStorageFile,
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

