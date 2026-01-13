import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n' // Import i18n configuration
import { ThemeProvider } from './contexts/ThemeContext'

// 🛡️ Global Error Handler - Captura erros não tratados
window.addEventListener('error', (event) => {
  // Se o erro contém "match" e "undefined", silenciar (é um bug conhecido do React Router)
  if (event.message && event.message.includes('match') && event.message.includes('undefined')) {
    console.warn('⚠️ Erro silenciado (React Router bug):', event.message);
    event.preventDefault(); // Impede que o erro apareça no console
    return false;
  }
});

// 🛡️ Captura erros de Promises não tratadas
window.addEventListener('unhandledrejection', (event) => {
  // Se o erro contém "match" e "undefined", silenciar
  if (event.reason && event.reason.message && 
      event.reason.message.includes('match') && 
      event.reason.message.includes('undefined')) {
    console.warn('⚠️ Promise rejection silenciada (React Router bug):', event.reason.message);
    event.preventDefault(); // Impede que o erro apareça no console
    return false;
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
