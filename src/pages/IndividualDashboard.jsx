import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  UploadCloud, 
  Share2, 
  ArrowUpRight, 
  Sparkles, 
  HelpCircle, 
  ChevronRight,
  User,
  ExternalLink,
  Award,
  Clock
} from 'lucide-react';
import { useAnimatedScore } from '../hooks/useAnimatedScore';

export const IndividualDashboard = () => {
  const { 
    user, 
    documents, 
    claims, 
    activities, 
    navigateTo, 
    runVerificationAnalysis, 
    hasResume, 
    analysisMeta, 
    showToast,
    isLoggedIn 
  } = useApp();

  const isRealAuthenticatedUser = Boolean(
    isLoggedIn && 
    user && 
    user.id && 
    !user.isDemo && 
    user.name !== 'Priyan Sharma' &&
    user.id !== 'usr_priyan_992' &&
    !user.name?.toLowerCase().includes('priyan')
  );

  // Requirement 3: If there is no authenticated/current real user, show an appropriate empty/unauthenticated state
  if (!isRealAuthenticatedUser) {
    return (
      <div style={{ maxWidth: '900px', margin: '60px auto 100px auto', padding: '0 24px' }}>
        <div className="glass-card" style={{
          padding: '48px 36px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)'
          }}>
            <ShieldCheck size={36} color="#ffffff" />
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
            Candidate Verification Dashboard
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '560px', margin: '0 auto 32px auto', lineHeight: 1.6 }}>
            Sign in to access your personal verification dashboard, view verified credentials, and track your cryptographic trust score.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
            <button 
              id="unauth-signin-btn"
              onClick={() => navigateTo('auth')} 
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '0.95rem' }}
            >
              Sign In to Your Account
            </button>
            <button 
              id="unauth-upload-btn"
              onClick={() => navigateTo('upload')} 
              className="btn btn-outline"
              style={{ padding: '12px 24px', fontSize: '0.95rem' }}
            >
              <UploadCloud size={16} /> Upload Resume as New Candidate
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            textAlign: 'left',
            paddingTop: '28px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#818cf8', fontWeight: 700, fontSize: '0.9rem' }}>
                <CheckCircle2 size={16} /> Authentic Work History
              </div>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                Prove your employment tenure and roles with cross-referenced HR letters.
              </p>
            </div>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
                <Award size={16} /> Verified Certifications
              </div>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                Corroborate professional licenses and certifications against official certificates.
              </p>
            </div>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem' }}>
                <Sparkles size={16} /> Cryptographic Trust Score
              </div>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                Generate a verifiable trust score to stand out to enterprise recruiters.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasVerificationData = Boolean(
    hasResume && 
    ((analysisMeta && analysisMeta.trustScore !== undefined && analysisMeta.trustScore !== null) || 
     (user?.trustScore !== undefined && user?.trustScore !== null))
  );
  const rawScore = hasVerificationData ? (user.trustScore ?? analysisMeta?.trustScore ?? 0) : 0;
  const animatedScore = useAnimatedScore(rawScore, 400);
  const strokeDashoffset = hasVerificationData ? (283 - (283 * rawScore) / 100) : 283;

  // Derive dynamic profile completion percentage from actual documents and verification state
  const supportingDocsCount = (documents || []).filter(d => {
    const cat = (d.category || '').toLowerCase();
    const name = (d.name || d.original_name || '').toLowerCase();
    return cat !== 'resume' && !name.includes('resume') && !name.includes('cv');
  }).length;
  const dynamicProfileCompletion = hasResume
    ? Math.min(100, 25 + Math.min(75, supportingDocsCount * 25))
    : 0;
  const profileCompletionPercent = user?.profileCompletion || dynamicProfileCompletion;

  return (
    <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* WELCOME BANNER */}
      <div className="glass-card" style={{
        padding: '32px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img 
              src={user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"} 
              alt={user.name}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #6366f1',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                  Welcome back, {user.name}
                </h1>
                {hasVerificationData && (user?.trustScore ?? 0) >= 65 ? (
                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} /> Verified Profile
                  </span>
                ) : hasVerificationData ? (
                  <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} /> Needs Evidence
                  </span>
                ) : (
                  <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={12} /> Profile Setup
                  </span>
                )}
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '4px' }}>
                {user.headline || 'Verified Professional'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                if (hasResume) {
                  runVerificationAnalysis();
                } else {
                  showToast('Upload a resume to start verification.', 'info');
                  navigateTo('upload');
                }
              }}
              className="btn btn-primary"
            >
              <Sparkles size={18} /> Start New Verification
            </button>
            
            <button 
              onClick={() => navigateTo('public-profile')}
              className="btn btn-outline"
            >
              <Share2 size={18} /> Public Profile <ExternalLink size={14} />
            </button>
          </div>

        </div>

        {/* Profile Completion Indicator */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
              Profile Verification Strength: <strong style={{ color: '#fff' }}>{profileCompletionPercent}% Complete</strong>
            </span>
            <span style={{ fontSize: '0.75rem', color: '#818cf8', cursor: 'pointer' }} onClick={() => navigateTo('upload')}>
              + Upload Supporting Credentials &rarr;
            </span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${profileCompletionPercent}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: '4px' }}></div>
          </div>
        </div>

      </div>

      {/* METRICS & SCORE GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        
        {/* Card 1: Trust Score Ring */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          <div style={{ position: 'relative', width: '90px', height: '90px' }}>
            <svg width="90" height="90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              <circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke="url(#scoreGrad)" 
                strokeWidth="8" 
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                className="trust-score-circle"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{hasVerificationData ? `${animatedScore}%` : '—'}</span>
              <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', marginTop: '2px' }}>Score</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Verification Trust Score</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: hasVerificationData ? (rawScore >= 85 ? '#10b981' : rawScore >= 70 ? '#38bdf8' : '#f59e0b') : '#94a3b8', marginTop: '4px' }}>
              {hasVerificationData ? (rawScore >= 85 ? 'Excellent Trust' : rawScore >= 70 ? 'Moderate Trust' : 'Under Review') : 'Not Available'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              {hasVerificationData ? 'Based on latest verified analysis' : 'Upload a resume to start verification.'}
            </p>
          </div>

        </div>

        {/* Card 2: Verified Credentials */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Verified Credentials</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{hasVerificationData ? (user.verifiedCount || 0) : 0} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>Corroborated</span></h2>
          <span style={{ fontSize: '0.75rem', color: hasVerificationData ? '#10b981' : '#64748b', marginTop: '6px', display: 'block' }}>
            {hasVerificationData ? `${user.verifiedCount || 0} claims supported by evidence` : 'No verified claims yet'}
          </span>
        </div>

        {/* Card 3: Flagged Discrepancies */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Flagged Discrepancies</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{hasVerificationData ? (user.flaggedCount || 0) : 0} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>Claim Alert</span></h2>
          <span style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '6px', display: 'block' }}>
            {hasVerificationData && user.flaggedCount > 0 ? `${user.flaggedCount} discrepancies identified` : 'No discrepancies detected'}
          </span>
        </div>

        {/* Card 4: Unsupported Claims */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Unsupported Claims</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8' }}>
              <HelpCircle size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#94a3b8' }}>{hasVerificationData ? (user.unsupportedCount || 0) : 0} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Unverified</span></h2>
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', display: 'block' }}>
            {hasVerificationData && user.unsupportedCount > 0 ? `${user.unsupportedCount} claims require upload` : 'No pending unsupported claims'}
          </span>
        </div>

      </div>

      {/* RECENT VERIFICATION ACTIVITY & DOCUMENTS ROW */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '30px'
      }}>
        
        {/* Left Column: Recent Verification Activity */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Recent Verification Activity</h3>
            {hasVerificationData && activities.length > 0 && (
              <button onClick={() => navigateTo('report')} className="btn btn-sm btn-outline">
                Full Report &rarr;
              </button>
            )}
          </div>

          {activities.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '36px 16px', 
              color: '#64748b',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '10px',
              border: '1px dashed rgba(255, 255, 255, 0.08)'
            }}>
              <Clock size={28} color="#64748b" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.6 }} />
              <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px' }}>
                No verification activity yet.
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '16px' }}>
                Upload a resume to begin verification.
              </div>
              <button 
                id="empty-activity-upload-resume-btn"
                onClick={() => navigateTo('upload')} 
                className="btn btn-sm btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <UploadCloud size={14} /> Upload Resume
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activities.map((act) => {
                const isMismatch = act.status === 'Mismatch Alert' || act.type === 'mismatch';
                return (
                  <div key={act.id} style={{
                    background: isMismatch ? 'rgba(239, 68, 68, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                    border: isMismatch ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMismatch ? '10px' : '0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>{act.action}</div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                          {act.supportingDocument ? `Document: ${act.supportingDocument} • ` : ''}{act.date}
                        </div>
                      </div>
                      <span className={`badge ${act.status === 'Verified' ? 'badge-success' : isMismatch ? 'badge-danger' : act.status === 'Unsupported' ? 'badge-neutral' : 'badge-info'}`}>
                        {act.status}
                      </span>
                    </div>

                    {isMismatch && (
                      <div style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px'
                      }}>
                        {act.claimText && (
                          <div style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 600 }}>
                            "{act.claimText}"
                          </div>
                        )}
                        <div style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 500 }}>
                          Issue: {act.mismatchReason || 'Mismatch detected — view report for details'}
                        </div>
                        <div style={{ marginTop: '2px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => navigateTo('report', null, { highlightClaimId: act.claimId })}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#818cf8',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 0'
                            }}
                          >
                            View Details &rarr;
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Uploaded Credentials Overview */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Active Uploaded Proofs</h3>
            <button onClick={() => navigateTo('upload')} className="btn btn-sm btn-primary">
              <UploadCloud size={14} /> Upload New
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {documents.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '32px 16px', 
                color: '#64748b',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '10px',
                border: '1px dashed rgba(255, 255, 255, 0.08)'
              }}>
                <FileText size={28} color="#64748b" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.6 }} />
                <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>
                  No active proofs uploaded
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  Upload credentials to corroborate your resume claims.
                </div>
              </div>
            ) : (
              documents.slice(0, 4).map((doc) => (
                <div key={doc.id} style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={20} color="#818cf8" />
                    <div>
                      <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{doc.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{doc.category} • {doc.fileSize}</div>
                    </div>
                  </div>
                  <span className={`badge ${doc.status === 'Verified' ? 'badge-success' : doc.status === 'Mismatch' ? 'badge-danger' : doc.status === 'Unsupported' ? 'badge-neutral' : 'badge-warning'}`}>
                    {doc.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
