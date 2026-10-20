import { api } from './api';

export class MediaService {
  /**
   * Upload multiple images (up to 5) to server
   */
  static async uploadImages(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await api.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.data.images.map((img: any) => img.url);
    } catch (err: any) {
      console.warn('[MEDIA] Fallback to local Data URI preview if backend unavailable');
      // Fallback: convert to local Base64 / ObjectURL
      const readPromises = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      return await Promise.all(readPromises);
    }
  }
}
