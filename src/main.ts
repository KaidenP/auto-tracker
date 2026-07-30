import './app.css';
import App from './App.svelte';
import { mount } from 'svelte';
import { setPlatform } from '$lib/platform/types';
import { webPlatform } from './platform/web';
import { loadSettings } from '$lib/stores/app';

async function bootstrap() {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    const { tauriPlatform } = await import('./platform/tauri');
    setPlatform(tauriPlatform);
  } else if (typeof window !== 'undefined' && 'Capacitor' in window) {
    const { capacitorPlatform } = await import('./platform/capacitor');
    setPlatform(capacitorPlatform);
  } else {
    setPlatform(webPlatform);
  }

  await loadSettings();

  const app = mount(App, {
    target: document.getElementById('app')!,
  });

  return app;
}

const app = bootstrap();

export default app;
