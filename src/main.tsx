import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch on window focus in PWA
      retry: 3, // Retry failed requests 3 times
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes by default
    },
  },
})

// Register Service Worker for PWA functionality
const updateSW = registerSW({
  onNeedRefresh() {
    // Show a prompt to user when new content is available
    if (confirm('New content available. Reload to update?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    // Notify user that app is ready to work offline
    console.log('✅ App ready to work offline')

    // Optional: Show a notification to user
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DunApp PWA', {
        body: 'App is ready to work offline!',
        icon: '/icons/icon-192x192.png'
      })
    }
  },
  onRegisterError(error) {
    console.error('Service Worker registration failed:', error)
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
