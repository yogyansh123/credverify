import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  FileText, 
  ArrowRight, 
  RefreshCw, 
  Sparkles,
  ShieldCheck,
  Search,
  Filter,
  Info,
  Clock,
  ExternalLink,
  UploadCloud
} from 'lucide-react';

export const VerificationAnalysisPage = () => {
  const { 
    claims, 
    documents, 
    activeDocument, 
    analysisProgress, 
    isAnalyzing, 
    runVerificationAnalysis, 
    hasResume,
    isResumeDoc,
    currentResumeDoc,
    analysisMeta,
    openUploadForClaim,
    openDocumentFile,
    navigateTo 
  } = useApp();
  const [filter, setFilter] = useState('All'); // 'All', 'Match', 'Mismatch', 'Unsupported'

  // Primary resume reference
  const currentResume = hasResume 
    ? (currentResumeDoc || (isResumeDoc && isResumeDoc(activeDocument) ? activeDocument : (documents || []).find(d => isResumeDoc ? isResumeDoc(d) : false)) || null)
    : null;

  // Analysis has successfully completed for current resume ONLY when:
  // 1. hasResume is true and currentResume exists
  // 2. analysisMeta is present with a valid trustScore
  // 3. Claims have been evaluated
  const hasAnalysisRun = Boolean(
    hasResume && 
    currentResume && 
    analysisMeta && 
    analysisMeta.trustScore !== undefined && 
    analysisMeta.trustScore !== null
  );

  // Active document display name: strictly "No document uploaded" if no resume exists
  const docName = hasResume && currentResume 
    ? (currentResume.name || currentResume.original_name || 'Uploaded Resume') 
    : 'No document uploaded';

  // Display claims: only show claims if a resume exists AND analysis has run
  const displayClaims = hasAnalysisRun ? claims : [];

  const matchCount = displayClaims.filter(c => c.status === 'Match').length;
  const mismatchCount = displayClaims.filter(c => c.status === 'Mismatch').length;
  const unsupportedCount = displayClaims.filter(c => c.status === 'Unsupported').length;
  const pendingCount = displayClaims.filter(c => c.status === 'Pending').length;

  const filteredClaims = displayClaims.filter(c => {
    if (filter === 'All') return true;
    return c.status === filter;
  });

  // Display progress: 0 when no resume or before analysis, actual progress during analysis, 100 when completed
  const displayProgress = isAnalyzing 
    ? analysisProgress 
    : hasAnalysisRun 
    ? 100 
    : 0;

  const progressStatusText = isAnalyzing 
    ? `Analyzing ${docName} — local parsing in progress...` 
    : hasAnalysisRun 
    ? `Analysis Complete — ${displayClaims.length} Claims Evaluated` 
    : hasResume 
    ? `Ready for Analysis — 0 Claims Evaluated` 
    : `Upload a resume to start verification.`;

  const extractionBadge = analysisMeta?.extractionMethod === 'pypdf' 
    ? 'Local PDF Parser (pypdf)' 
    : analysisMeta?.extractionMethod === 'plain_text' 
    ? 'Local Text Parser' 
    : analysisMeta?.isFallback 
    ? 'Demo Fallback (Metadata)' 
    : 'Local Credential Engine';

  return (
    <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* HEADER & SCANNER BAR */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Cpu size={20} color="#818cf8" />
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                AI-Assisted Document Analysis
              </h1>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Active Document: <strong style={{ color: '#fff' }}>{docName}</strong>
              </span>
              {hasResume && hasAnalysisRun && analysisMeta?.candidateName && (
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  Candidate: {analysisMeta.candidateName}
                </span>
              )}
              {hasResume && hasAnalysisRun && (
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                  {extractionBadge}
                </span>
              )}
              {hasResume && currentResume?.category && (
                <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                  Category: {currentResume.category}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {hasResume ? (
              <button 
                id="rerun-analysis-scanner-btn"
                onClick={() => runVerificationAnalysis(currentResume)}
                className="btn btn-outline"
                disabled={isAnalyzing}
              >
                <RefreshCw size={16} className={isAnalyzing ? 'pulse-glow' : ''} /> {isAnalyzing ? 'Analyzing...' : hasAnalysisRun ? 'Rerun Analysis' : 'Run Analysis'}
              </button>
            ) : (
              <button 
                id="upload-resume-scanner-btn"
                onClick={() => navigateTo('upload')}
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <UploadCloud size={16} /> Upload a resume to start verification.
              </button>
            )}

            <button 
              onClick={() => navigateTo('report')}
              className="btn btn-primary"
              disabled={!hasResume || !hasAnalysisRun || isAnalyzing}
            >
              <FileText size={16} /> View Verification Report &rarr;
            </button>
          </div>
        </div>

        {/* Real-time Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
            <span style={{ color: '#818cf8', fontWeight: 600 }}>
              {progressStatusText}
            </span>
            <span style={{ color: '#fff', fontWeight: 700 }}>{displayProgress}% Progress</span>
          </div>

          <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${displayProgress}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #6366f1, #a855f7, #10b981)',
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            marginTop: '16px',
            fontSize: '0.75rem',
            color: '#64748b',
            textAlign: 'center'
          }}>
            <div style={{ color: displayProgress >= 25 ? '#818cf8' : '#64748b', fontWeight: 600 }}>1. Extract Document Text</div>
            <div style={{ color: displayProgress >= 50 ? '#818cf8' : '#64748b', fontWeight: 600 }}>2. Identify Credential Claims</div>
            <div style={{ color: displayProgress >= 75 ? '#818cf8' : '#64748b', fontWeight: 600 }}>3. Evaluate Discrepancies</div>
            <div style={{ color: displayProgress >= 100 ? '#10b981' : '#64748b', fontWeight: 600 }}>4. Compute Trust Metrics</div>
          </div>
        </div>

      </div>

      {/* Notice / Cautious Language Banner */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '10px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <Info size={18} color="#818cf8" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
          <strong>Verification Notice:</strong> Statuses reflect automated cross-referencing between stated claims and candidate-provided supporting documents. Items flagged as "potential mismatch" or "unsupported claim" require further verification before formal credential determination.
        </span>
      </div>

      {/* FILTER TABS & SUMMARY COUNTS */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px'
      }}>
        
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'All', label: `All Claims (${displayClaims.length})` },
            { id: 'Match', label: `Matches (${matchCount})` },
            { id: 'Mismatch', label: `Potential Mismatches (${mismatchCount})` },
            { id: 'Unsupported', label: `Unsupported (${unsupportedCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: filter === tab.id ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                background: filter === tab.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: filter === tab.id ? '#fff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Showing {filteredClaims.length} item{filteredClaims.length === 1 ? '' : 's'}
        </div>

      </div>

      {/* ITEMIZED CLAIMS OR EMPTY STATE */}
      {!hasResume ? (
        <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <UploadCloud size={28} color="#818cf8" />
          </div>
          <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
            No Document Uploaded
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '440px', margin: '0 auto 20px' }}>
            Upload a resume to start verification. CredVerify will automatically extract claims and cross-reference them against your credentials.
          </p>
          <button 
            id="empty-state-upload-resume-btn"
            onClick={() => navigateTo('upload')} 
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <UploadCloud size={16} /> Upload Resume
          </button>
        </div>
      ) : !hasAnalysisRun ? (
        <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <FileText size={28} color="#818cf8" />
          </div>
          <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
            Ready for Verification Analysis
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '460px', margin: '0 auto 20px' }}>
            Resume <strong>"{docName}"</strong> is uploaded. Click "Run Analysis" to extract claims, evaluate evidence, and compute trust metrics.
          </p>
          <button 
            id="empty-state-run-analysis-btn"
            onClick={() => runVerificationAnalysis(currentResume)} 
            className="btn btn-primary"
            disabled={isAnalyzing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Sparkles size={16} className={isAnalyzing ? 'pulse-glow' : ''} /> {isAnalyzing ? 'Analyzing...' : 'Run Analysis Now'}
          </button>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
          <p style={{ fontSize: '1rem', marginBottom: '8px' }}>No claims matching filter "{filter}".</p>
          <button onClick={() => setFilter('All')} className="btn btn-outline btn-sm">Show All Claims</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredClaims.map((item) => {
            const isMatch = item.status === 'Match';
            const isMismatch = item.status === 'Mismatch';
            const isUnsupported = item.status === 'Unsupported';
            const isPending = item.status === 'Pending';

            const rawMatchedDoc = item.matchedDocument || item.matched_document;
            const hasEvidence = Boolean(
              rawMatchedDoc && 
              rawMatchedDoc !== 'No supporting document uploaded' && 
              rawMatchedDoc !== 'Self-Reported in Resume'
            );
            const matchedDocName = hasEvidence ? rawMatchedDoc : 'No supporting document uploaded';

            return (
              <div 
                key={item.id} 
                className="glass-card"
                style={{
                  padding: '20px 24px',
                  borderColor: isMatch 
                    ? 'rgba(16, 185, 129, 0.3)' 
                    : isMismatch 
                    ? 'rgba(239, 68, 68, 0.4)' 
                    : isUnsupported 
                    ? 'rgba(245, 158, 11, 0.3)'
                    : 'rgba(99, 102, 241, 0.3)'
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                  alignItems: 'center'
                }}>
                  
                  {/* Left Side: Stated Resume Claim */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="badge badge-neutral">{item.category}</span>
                    </div>
                    <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                      "{item.claimText || item.claim_text}"
                    </h4>
                  </div>

                  {/* Right Side: Matched Document Evidence & Action */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Supporting Document Evidence
                      </span>
                      <span className={`badge ${
                        isMatch ? 'badge-success' : isMismatch ? 'badge-danger' : isUnsupported ? 'badge-warning' : 'badge-neutral'
                      }`}>
                        {isMatch && <CheckCircle2 size={12} />}
                        {isMismatch && <AlertTriangle size={12} />}
                        {isUnsupported && <HelpCircle size={12} />}
                        {isPending && <Clock size={12} />}
                        {item.status}
                      </span>
                    </div>

                    <div style={{
                      background: hasEvidence ? 'rgba(15, 23, 42, 0.8)' : 'rgba(15, 23, 42, 0.5)',
                      border: hasEvidence ? '1px solid rgba(255, 255, 255, 0.08)' : '1px dashed rgba(255, 255, 255, 0.12)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}>
                      <div 
                        onClick={hasEvidence ? () => openDocumentFile(item) : undefined}
                        className={hasEvidence ? "clickable-evidence-doc" : ""}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          overflow: 'hidden',
                          cursor: hasEvidence ? 'pointer' : 'default',
                          flex: 1,
                          padding: '4px 6px',
                          margin: '-4px -6px',
                          borderRadius: '6px'
                        }}
                        title={hasEvidence ? `Click to view ${matchedDocName} in a new browser tab` : undefined}
                      >
                        <FileText size={18} color={hasEvidence ? '#818cf8' : '#64748b'} style={{ flexShrink: 0 }} />
                        <span className="evidence-doc-name" style={{ 
                          color: hasEvidence ? '#fff' : '#94a3b8', 
                          fontSize: '0.85rem', 
                          fontWeight: hasEvidence ? 600 : 400,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {matchedDocName}
                        </span>
                        {hasEvidence && (
                          <ExternalLink size={13} color="#818cf8" style={{ flexShrink: 0, opacity: 0.8 }} />
                        )}
                      </div>

                      {isUnsupported && (
                        <button 
                          onClick={() => openUploadForClaim(item)}
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}
                          title={`Upload supporting document for: ${item.claimText || item.claim_text}`}
                        >
                          + Add Document
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
