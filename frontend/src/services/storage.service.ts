import axios from 'axios';
import { StorageFileItem, StorageApiResponse } from '../types/storage.types';
import { API_BASE_URL, STORAGE_KEYS } from '../config/env.config';

export class StorageService {
  private getAuthHeader() {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  public async getStorageFiles(): Promise<StorageFileItem[]> {
    try {
      const response = await axios.get<StorageApiResponse>(`${API_BASE_URL}/storage/files`, {
        headers: this.getAuthHeader(),
      });
      return response.data?.data || [];
    } catch (error) {
      console.warn('[StorageService] Failed to fetch storage files:', error);
      return [];
    }
  }

  public async downloadStorageFile(fileId: string, fileName?: string): Promise<void> {
    try {
      const response = await axios.get<{ success: boolean; downloadUrl: string; fileName: string }>(
        `${API_BASE_URL}/storage/files/${encodeURIComponent(fileId)}/download`,
        { headers: this.getAuthHeader() }
      );

      if (response.data?.downloadUrl) {
        const a = document.createElement('a');
        a.href = response.data.downloadUrl;
        a.download = response.data.fileName || fileName || 'skipli_canvas_website.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error('No download URL returned');
      }
    } catch (error) {
      console.error('[StorageService] Download error:', error);
      alert('Không thể tải file HTML. Vui lòng thử lại sau!');
    }
  }

  public async deleteStorageFile(fileId: string): Promise<boolean> {
    try {
      const response = await axios.delete<{ success: boolean }>(`${API_BASE_URL}/storage/files/${fileId}`, {
        headers: this.getAuthHeader(),
      });
      return response.data?.success || false;
    } catch (error) {
      console.error('[StorageService] Delete storage file error:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();
