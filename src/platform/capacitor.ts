import { Filesystem, Directory } from '@capacitor/filesystem';
import type { PlatformCapabilities } from '$lib/platform/types';

export const capacitorPlatform: PlatformCapabilities = {
  async exportFile(data: string, filename: string): Promise<void> {
    await Filesystem.writeFile({
      path: filename,
      data,
      directory: Directory.Documents,
    });
  },

  async importFile(): Promise<string | null> {
    // Capacitor doesn't have a built-in file picker in the Filesystem plugin.
    // For web-based fallback, we use the web platform's file input.
    // For Android, we need @capacitor/dialog or a custom implementation.
    // For now, fall back to web picker behavior.
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const text = await file.text();
        resolve(text);
      };
      input.click();
    });
  },

  getPlatform(): 'capacitor' {
    return 'capacitor';
  },
};
