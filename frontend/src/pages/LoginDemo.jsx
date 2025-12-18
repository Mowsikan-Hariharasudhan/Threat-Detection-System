import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Lock, User, ArrowRight } from 'lucide-react';
import ThreatCard from '../components/ThreatCard';
import config from '../config';

const LoginDemo = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [message, setMessage] = useState('');
    const [threatData, setThreatData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);

    useEffect(() => {
        if (attempts > 0 && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0) {
            setAttempts(0);
            setTimeLeft(60);
        }
    }, [attempts, timeLeft]);

    const handleLogin = async (e) => {
        e.preventDefault();

        // Simulate failed attempt logic for demo purposes
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts < 3) {
            setMessage('Invalid credentials. Please try again.');
            setPassword('');
            return;
        }

        // On 3rd attempt, trigger the threat detection
        setLoading(true);
        setMessage('Verifying credentials...');

        try {
            // Sending data to backend to trigger the ML model
            const response = await axios.post(`${config.API_URL}/api/demo-login`, {
                username,
                password,
                attempts: newAttempts,
                timestamp: new Date().toISOString()
            });

            if (response.data && response.data.threat) {
                setThreatData(response.data.threat);
                setMessage('Access Denied: Security Alert Triggered');
            } else {
                setMessage('Login failed. Account locked temporarily.');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('System error connecting to security server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        background: 'linear-gradient(135deg, var(--accent-blue), #2563eb)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem',
                        boxShadow: '0 0 20px rgba(37, 99, 235, 0.3)'
                    }}>
                        <Lock color="white" size={32} />
                    </div>
                    <h2>Secure Portal</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Enter your credentials to access</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label className="input-label">Username</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                className="input-field"
                                style={{ paddingLeft: '2.5rem' }}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="admin"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
                            <input
                                type="password"
                                className="input-field"
                                style={{ paddingLeft: '2.5rem' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {attempts > 0 && (
                        <div style={{
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--status-critical)',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            <AlertTriangle size={16} />
                            <span>Failed Attempts: {attempts}/3 ({timeLeft}s reset)</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Login'}
                        {!loading && <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />}
                    </button>
                </form>

                {message && (
                    <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: threatData ? 'var(--status-critical)' : 'var(--text-secondary)' }}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};

export default LoginDemo;
