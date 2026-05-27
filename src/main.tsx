import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { clearAllConversationStorage } from './voice/conversationStore';

// Each browser load = fresh shift. Old per-case chat history could otherwise
// leak the previous farewell into the next encounter as the "last assistant
// message" subtitle.
clearAllConversationStorage();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
