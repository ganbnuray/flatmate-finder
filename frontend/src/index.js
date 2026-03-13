/**
 * @fileoverview Application entry point.
 *
 * Import order matters: Bootstrap's CSS must be imported before index.css
 * so that our custom overrides take precedence over Bootstrap's defaults.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
