import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LoginDemo from './pages/LoginDemo';
import ThreatHistory from './pages/ThreatHistory';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Navigation for easy switching during demo */}
        <nav style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
          display: 'flex',
          gap: '1rem'
        }}>
          <Link to="/" className="btn" style={{
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(4px)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            padding: '0.5rem 1rem'
          }}>
            Dashboard
          </Link>
          <Link to="/history" className="btn" style={{
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(4px)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            padding: '0.5rem 1rem'
          }}>
            Threat History
          </Link>
          <Link to="/demo-login" className="btn" style={{
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(4px)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            padding: '0.5rem 1rem'
          }}>
            Login Demo
          </Link>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<ThreatHistory />} />
          <Route path="/demo-login" element={<LoginDemo />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
