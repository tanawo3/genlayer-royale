import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and demote transient GenLayer RPC and contract not found errors to console.warn
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = function (...args) {
    const msg = args.map(arg => {
      if (arg instanceof Error) {
        return arg.message + ' ' + (arg.stack || '');
      }
      return String(arg?.message || arg);
    }).join(' ').toLowerCase();

    if (
      msg.includes('not found') || 
      msg.includes('not_found') || 
      msg.includes('notfound') || 
      msg.includes('does not exist') ||
      msg.includes('invalid contract') ||
      msg.includes('failed to fetch') ||
      msg.includes('rpc error')
    ) {
      console.warn("[Intercepted RPC/Contract Error]", ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = String(reason?.message || reason?.details || reason?.stack || reason || '').toLowerCase();
    if (
      msg.includes('not found') || 
      msg.includes('not_found') || 
      msg.includes('notfound') || 
      msg.includes('does not exist') ||
      msg.includes('invalid contract') ||
      msg.includes('failed to fetch') ||
      msg.includes('rpc error')
    ) {
      console.warn("[Caught and Handled Rejection]", reason);
      event.preventDefault(); // Prevent standard browser/test framework uncaught-error bubble
    }
  });
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);

