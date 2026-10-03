import React from 'react';
import { createRoot } from 'react-dom/client';
import '../firebase-client.js';
import '../styles.css';
import '../override.css';
import '../features.css';
import '../enhancements.css';
import './react.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<App />);
