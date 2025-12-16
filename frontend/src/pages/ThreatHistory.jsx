import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, AlertTriangle, RefreshCw, Search } from 'lucide-react';
import config from '../config';

const ThreatHistory = () => {
    const [threats, setThreats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchThreats = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${config.API_URL}/api/threats`);
            // Sort by timestamp descending
            const sortedThreats = res.data.sort((a, b) =>
                new Date(b.timestamp) - new Date(a.timestamp)
            );
            setThreats(sortedThreats);
        } catch (err) {
            console.error("Failed to fetch threats", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchThreats();
    }, []);

    const getLevelColor = (level) => {
        switch (level?.toUpperCase()) {
            case 'CRITICAL': return 'var(--accent-red)';
            case 'HIGH': return 'var(--accent-red)';
            case 'MEDIUM': return 'var(--accent-yellow)';
            case 'LOW': return 'var(--accent-green)';
            default: return 'var(--text-secondary)';
        }
    };

    const filteredThreats = threats.filter(threat =>
        threat.scenario?.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        threat.risk_level?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ minHeight: '100vh', padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="text-gradient">Threat History</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Comprehensive log of all detected security events</p>
                </div>
                <button onClick={fetchThreats} className="btn btn-primary" disabled={loading}>
                    <RefreshCw size={18} style={{ marginRight: '0.5rem', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    Refresh Log
                </button>
            </header>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            className="input-field"
                            style={{ paddingLeft: '2.5rem' }}
                            placeholder="Search by threat type or risk level..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="card table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Risk Level</th>
                            <th>Threat Type</th>
                            <th>Risk Score</th>
                            <th>Confidence</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading records...</td>
                            </tr>
                        ) : filteredThreats.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No threats found matching your criteria.</td>
                            </tr>
                        ) : (
                            filteredThreats.map((threat) => (
                                <tr key={threat.id || threat._id}>
                                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                                        {new Date(threat.timestamp).toLocaleString()}
                                    </td>
                                    <td>
                                        <span className="badge" style={{
                                            backgroundColor: `${getLevelColor(threat.risk_level)}20`,
                                            color: getLevelColor(threat.risk_level)
                                        }}>
                                            {threat.risk_level}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{threat.scenario?.type}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{threat.scenario?.severity} Severity</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '6px',
                                                backgroundColor: '#334155',
                                                borderRadius: '3px',
                                                flexGrow: 1
                                            }}>
                                                <div style={{
                                                    width: `${threat.risk_score}%`,
                                                    height: '100%',
                                                    backgroundColor: getLevelColor(threat.risk_level),
                                                    borderRadius: '3px'
                                                }} />
                                            </div>
                                            <span style={{ fontWeight: 'bold' }}>{threat.risk_score}</span>
                                        </div>
                                    </td>
                                    <td>{threat.confidence}%</td>
                                    <td>
                                        <button className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
};

export default ThreatHistory;
