import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1A1A24',
          color: '#E8E8F0',
          fontSize: '13px',
          border: '1px solid #1E1E2E',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        },
        success: {
          iconTheme: { primary: '#00D4AA', secondary: '#111118' },
        },
        error: {
          iconTheme: { primary: '#FF4757', secondary: '#111118' },
        },
      }}
    />
  </React.StrictMode>
)
