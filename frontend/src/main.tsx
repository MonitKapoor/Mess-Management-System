import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';
import AdminApp from './AdminApp';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Failed to find the root element');
}

console.log('Starting render...');

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/" element={<App />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

console.log('Render complete');