import { db, isFirebaseInitialized } from '../config/firebase.config';
import { User } from '../models/user.model';

export class UserRepository {
  private collectionName = 'users';
  private memoryUsers: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();

    if (isFirebaseInitialized && db) {
      const snapshot = await db
        .collection(this.collectionName)
        .where('email', '==', normalizedEmail)
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return doc.data() as User;
    }

    // In-memory fallback
    for (const user of this.memoryUsers.values()) {
      if (user.email.toLowerCase() === normalizedEmail) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    if (isFirebaseInitialized && db) {
      const doc = await db.collection(this.collectionName).doc(id).get();
      if (!doc.exists) return null;
      return doc.data() as User;
    }

    return this.memoryUsers.get(id) || null;
  }

  async create(user: User): Promise<User> {
    if (isFirebaseInitialized && db) {
      await db.collection(this.collectionName).doc(user.id).set(user);
    } else {
      this.memoryUsers.set(user.id, user);
    }
    return user;
  }

  async updateRefreshToken(userId: string, refreshTokenHash: string | null): Promise<void> {
    const now = new Date().toISOString();

    if (isFirebaseInitialized && db) {
      await db.collection(this.collectionName).doc(userId).update({
        refreshTokenHash,
        updatedAt: now
      });
    } else {
      const existing = this.memoryUsers.get(userId);
      if (existing) {
        this.memoryUsers.set(userId, {
          ...existing,
          refreshTokenHash,
          updatedAt: now
        });
      }
    }
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const now = new Date().toISOString();
    const updateData = { ...updates, updatedAt: now };

    if (isFirebaseInitialized && db) {
      const docRef = db.collection(this.collectionName).doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return null;

      await docRef.update(updateData);
      const updatedDoc = await docRef.get();
      return updatedDoc.data() as User;
    }

    const existing = this.memoryUsers.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updateData };
    this.memoryUsers.set(id, updated);
    return updated;
  }
}

export const userRepository = new UserRepository();
