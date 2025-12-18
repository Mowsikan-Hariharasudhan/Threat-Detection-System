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
        <nav className="nav-floating">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/history" className="nav-link">Threat History</Link>
          <Link to="/demo-login" className="nav-link">Login Demo</Link>
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
