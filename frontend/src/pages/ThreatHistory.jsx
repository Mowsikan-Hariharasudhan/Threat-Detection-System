import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, AlertTriangle, RefreshCw, Search, FileDown, FileText } from 'lucide-react';
import config from '../config';
import { generateGlobalReport, generateSingleThreatReport } from '../utils/pdfGenerator';

const ThreatHistory = () => {
    const [threats, setThreats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchThreats = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${config.API_URL}/api/threats`);
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
            case 'CRITICAL': return 'var(--status-critical)';
            case 'HIGH': return 'var(--status-high)';
            case 'MEDIUM': return 'var(--status-medium)';
            case 'LOW': return 'var(--status-low)';
            default: return 'var(--text-secondary)';
        }
    };

    const filteredThreats = threats.filter(threat =>
        threat.scenario?.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        threat.risk_level?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="text-gradient">Threat History</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Comprehensive log of all detected security events</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => generateGlobalReport(threats)} className="btn btn-primary">
                        <FileDown size={18} />
                        Download Global Report
                    </button>
                    <button onClick={fetchThreats} className="btn btn-ghost" disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh Log
                    </button>
                </div>
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
                                            color: getLevelColor(threat.risk_level),
                                            boxShadow: `0 0 10px ${getLevelColor(threat.risk_level)}40`
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
                                                width: '60px',
                                                height: '6px',
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderRadius: '3px',
                                            }}>
                                                <div style={{
                                                    width: `${threat.risk_score}%`,
                                                    height: '100%',
                                                    backgroundColor: getLevelColor(threat.risk_level),
                                                    borderRadius: '3px',
                                                    boxShadow: `0 0 8px ${getLevelColor(threat.risk_level)}`
                                                }} />
                                            </div>
                                            <span style={{ fontWeight: 'bold' }}>{threat.risk_score}</span>
                                        </div>
                                    </td>
                                    <td>{threat.confidence}%</td>
                                    <td>
                                        <button
                                            onClick={() => generateSingleThreatReport(threat)}
                                            className="btn btn-ghost"
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                fontSize: '0.8rem',
                                            }}
                                        >
                                            <FileText size={14} /> Report
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ThreatHistory;
