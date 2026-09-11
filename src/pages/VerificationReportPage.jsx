import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  FileText, 
  Share2, 
  Calendar, 
  Lock,
  ArrowRight,
  ExternalLink,
  Award,
  RefreshCw,
  UploadCloud,
  Sparkles
} from 'lucide-react';
import { useAnimatedScore } from '../hooks/useAnimatedScore';

export const VerificationReportPage = () => {
  const { 
    user, 
    isLoggedIn,
    categoryScores, 
    claims, 
    documents, 
    activeDocument, 
    analysisMeta, 
    showToast, 
    navigateTo, 
    openUploadForClaim,
    openDocumentFile,
    isAnalyzing,
    runVerificationAnalysis,
    hasResume,
    highlightedClaimId
  } = useApp();

  // Scroll to focused mismatch claim if navigating from dashboard View Details
  useEffect(() => {
    if (highlightedClaimId) {
      const el = document.getElementById(`claim-${highlightedClaimId}`) || document.getElementById('mismatch-section');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }
  }, [highlightedClaimId]);

  const handleDownload = () => {
    showToast('Preparing sample report for download preview...', 'info');
    setTimeout(() => {
      window.print();
    }, 600);
  };

  const verifiedClaims = claims.filter(c => c.status === 'Match');
  const mismatchClaims = claims.filter(c => c.status === 'Mismatch');
  const unsupportedClaims = claims.filter(c => c.status === 'Unsupported');
  const pendingClaims = claims.filter(c => c.status === 'Pending');

  // Supporting credential documents attached: ONLY non-resume evidence documents
  const supportingEvidenceDocs = (documents || []).filter(d => {
    const cat = (d.category || '').toLowerCase();
    const name = (d.name || d.original_name || '').toLowerCase();
    return cat !== 'resume' && !name.includes('resume') && !name.includes('cv');
  });

  const docLabel = activeDocument?.name || activeDocument?.original_name || 'Primary Resume';
  // Use the actual active/extracted candidate name. Real uploaded resume must never show Priyan Sharma or mock candidate.
  const cleanDocCandidate = docLabel
    .replace(/\.[^/.]+$/, '')
    .replace(/[_.-]+/g, ' ')
    .replace(/\b(resume|cv|updated|final|doc|v\d+)\b/gi, '')
    .trim();

  const isGenericName = (n) => !n || ['verified candidate', 'candidate', 'new candidate', 'user', 'priyan sharma'].includes(n.trim().toLowerCase());

  // Report subject resolution hierarchy:
  const reportSubjectName = 
    (analysisMeta?.candidateName && !isGenericName(analysisMeta.candidateName) ? analysisMeta.candidateName : null) ||
    (user?.name && !isGenericName(user.name) ? user.name : null) ||
    (cleanDocCandidate && !isGenericName(cleanDocCandidate) && cleanDocCandidate.toLowerCase() !== 'primary resume' ? cleanDocCandidate : null) ||
    analysisMeta?.candidateName ||
    (user?.name && !isGenericName(user.name) ? user.name : null) ||
    'Verified Candidate';

  // Verification dataset exists ONLY when a real Resume exists AND analysis has been run
  const hasAnalysisRun = Boolean(
    hasResume &&
    ((analysisMeta && analysisMeta.trustScore !== undefined && analysisMeta.trustScore !== null) ||
     (user?.trustScore !== undefined && user?.trustScore !== null && user?.trustScore > 0))
  );

  const isRealAuthenticatedUser = Boolean(
    isLoggedIn && 
    user && 
    user.id && 
    !user.isDemo && 
    user.name !== 'Priyan Sharma' &&
    user.id !== 'usr_priyan_992' &&
    !user.name?.toLowerCase().includes('priyan')
  );

  // If there is no authenticated user and no verification data, show clean unauthenticated state
  if (!isRealAuthenticatedUser && !hasAnalysisRun) {
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
            Credential Verification Report
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '560px', margin: '0 auto 32px auto', lineHeight: 1.6 }}>
            Sign in to access candidate verification audit reports, review corroborated credentials, and inspect cryptographic evidence.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
            <button 
              id="unauth-report-signin-btn"
              onClick={() => navigateTo('auth')} 
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '0.95rem' }}
            >
              Sign In to Your Account
            </button>
            <button 
              id="unauth-report-upload-btn"
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
                <CheckCircle2 size={16} /> Employment Claims
              </div>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                Audit employment tenure, job titles, and employers verified against relieving letters.
              </p>
            </div>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
                <Award size={16} /> Official Credentials
              </div>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                Inspect cloud vendor certificates and degrees verified with cryptographic hashes.
              </p>
            </div>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem' }}>
                <Sparkles size={16} /> Audit Trail
              </div>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                Trace exact evidence corroborations with full audit provenance.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Zero-evidence condition: when no non-resume supporting evidence is attached or 0 claims are verified
  const hasZeroEvidence = supportingEvidenceDocs.length === 0 || verifiedClaims.length === 0;

  const displayTrustScore = hasAnalysisRun
    ? (analysisMeta?.trustScore ?? user?.trustScore ?? 0)
    : null;

  const animatedTrustScore = useAnimatedScore(displayTrustScore || 0, 400);

  const isHighTrust = hasAnalysisRun && (displayTrustScore || 0) >= 85;
  const isModerateTrust = hasAnalysisRun && (displayTrustScore || 0) >= 65;

  // Real backend analysis MUST take priority
  const displayCategoryScores = hasAnalysisRun && analysisMeta?.categoryScores && analysisMeta.categoryScores.length > 0
    ? analysisMeta.categoryScores
    : (categoryScores && categoryScores.length > 0 ? categoryScores : []);

  const standardCategories = [
    "Identity Consistency",
    "Education Consistency",
    "Work Experience",
    "Certifications"
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* REPORT HEADER & ACTION BAR */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-info"><ShieldCheck size={12} /> Credential Analysis Report</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Doc: {docLabel}</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }}>
            Credential Verification Summary
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Generated on {user?.verificationDate || 'Today'} • Subject: <strong>{reportSubjectName}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {hasResume ? (
            <button 
              id="rerun-analysis-report-btn"
              onClick={() => runVerificationAnalysis(null, { returnToReport: true })}
              className="btn btn-outline"
              disabled={isAnalyzing}
              title={hasAnalysisRun ? "Re-run analysis to incorporate all uploaded supporting credentials" : "Run verification analysis on uploaded resume"}
            >
              <RefreshCw size={18} className={isAnalyzing ? 'spin-slow' : ''} /> {isAnalyzing ? 'Analyzing...' : hasAnalysisRun ? 'Rerun Analysis' : 'Run Analysis'}
            </button>
          ) : (
            <button 
              id="upload-resume-report-btn"
              onClick={() => navigateTo('upload')}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              title="Upload a resume to start verification"
            >
              <UploadCloud size={18} /> Upload a resume to start verification.
            </button>
          )}

          <button 
            onClick={handleDownload}
            className="btn btn-primary"
          >
            <Download size={18} /> Download PDF Report
          </button>
          
          <button 
            onClick={() => navigateTo('public-profile')}
            className="btn btn-outline"
          >
            <Share2 size={18} /> Share Profile
          </button>
        </div>
      </div>

      {/* IN-FLIGHT RE-ANALYSIS BANNER */}
      {isAnalyzing && (
        <div className="glass-card" style={{
          padding: '16px 24px',
          marginBottom: '24px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderRadius: '12px'
        }}>
          <RefreshCw size={24} className="spin-slow" style={{ color: '#818cf8', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
              Re-evaluating Credentials with Latest Evidence...
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
              Cross-referencing uploaded supporting credentials and updating verification scores in real time.
            </div>
          </div>
        </div>
      )}

      {/* OVERALL SCORE & CATEGORY SCORE GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        
        {/* Overall Trust Badge Card */}
        <div className="glass-card" style={{
          padding: '32px',
          background: !hasAnalysisRun
            ? 'rgba(15, 23, 42, 0.6)'
            : isHighTrust
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)'
            : isModerateTrust
            ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
          borderColor: !hasAnalysisRun
            ? 'rgba(255, 255, 255, 0.08)'
            : isHighTrust ? 'rgba(16, 185, 129, 0.3)' : isModerateTrust ? 'rgba(14, 165, 233, 0.3)' : 'rgba(245, 158, 11, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: !hasAnalysisRun
              ? 'rgba(255, 255, 255, 0.06)'
              : isHighTrust
              ? 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)'
              : isModerateTrust
              ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)'
              : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: !hasAnalysisRun
              ? 'none'
              : isHighTrust
              ? '0 0 30px rgba(16, 185, 129, 0.4)'
              : isModerateTrust
              ? '0 0 30px rgba(14, 165, 233, 0.4)'
              : '0 0 30px rgba(245, 158, 11, 0.35)',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: !hasAnalysisRun ? '#94a3b8' : '#fff' }}>
              {hasAnalysisRun ? `${animatedTrustScore}%` : '—'}
            </span>
          </div>

          <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>Overall Trust Rating</h3>
          <p style={{
            color: !hasAnalysisRun ? '#94a3b8' : isHighTrust ? '#10b981' : isModerateTrust ? '#38bdf8' : '#f59e0b',
            fontWeight: 600,
            fontSize: '0.95rem',
            marginTop: '4px'
          }}>
            {!hasAnalysisRun
              ? 'Upload a resume to start verification.'
              : isHighTrust 
              ? 'Highly Corroborated Profile' 
              : isModerateTrust 
              ? 'Moderately Corroborated Profile' 
              : 'Profile Under Review (No Supporting Evidence)'}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '8px' }}>
            {hasAnalysisRun ? (
              `${verifiedClaims.length} Corroborated • ${mismatchClaims.length} Potential Mismatches • ${unsupportedClaims.length} Unsupported`
            ) : (
              '0 Corroborated • 0 Potential Mismatches • 0 Unsupported'
            )}
          </p>
        </div>

        {/* 4 Category Consistency Scores */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
            Category Consistency Breakdown
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!hasAnalysisRun ? (
              standardCategories.map((catName, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>{catName}</span>
                    <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>
                      Not Available
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '0%', height: '100%' }} />
                  </div>
                </div>
              ))
            ) : (
              displayCategoryScores.map((cat, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{cat.category}</span>
                    <span style={{ color: cat.score >= 90 ? '#10b981' : cat.score >= 75 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                      {cat.score}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${cat.score}%`, 
                      height: '100%', 
                      background: cat.score >= 90 ? '#10b981' : cat.score >= 75 ? '#f59e0b' : '#ef4444' 
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* DETAILED CLAIM-BY-CLAIM REPORT TABLES */}

      {/* 1. Verified Claims Section */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <CheckCircle2 size={22} color="#10b981" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
            Verified / Corroborated Claims ({verifiedClaims.length})
          </h3>
        </div>

        {verifiedClaims.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '0.9rem', padding: '12px 0' }}>
            No verified claims corroborated with supporting documents yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {verifiedClaims.map(c => (
              <div key={c.id} style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '16px',
                borderRadius: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span className="badge badge-success" style={{ marginBottom: '6px' }}>{c.category}</span>
                    <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>"{c.claimText || c.claim_text}"</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px' }}>{c.details}</div>
                  </div>
                  {(() => {
                    const matchedName = c.matchedDocument || c.matched_document;
                    const hasDoc = matchedName && matchedName !== 'No supporting document uploaded' && matchedName !== 'Self-Reported in Resume';
                    return (
                      <span 
                        onClick={hasDoc ? () => openDocumentFile(c) : undefined}
                        className={hasDoc ? "clickable-evidence-doc" : ""}
                        style={{ 
                          fontSize: '0.75rem', 
                          color: '#10b981', 
                          fontWeight: 600,
                          cursor: hasDoc ? 'pointer' : 'default',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                        title={hasDoc ? `Click to view ${matchedName} in a new browser tab` : undefined}
                      >
                        Matched: {matchedName || 'Supporting Document'}
                        {hasDoc && <ExternalLink size={11} />}
                      </span>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Potential Mismatches Section */}
      <div id="mismatch-section" className="glass-card" style={{ padding: '28px', marginBottom: '24px', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <AlertTriangle size={22} color="#ef4444" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
            Potential Mismatches & Discrepancies ({mismatchClaims.length})
          </h3>
        </div>

        {mismatchClaims.length === 0 ? (
          <div style={{ color: '#10b981', fontSize: '0.85rem', padding: '8px 0' }}>
            ✓ No discrepancies or tenure mismatches identified in current credentials.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mismatchClaims.map(c => {
              const isTargeted = highlightedClaimId && (c.id === highlightedClaimId || highlightedClaimId === `mismatch_${c.id}`);
              return (
                <div 
                  id={`claim-${c.id}`}
                  key={c.id} 
                  style={{
                    background: isTargeted ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.08)',
                    border: isTargeted ? '2px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.3)',
                    boxShadow: isTargeted ? '0 0 24px rgba(239, 68, 68, 0.5)' : 'none',
                    padding: '16px',
                    borderRadius: '10px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span className="badge badge-danger">{c.category} Alert</span>
                        {isTargeted && (
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Focused Discrepancy</span>
                        )}
                      </div>
                      <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>"{c.claimText || c.claim_text}"</div>
                      <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '6px', fontWeight: 500 }}>
                        ⚠️ Potential Mismatch: {c.details}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>
                      Doc: {c.matchedDocument || c.matched_document || 'Evidence File'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Unsupported Claims Section */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <HelpCircle size={22} color="#f59e0b" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
            Unsupported Claims Needing Document Proof ({unsupportedClaims.length})
          </h3>
        </div>

        {unsupportedClaims.length === 0 ? (
          <div style={{ color: '#10b981', fontSize: '0.85rem', padding: '8px 0' }}>
            ✓ All extracted claims have supporting documentation attached.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {unsupportedClaims.map(c => (
              <div key={c.id} style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '16px',
                borderRadius: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span className="badge badge-warning" style={{ marginBottom: '6px' }}>{c.category}</span>
                    <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>"{c.claimText || c.claim_text}"</div>
                    <div style={{ color: '#fbbf24', fontSize: '0.85rem', marginTop: '6px' }}>
                      💡 {c.details || 'Recommendation: Upload supporting document or certificates to substantiate this claim.'}
                    </div>
                  </div>
                  <button 
                    onClick={() => openUploadForClaim(c)} 
                    className="btn btn-sm btn-outline"
                    title={`Upload supporting evidence for: ${c.claimText || c.claim_text}`}
                  >
                    + Add Document
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Pending Claims (if any) */}
      {pendingClaims.length > 0 && (
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ShieldCheck size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Pending / Under Review Claims ({pendingClaims.length})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingClaims.map(c => (
              <div key={c.id} style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '12px 14px',
                borderRadius: '8px'
              }}>
                <span className="badge badge-neutral" style={{ marginBottom: '4px' }}>{c.category}</span>
                <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>"{c.claimText || c.claim_text}"</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>{c.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Supporting Credentials Attached Section (Strictly evidence documents, NEVER resumes) */}
      <div className="glass-card" style={{ padding: '28px', marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={20} color="#6366f1" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Supporting Credential Evidence Attached ({supportingEvidenceDocs.length})
            </h3>
          </div>
          <button onClick={() => navigateTo('upload')} className="btn btn-sm btn-outline">
            + Add Evidence
          </button>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '16px' }}>
          Corroborating credential documents provided by candidate to substantiate claims (resumes are sources of claims only).
        </p>

        {supportingEvidenceDocs.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '12px 0' }}>
            No external supporting credentials uploaded yet. Upload degrees, certificates, or experience letters to verify unsupported claims.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {supportingEvidenceDocs.map((doc, idx) => (
              <div key={doc.id || idx} style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <FileText size={18} color="#818cf8" style={{ flexShrink: 0 }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {doc.name || doc.original_name}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                    {doc.category} {doc.fileSize ? `• ${doc.fileSize}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
