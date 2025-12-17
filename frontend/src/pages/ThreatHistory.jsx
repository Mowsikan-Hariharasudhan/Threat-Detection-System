import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, AlertTriangle, RefreshCw, Search, FileDown } from 'lucide-react';
import config from '../config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    const generatePDF = () => {
        const doc = new jsPDF();

        // --- Branding & Header ---
        // Dark blue header background
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 40, 'F');

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("Security Threat Report", 14, 20);

        // Subtitle / Date
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text("Confidential Security Audit", 196, 20, { align: 'right' });

        // --- Summary Statistics ---
        const total = threats.length;
        const critical = threats.filter(t => t.risk_level === 'CRITICAL').length;
        const high = threats.filter(t => t.risk_level === 'HIGH').length;

        doc.setTextColor(50, 50, 50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Executive Summary", 14, 50);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Threats Detected: ${total}`, 14, 60);
        doc.text(`Critical Incidents: ${critical}`, 14, 66);
        doc.text(`High Priority Risks: ${high}`, 14, 72);

        // --- Data Table ---
        const tableData = threats.map(t => [
            new Date(t.timestamp).toLocaleString(),
            t.risk_level,
            t.scenario?.type || 'Unknown',
            `${t.risk_score}/100`,
            `${t.confidence}%`
        ]);

        autoTable(doc, {
            startY: 80,
            head: [['Timestamp', 'Risk Level', 'Threat Type', 'Score', 'Conf.']],
            body: tableData,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 3,
                textColor: [30, 41, 59]
            },
            headStyles: {
                fillColor: [15, 23, 42],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 45 },
                1: { cellWidth: 25, fontStyle: 'bold' },
                2: { cellWidth: 'auto' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 20, halign: 'center' }
            },
            didParseCell: function (data) {
                // Color code the Risk Level column
                if (data.section === 'body' && data.column.index === 1) {
                    const level = data.cell.raw;
                    if (level === 'CRITICAL') data.cell.styles.textColor = [220, 38, 38]; // Red
                    else if (level === 'HIGH') data.cell.styles.textColor = [220, 38, 38];
                    else if (level === 'MEDIUM') data.cell.styles.textColor = [202, 138, 4]; // Yellow/Orange
                    else if (level === 'LOW') data.cell.styles.textColor = [22, 163, 74]; // Green
                }
            }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
            doc.text('AI-Powered Threat Detection System', 14, 285);
        }

        doc.save('threat-detection-report.pdf');
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
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={generatePDF} className="btn" style={{
                        backgroundColor: 'var(--accent-blue)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <FileDown size={18} />
                        Download Report
                    </button>
                    <button onClick={fetchThreats} className="btn btn-primary" disabled={loading}>
                        <RefreshCw size={18} style={{ marginRight: '0.5rem', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
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
