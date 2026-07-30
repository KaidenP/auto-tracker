export interface PlatformCapabilities {
  exportFile(data: string, filename: string): Promise<void>;
  importFile(): Promise<string | null>;
  getPlatform(): 'web' | 'tauri' | 'capacitor';
}

let platformImpl: PlatformCapabilities | null = null;

export function setPlatform(impl: PlatformCapabilities) {
  platformImpl = impl;
}

export function getPlatform(): PlatformCapabilities {
  if (!platformImpl) {
    throw new Error('Platform not initialized');
  }
  return platformImpl;
}
