import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { ShieldAlert, Activity, Wifi, Server } from 'lucide-react';
import ThreatCard from '../components/ThreatCard';
import config from '../config';
import { generateSingleThreatReport } from '../utils/pdfGenerator';

const Dashboard = () => {
    const [currentThreat, setCurrentThreat] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, critical: 0 });

    useEffect(() => {
        // Initial fetch
        const fetchThreats = async () => {
            try {
                const [threatsRes, statsRes] = await Promise.all([
                    axios.get(`${config.API_URL}/api/threats`),
                    axios.get(`${config.API_URL}/api/stats`)
                ]);

                const threats = threatsRes.data;
                if (threats && threats.length > 0) {
                    // Sort threats by timestamp descending (newest first)
                    const sortedThreats = threats.sort((a, b) =>
                        new Date(b.timestamp) - new Date(a.timestamp)
                    );

                    // Show the most recent threat
                    setCurrentThreat(sortedThreats[0]);
                }

                // Set stats from the dedicated endpoint
                if (statsRes.data) {
                    setStats(statsRes.data);
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchThreats();

        // WebSocket setup
        const socket = io(config.API_URL, {
            transports: ['websocket'],
            path: '/socket.io/',
            withCredentials: false,
            reconnection: true,
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('Connected to WebSocket');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket');
            setIsConnected(false);
        });

        socket.on('new_threat', (threat) => {
            console.log('New threat received:', threat);
            setCurrentThreat(threat);
            setStats(prev => ({
                total: prev.total + 1,
                critical: threat.risk_level === 'CRITICAL' ? prev.critical + 1 : prev.critical
            }));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <div className="container">
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 className="text-gradient">CyberGuard AI</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Real-time Threat Detection System</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>


                    </div>
                </div>
            </header>

            {/* Stats Row */}
            <div className="dashboard-grid" style={{ marginBottom: '3rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', color: 'var(--accent-blue)' }}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{stats.total}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Threats</div>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', color: 'var(--status-critical)' }}>
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{stats.critical}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Critical Alerts</div>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '0.5rem', color: 'var(--status-low)' }}>
                        <Server size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Active</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>System Status</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                        Loading system data...
                    </div>
                ) : currentThreat ? (
                    <div className="fade-in">
                        <div className="header-mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                            <div>
                                <h2 style={{ margin: 0 }}>Live Threat Analysis</h2>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <button
                                    onClick={() => generateSingleThreatReport(currentThreat)}
                                    className="btn btn-ghost"
                                    style={{ fontSize: '0.85rem' }}
                                >
                                    Download Analysis
                                </button>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Last updated: {new Date().toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                        <ThreatCard threat={currentThreat} />
                    </div>
                ) : (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <ShieldAlert size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <h3>No Active Threats Detected</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>System is monitoring network traffic...</p>
                    </div>
                )}
            </main>
            {/* Debug/Version Indicator */}
            <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)', fontSize: '0.75rem', opacity: 0.7 }}>
                System Version: 1.0.1 (WebSocket Only)
            </div>
        </div>
    );
};

export default Dashboard;
