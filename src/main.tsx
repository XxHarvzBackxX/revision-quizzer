import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initializeTheme } from './theme';
import { AccountProvider } from './account/AccountContext';
import './styles.css';

initializeTheme();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AccountProvider><App /></AccountProvider>
  </React.StrictMode>
);
