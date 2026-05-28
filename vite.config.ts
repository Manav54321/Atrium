import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const PROXY = {
  // OpenAI grading agent proxy — keeps the API key server-side.
  // The `/agent/sessions/:id/stream` endpoint is SSE; Vite's proxy
  // handles that correctly as long as we disable buffering on the
  // server side (see backend/server.py). Trailing slash is required
  // so the prefix doesn't catch frontend routes like /agentic-rounds.
  '^/agent/': {
    target: 'http://127.0.0.1:8787',
    changeOrigin: true,
  },
  // Realtime voice — backend mints OpenAI Realtime client secrets.
  '^/voice/': {
    target: 'http://127.0.0.1:8787',
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: PROXY,
  },
  preview: {
    port: 5173,
    proxy: PROXY,
  },
});
