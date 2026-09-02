import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import { queryClient } from './api/queryClient';

// Mitigación de ChunkLoadError ante nuevos despliegues
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected, refreshing page...', event);
  const reloadKey = 'cfp_chunk_reload_timestamp';
  const lastReload = sessionStorage.getItem(reloadKey);
  const now = Date.now();

  // Evitar bucle infinito de reloads si hay un error persistente (mínimo 10 segundos)
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem(reloadKey, now.toString());
    window.location.reload();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CssBaseline />
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

