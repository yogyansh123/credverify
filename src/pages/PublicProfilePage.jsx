import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  QrCode, 
  Copy, 
  ExternalLink, 
  Calendar,
  Lock,
  User,
  Building2,
  GraduationCap,
  Award,
  Check
} from 'lucide-react';

export const PublicProfilePage = () => {
  const { user, selectedCandidate, showToast } = useApp();
  const [copied, setCopied] = useState(false);

  // If a candidate was selected from recruiter dashboard, view that candidate, else view logged-in user
  const profile = selectedCandidate || {
    name: user.name,
    headline: user.headline,
    trustScore: user.trustScore,
    verifiedCount: user.verifiedCount,
    flaggedCount: user.flaggedCount,
    lastVerified: user.verificationDate,
    avatarUrl: user.avatarUrl,
    summary: user.summary,
    publicId: user.publicId
  };

  const profileSlug = profile.publicId || (profile.name ? profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'verified-candidate');
  const profileUrl = `https://credverify.io/verify/${profileSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    showToast('Public Credential Verification link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
      
      {/* PUBLIC VERIFICATION BANNER */}
      <div style={{
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={22} color="#10b981" />
          <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
            Sample Candidate Verification Profile • Powered by CredVerify (Demo)
          </span>
        </div>
        <button 
          onClick={handleCopyLink}
          className="btn btn-sm btn-primary"
        >
          {copied ? <Check size={14} /> : <Share2 size={14} />} {copied ? 'Link Copied!' : 'Share Verified Profile'}
        </button>
      </div>

      {/* CANDIDATE HEADER CARD */}
      <div className="glass-card" style={{ padding: '36px', marginBottom: '28px', position: 'relative' }}>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '24px'
        }}>
          
          {/* Left: Avatar & Candidate Info */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <img 
              src={profile.avatarUrl} 
              alt={profile.name}
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #10b981',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)'
              }}
            />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{profile.name}</h1>
                <span className="badge badge-success" style={{ padding: '6px 12px' }}>
                  <ShieldCheck size={14} /> Sample Verified Profile
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>DEMO DATA</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '4px' }}>
                {profile.headline || 'Senior Software Engineer | Full-Stack & AI Systems'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', fontSize: '0.8rem', color: '#64748b' }}>
                <span><Calendar size={14} style={{ verticalAlign: 'middle' }} /> Analysis Date: {profile.lastVerified || 'Sep 02, 2026'}</span>
                <span><Lock size={14} style={{ verticalAlign: 'middle' }} /> Document ID: CV-89F2-BC</span>
              </div>
            </div>
          </div>

          {/* Right: Trust Score & QR Code Box */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            minWidth: '180px'
          }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
              {profile.trustScore}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>
              Verification Score
            </div>
            
            {/* QR Code Placeholder Graphic */}
            <div style={{
              margin: '14px auto 0 auto',
              width: '80px',
              height: '80px',
              background: '#ffffff',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrCode size={68} color="#07090e" />
            </div>
            <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginTop: '4px' }}>Scan to Audit Report</span>
          </div>

        </div>

        {/* Candidate Professional Summary */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>Professional Summary</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {profile.summary || 'Results-driven Software Engineer with 4+ years of experience in distributed backend engines, modern cloud computing, and real-time frontend user interfaces.'}
          </p>
        </div>

      </div>

      {/* VERIFIED CREDENTIAL SHOWCASE GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        
        {/* Item 1: Degree */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <GraduationCap size={24} color="#818cf8" />
            <span className="badge badge-success">Verified</span>
          </div>
          <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>B.Tech Computer Science</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>IIT Delhi (2018 - 2022)</p>
          <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'block', marginTop: '10px' }}>✓ Registrar Hash Validated</span>
        </div>

        {/* Item 2: Certification */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <Award size={24} color="#a855f7" />
            <span className="badge badge-success">Verified</span>
          </div>
          <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>AWS Solutions Architect</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>Amazon Web Services (Valid through 2027)</p>
          <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'block', marginTop: '10px' }}>✓ API Record Verified</span>
        </div>

        {/* Item 3: Work Experience */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <Building2 size={24} color="#f59e0b" />
            <span className="badge badge-warning">Needs Review</span>
          </div>
          <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>TechCorp Work History</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>Stated 3.5 Yrs vs Letter 3.2 Yrs</p>
          <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'block', marginTop: '10px' }}>⚠️ Minor Tenure Discrepancy</span>
        </div>

      </div>

      {/* SHAREABLE PROFILE SHARE DRAWER / LINK BOX */}
      <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
        <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>
          Include this link on your Resume or LinkedIn Profile
        </h4>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '16px' }}>
          Recruiters and hiring managers can click to instantly audit your verified credentials.
        </p>

        <div style={{
          display: 'flex',
          maxWidth: '540px',
          margin: '0 auto',
          gap: '8px'
        }}>
          <input 
            type="text" 
            readOnly 
            className="form-input" 
            value={profileUrl}
            style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
          <button 
            onClick={handleCopyLink}
            className="btn btn-primary"
          >
            <Copy size={16} /> Copy
          </button>
        </div>
      </div>

    </div>
  );
};
