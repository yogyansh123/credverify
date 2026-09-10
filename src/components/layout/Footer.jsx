import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, Globe, Share2, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Footer = () => {
  const { navigateTo } = useApp();

  return (
    <footer style={{
      background: 'rgba(10, 15, 29, 0.95)',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '60px 24px 30px 24px',
      marginTop: '80px',
      color: '#94a3b8'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto'
      }}>
        
        {/* Upper Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '40px',
          marginBottom: '50px'
        }}>
          
          {/* Col 1: Brand & Tagline */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={20} color="#fff" />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Cred<span className="gradient-text-primary">Verify</span>
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px', color: '#64748b' }}>
              The AI-assisted credential verification platform. Helping candidates present their work history transparently with Secure Document Processing.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="#" className="glass-card" style={{ padding: '8px', borderRadius: '8px', color: '#94a3b8' }}><Globe size={18} /></a>
              <a href="#" className="glass-card" style={{ padding: '8px', borderRadius: '8px', color: '#94a3b8' }}><Share2 size={18} /></a>
              <a href="#" className="glass-card" style={{ padding: '8px', borderRadius: '8px', color: '#94a3b8' }}><ExternalLink size={18} /></a>
            </div>
          </div>

          {/* Col 2: Product Links */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '18px' }}>Product & Platform</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li><button onClick={() => navigateTo('dashboard')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Individual Candidate Portal</button></li>
              <li><button onClick={() => navigateTo('recruiter')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Recruiter Audit Dashboard</button></li>
              <li><button onClick={() => navigateTo('upload')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Multi-Document Credential Upload</button></li>
              <li><button onClick={() => navigateTo('analysis')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Real-time AI Verification</button></li>
              <li><button onClick={() => navigateTo('public-profile')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Shareable Verification Profile</button></li>
            </ul>
          </div>

          {/* Col 3: Target Audiences */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '18px' }}>Target Audiences</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Final-Year Students</a></li>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Fresh Graduates</a></li>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Active Job Seekers</a></li>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Working Professionals</a></li>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Hiring Managers & HR teams</a></li>
            </ul>
          </div>

          {/* Col 4: Trust & Security Badges */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '18px' }}>Security & Trust</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Lock size={20} color="#10b981" />
                <div>
                  <span style={{ display: 'block', color: '#ffffff', fontSize: '0.85rem', fontWeight: 600 }}>Secure Document Processing</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Documents are processed securely and not shared</span>
                </div>
              </div>

              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                padding: '12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <CheckCircle2 size={20} color="#818cf8" />
                <div>
                  <span style={{ display: 'block', color: '#ffffff', fontSize: '0.85rem', fontWeight: 600 }}>Privacy-Focused Architecture</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Designed with user data privacy in mind</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          fontSize: '0.85rem'
        }}>
          <div>
            © 2026 CredVerify Inc. Built for Final Year Project Demonstration. All mock credentials protected.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Terms of Service</a>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Security Disclosures</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
