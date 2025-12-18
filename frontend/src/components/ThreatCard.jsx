import React from 'react';
import { AlertTriangle, Shield, Activity, Lock, Server, Globe } from 'lucide-react';

const ThreatCard = ({ threat }) => {
  if (!threat) return null;

  const {
    risk_score,
    risk_level,
    risk_factors,
    scenario,
    recommendations,
    confidence
  } = threat;

  const getLevelColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return 'var(--accent-red)';
      case 'HIGH': return 'var(--accent-red)';
      case 'MEDIUM': return 'var(--accent-yellow)';
      case 'LOW': return 'var(--accent-green)';
      default: return 'var(--text-secondary)';
    }
  };

  const levelColor = getLevelColor(risk_level);

  return (
    <div className="card fade-in" style={{ borderTop: `4px solid ${levelColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={24} color={levelColor} />
            THREAT DETECTED
          </h2>
          <span style={{
            backgroundColor: `${levelColor}20`,
            color: levelColor,
            padding: '0.25rem 0.75rem',
            borderRadius: '99px',
            fontSize: '0.875rem',
            fontWeight: 'bold'
          }}>
            {risk_level}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '3rem', fontWeight: '800', lineHeight: 1, color: levelColor }}>
            {risk_score}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>RISK SCORE</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            <Activity size={18} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            Risk Factors
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {risk_factors && Object.entries(risk_factors).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{key.replace('_', ' ')}</span>
                <div style={{ width: '100px', height: '6px', backgroundColor: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(value / 5) * 100}%`,
                    height: '100%',
                    backgroundColor: levelColor
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            <Globe size={18} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            Scenario Analysis
          </h3>
          <div style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '0.5rem' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{scenario?.type}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{scenario?.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '1rem' }}>
              <span>Severity: <span style={{ color: levelColor }}>{scenario?.severity}</span></span>
              <span>Confidence: {confidence}%</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          <Lock size={18} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
          Recommended Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {recommendations && recommendations.map((action, index) => (
            <div key={index} style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '0.75rem',
              backgroundColor: '#0f172a',
              borderRadius: '0.5rem',
              borderLeft: `3px solid ${levelColor}`
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '50%',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {index + 1}
              </span>
              <span style={{ fontSize: '0.9rem' }}>{action}</span>
            </div>
          ))}
        </div>
      </div>

      {threat.automated_actions && threat.automated_actions.length > 0 && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', border: '1px solid var(--accent-red)' }}>
          <h3 style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Server size={20} />
            AUTOMATED RESPONSE ENABLED
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {threat.automated_actions.map((action, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#f8fafc',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-red)', boxShadow: '0 0 5px var(--accent-red)' }}></div>
                {action.replace(/_/g, ' ')}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--accent-red)', opacity: 0.8 }}>
            * System has automatically executed these containment protocols.
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatCard;
