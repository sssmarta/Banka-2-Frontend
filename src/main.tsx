import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ArbitroProvider } from './context/ArbitroContext';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ArbitroProvider>
            <App />
          </ArbitroProvider>
        </AuthProvider>
        <ToastContainer position="bottom-right" autoClose={4000} />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
