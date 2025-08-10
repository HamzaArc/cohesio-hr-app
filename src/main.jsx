import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AppProvider } from './contexts/AppContext.jsx'; // Import our new provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider> {/* Wrap the entire App */}
      <App />
    </AppProvider>
  </React.StrictMode>,
)
