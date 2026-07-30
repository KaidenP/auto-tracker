import type { PlatformCapabilities } from '$lib/platform/types';

export const webPlatform: PlatformCapabilities = {
  async exportFile(data: string, filename: string): Promise<void> {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async importFile(): Promise<string | null> {
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

  getPlatform(): 'web' {
    return 'web';
  },
};
