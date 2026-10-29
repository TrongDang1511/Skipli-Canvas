import { db, isFirebaseInitialized } from '../config/firebase.config';

export interface EmailVerificationRecord {
  email: string;
  otpHash: string;
  expiresAt: string;
  createdAt: string;
}

export class EmailVerificationRepository {
  private collectionName = 'email_verifications';
  private memoryVerifications: Map<string, EmailVerificationRecord> = new Map();

  async saveOtp(email: string, otpHash: string, expiresAt: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();
    const record: EmailVerificationRecord = {
      email: normalizedEmail,
      otpHash,
      expiresAt,
      createdAt: now,
    };

    if (isFirebaseInitialized && db) {
      await db.collection(this.collectionName).doc(normalizedEmail).set(record);
    } else {
      this.memoryVerifications.set(normalizedEmail, record);
    }
  }

  async findByEmail(email: string): Promise<EmailVerificationRecord | null> {
    const normalizedEmail = email.toLowerCase().trim();

    if (isFirebaseInitialized && db) {
      const doc = await db.collection(this.collectionName).doc(normalizedEmail).get();
      if (!doc.exists) return null;
      return doc.data() as EmailVerificationRecord;
    }

    return this.memoryVerifications.get(normalizedEmail) || null;
  }

  async deleteByEmail(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    if (isFirebaseInitialized && db) {
      await db.collection(this.collectionName).doc(normalizedEmail).delete();
    } else {
      this.memoryVerifications.delete(normalizedEmail);
    }
  }
}

export const emailVerificationRepository = new EmailVerificationRepository();
