import { db, isFirebaseInitialized } from '../config/firebase.config';
import { Session, SessionMessage } from '../models/session.model';

export class SessionRepository {
  private sessionsCollection = 'sessions';
  private messagesCollection = 'session_messages';

  private memorySessions: Map<string, Session> = new Map();
  private memoryMessages: Map<string, SessionMessage> = new Map();

  async findSessionsByUserId(userId: string): Promise<Session[]> {
    if (isFirebaseInitialized && db) {
      try {
        const snapshot = await db
          .collection(this.sessionsCollection)
          .where('userId', '==', userId)
          .get();

        const sessions = snapshot.docs.map((doc) => doc.data() as Session);
        return sessions.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return timeB - timeA;
        });
      } catch (err) {
        console.error('[SessionRepository] findSessionsByUserId firestore error:', err);
      }
    }

    // In-memory fallback
    const userSessions: Session[] = [];
    for (const session of this.memorySessions.values()) {
      if (session.userId === userId) {
        userSessions.push(session);
      }
    }
    return userSessions.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }

  async findSessionById(id: string, userId: string): Promise<Session | null> {
    if (!id || typeof id !== 'string' || !id.trim()) {
      return null;
    }

    const cleanId = id.trim();

    if (isFirebaseInitialized && db) {
      try {
        const doc = await db.collection(this.sessionsCollection).doc(cleanId).get();
        if (doc.exists) {
          const data = doc.data() as Session;
          if (data.userId === userId) {
            this.memorySessions.set(cleanId, data);
            return data;
          }
        }
      } catch (err) {
        console.error('[SessionRepository] findSessionById firestore error:', err);
      }
    }

    const session = this.memorySessions.get(cleanId);
    if (!session || session.userId !== userId) return null;
    return session;
  }

  async createSession(session: Session): Promise<Session> {
    this.memorySessions.set(session.id, session);

    if (isFirebaseInitialized && db) {
      try {
        await db.collection(this.sessionsCollection).doc(session.id).set(session);
      } catch (err) {
        console.error('[SessionRepository] createSession firestore error:', err);
      }
    }
    return session;
  }

  async updateSession(id: string, userId: string, updates: Partial<Session>): Promise<Session | null> {
    if (!id || typeof id !== 'string' || !id.trim()) return null;
    const cleanId = id.trim();

    const existing = await this.findSessionById(cleanId, userId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updatedData = { ...existing, ...updates, updatedAt: now };

    this.memorySessions.set(cleanId, updatedData);

    if (isFirebaseInitialized && db) {
      try {
        await db.collection(this.sessionsCollection).doc(cleanId).update(updatedData);
      } catch (err) {
        console.error('[SessionRepository] updateSession firestore error:', err);
      }
    }

    return updatedData;
  }

  async deleteSession(id: string, userId: string): Promise<boolean> {
    if (!id || typeof id !== 'string' || !id.trim()) return false;
    const cleanId = id.trim();

    const existing = await this.findSessionById(cleanId, userId);
    if (!existing) return false;

    this.memorySessions.delete(cleanId);
    for (const [msgId, msg] of this.memoryMessages.entries()) {
      if (msg.sessionId === cleanId) {
        this.memoryMessages.delete(msgId);
      }
    }

    if (isFirebaseInitialized && db) {
      try {
        await db.collection(this.sessionsCollection).doc(cleanId).delete();

        const msgsSnapshot = await db
          .collection(this.messagesCollection)
          .where('sessionId', '==', cleanId)
          .get();

        if (!msgsSnapshot.empty) {
          const batch = db.batch();
          msgsSnapshot.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (err) {
        console.error('[SessionRepository] deleteSession firestore error:', err);
      }
    }
    return true;
  }

  async findMessagesBySessionId(sessionId: string, userId: string): Promise<SessionMessage[]> {
    if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) return [];
    const cleanId = sessionId.trim();

    if (isFirebaseInitialized && db) {
      try {
        const snapshot = await db
          .collection(this.messagesCollection)
          .where('sessionId', '==', cleanId)
          .get();

        const messages = snapshot.docs
          .map((doc) => doc.data() as SessionMessage)
          .filter((m) => m.userId === userId);

        return messages.sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeA - timeB;
        });
      } catch (err) {
        console.error('[SessionRepository] findMessagesBySessionId firestore error:', err);
      }
    }

    const result: SessionMessage[] = [];
    for (const msg of this.memoryMessages.values()) {
      if (msg.sessionId === cleanId && msg.userId === userId) {
        result.push(msg);
      }
    }
    return result.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeA - timeB;
    });
  }

  async createMessage(message: SessionMessage): Promise<SessionMessage> {
    this.memoryMessages.set(message.id, message);

    if (isFirebaseInitialized && db) {
      try {
        await db.collection(this.messagesCollection).doc(message.id).set(message);
      } catch (err) {
        console.error('[SessionRepository] createMessage firestore error:', err);
      }
    }
    return message;
  }
}

export const sessionRepository = new SessionRepository();
