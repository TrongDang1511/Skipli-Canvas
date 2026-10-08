import { db, isFirebaseInitialized } from '../config/firebase.config';
import { StorageFile, StorageFileMetadata } from '../models/storage.model';

export class StorageRepository {
  private inMemoryStorage: Map<string, StorageFile> = new Map();

  public async createStorageFile(file: StorageFile): Promise<StorageFile> {
    this.inMemoryStorage.set(file.id, file);

    if (isFirebaseInitialized && db) {
      try {
        await db.collection('storage_files').doc(file.id).set(file);
      } catch (error) {
        console.warn('[StorageRepository] Firestore set failed, saved to in-memory:', error);
      }
    }
    return file;
  }

  public async findFilesByUserId(userId: string): Promise<StorageFileMetadata[]> {
    const fileMap = new Map<string, StorageFileMetadata>();

    // 1. Prioritize querying Firestore if initialized
    if (isFirebaseInitialized && db) {
      try {
        const snapshot = await db
          .collection('storage_files')
          .where('userId', '==', userId)
          .get();

        if (!snapshot.empty) {
          snapshot.docs.forEach((doc) => {
            const data = doc.data() as StorageFile;
            const { htmlContent, ...meta } = data;
            fileMap.set(meta.id, meta);
          });
        }
      } catch (error) {
        console.warn('[StorageRepository] Firestore query failed, reading from in-memory:', error);
      }
    }

    // 2. Merge with in-memory storage files for this user
    for (const file of this.inMemoryStorage.values()) {
      if (file.userId === userId && !fileMap.has(file.id)) {
        const { htmlContent, ...meta } = file;
        fileMap.set(meta.id, meta);
      }
    }

    const files = Array.from(fileMap.values());
    return files.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async findFileById(id: string, userId: string): Promise<StorageFile | null> {
    if (isFirebaseInitialized && db) {
      try {
        const doc = await db.collection('storage_files').doc(id).get();
        if (doc.exists) {
          const data = doc.data() as StorageFile;
          if (data.userId === userId) {
            return data;
          }
        }
      } catch (error) {
        console.warn('[StorageRepository] Firestore get failed, fallback to in-memory:', error);
      }
    }

    const memory = this.inMemoryStorage.get(id);
    if (memory && memory.userId === userId) {
      return memory;
    }

    return null;
  }

  public async deleteFile(id: string, userId: string): Promise<boolean> {
    let deleted = false;

    if (this.inMemoryStorage.has(id)) {
      const memory = this.inMemoryStorage.get(id);
      if (memory?.userId === userId) {
        this.inMemoryStorage.delete(id);
        deleted = true;
      }
    }

    if (isFirebaseInitialized && db) {
      try {
        const docRef = db.collection('storage_files').doc(id);
        const doc = await docRef.get();
        if (doc.exists && doc.data()?.userId === userId) {
          await docRef.delete();
          deleted = true;
        }
      } catch (error) {
        console.warn('[StorageRepository] Firestore delete failed:', error);
      }
    }

    return deleted;
  }
}

export const storageRepository = new StorageRepository();

