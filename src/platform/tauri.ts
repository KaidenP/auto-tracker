import { invoke } from '@tauri-apps/api/core';
import type { PlatformCapabilities } from '$lib/platform/types';

export const tauriPlatform: PlatformCapabilities = {
  async exportFile(data: string, _filename: string): Promise<void> {
    await invoke('export_file', { data });
  },

  async importFile(): Promise<string | null> {
    const result = await invoke<string | null>('import_file');
    return result;
  },

  getPlatform(): 'tauri' {
    return 'tauri';
  },
};
