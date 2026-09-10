import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  Sparkles, 
  GraduationCap, 
  Award, 
  Briefcase, 
  ShieldCheck,
  FilePlus,
  FileCheck,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';

export const DocumentUploadPage = () => {
  const { 
    documents, 
    addDocument, 
    addDocuments,
    detectDocumentCategory,
    removeDocument, 
    runVerificationAnalysis, 
    hasResume,
    hasAnalysisRun,
    isAnalyzing,
    isUploading,
    requestedClaim,
    setRequestedClaim,
    activeDocument,
    openDocumentFile,
    showToast
  } = useApp();

  // Determine initial category from requestedClaim if present
  const getCategoryForClaim = (claim) => {
    if (!claim) return null;
    const cat = (claim.category || '').toLowerCase();
    const text = (claim.claimText || claim.claim_text || '').toLowerCase();

    if (cat.includes('cert') || text.includes('cert') || text.includes('aws') || text.includes('azure') || text.includes('gcp') || text.includes('pmp') || text.includes('scrum')) {
      return 'Certifications';
    }
    if (cat.includes('edu') || text.includes('bachelor') || text.includes('master') || text.includes('degree') || text.includes('university') || text.includes('college')) {
      return 'Degree / Marksheet';
    }
    if (cat.includes('exp') || text.includes('intern') || text.includes('engineer') || text.includes('manager') || text.includes('developer')) {
      return 'Experience Letter';
    }
    if (cat.includes('pub') || cat.includes('skill') || text.includes('paper') || text.includes('ieee') || text.includes('patent')) {
      return 'Other Document';
    }
    return 'Certifications';
  };

  const [selectedCategory, setSelectedCategory] = useState(() => getCategoryForClaim(requestedClaim));
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // When requestedClaim changes, auto-select matching evidence category
  useEffect(() => {
    if (requestedClaim) {
      setSelectedCategory(getCategoryForClaim(requestedClaim));
    }
  }, [requestedClaim]);

  const categories = [
    { name: "Resume", icon: FileText },
    { name: "Degree / Marksheet", icon: GraduationCap },
    { name: "Certifications", icon: Award },
    { name: "Experience Letter", icon: Briefcase },
    { name: "Government ID", icon: ShieldCheck },
    { name: "Other Document", icon: FilePlus }
  ];

  // Helper to complete upload: preserves requestedClaim context
  const onUploadComplete = async (uploadedDoc) => {
    if (requestedClaim) {
      const claimText = requestedClaim.claimText || requestedClaim.claim_text || 'claim';
      showToast(`Evidence uploaded for "${claimText.slice(0, 35)}...". Ready to ${hasAnalysisRun ? 'rerun' : 'run'} analysis!`, 'success');
    }
  };

  const handleRealFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const filesArray = Array.from(files);
    e.target.value = '';

    if (filesArray.length === 1) {
      const file = filesArray[0];
      const detectedCat = detectDocumentCategory ? detectDocumentCategory(file.name, selectedCategory) : (selectedCategory || 'Other Document');
      const newDoc = {
        name: file.name,
        category: detectedCat,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: "Just now",
        status: "Pending",
        hash: `0x${Math.random().toString(16).substr(2, 12)}`,
        extractedClaims: 0
      };
      const added = await addDocument(newDoc, file);
      await onUploadComplete(added || newDoc);
    } else {
      const addedDocs = await addDocuments(filesArray, selectedCategory || 'Other Document');
      if (addedDocs && addedDocs.length > 0) {
        await onUploadComplete(addedDocs[0]);
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      if (filesArray.length === 1) {
        const file = filesArray[0];
        const detectedCat = detectDocumentCategory ? detectDocumentCategory(file.name, selectedCategory) : (selectedCategory || 'Other Document');
        const newDoc = {
          name: file.name,
          category: detectedCat,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploadedAt: "Just now",
          status: "Pending",
          hash: `0x${Math.random().toString(16).substr(2, 12)}`,
          extractedClaims: 0
        };
        const added = await addDocument(newDoc, file);
        await onUploadComplete(added || newDoc);
      } else {
        const addedDocs = await addDocuments(filesArray, selectedCategory || 'Other Document');
        if (addedDocs && addedDocs.length > 0) {
          await onUploadComplete(addedDocs[0]);
        }
      }
    }
  };

  // Robust local derivation of primary resume directly from current documents list or activeDocument
  const isResumeItem = (d) => {
    if (!d || typeof d !== 'object') return false;
    const docId = String(d.id || '');
    if (docId.startsWith('doc_') && !docId.includes('-')) return false;
    const cat = (d.category || '').toLowerCase().trim();
    const name = (d.name || d.original_name || '').toLowerCase().trim();
    if (cat === 'resume') return true;
    if (['government id', 'certifications', 'degree / marksheet', 'experience letter'].includes(cat)) return false;
    return name.includes('resume') || name.includes('cv');
  };

  const pageResumeDoc = (documents || []).find(isResumeItem) || (activeDocument && isResumeItem(activeDocument) ? activeDocument : null);
  const effectiveHasResume = Boolean(hasResume || pageResumeDoc);
  const effectiveHasAnalysisRun = Boolean(
    hasAnalysisRun || 
    (pageResumeDoc && (pageResumeDoc.status === 'Verified' || (pageResumeDoc.extractedClaims && pageResumeDoc.extractedClaims > 0)))
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* Targeted Claim Context Banner when opened via '+ Add Document' */}
      {requestedClaim && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              flexShrink: 0
            }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                  Requested Evidence
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  Claim Category: <strong style={{ color: '#fff' }}>{requestedClaim.category}</strong>
                </span>
              </div>
              <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>
                "{requestedClaim.claimText || requestedClaim.claim_text}"
              </div>
              <div style={{ color: '#a5b4fc', fontSize: '0.75rem', marginTop: '2px' }}>
                💡 Uploading evidence will automatically re-verify this claim and return you to the report.
              </div>
            </div>
          </div>
          <button
            onClick={() => setRequestedClaim(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Dismiss claim context"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }}>
          Upload Credential Evidence
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '6px' }}>
          Attach original PDFs or high-resolution images of your degrees, certificates, and work experience to verify your resume claims.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '30px'
      }}>
        
        {/* Left Column: Dropzone & Category Select */}
        <div>
          
          {/* Category Selector */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <label className="form-label" style={{ margin: 0, display: 'block' }}>
                1. Document Categories (Optional Filter)
              </label>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#818cf8',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: 500
                  }}
                >
                  Show All Types
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {categories.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(prev => prev === cat.name ? null : cat.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      color: isSelected ? '#fff' : '#94a3b8',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon size={18} color={isSelected ? '#818cf8' : '#64748b'} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drag & Drop Dropzone */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className="glass-card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              border: dragOver ? '2px dashed #6366f1' : '2px dashed rgba(255, 255, 255, 0.15)',
              background: dragOver ? 'rgba(99, 102, 241, 0.1)' : 'rgba(15, 23, 42, 0.5)',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isUploading ? 0.7 : 1
            }}
            onClick={() => {
              if (!isUploading && fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          >
            {/* Hidden native file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleRealFileSelect} 
              style={{ display: 'none' }} 
              accept=".pdf,.png,.jpg,.jpeg,.docx" 
              multiple
            />

            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              {isUploading ? (
                <Loader2 size={32} color="#818cf8" className="animate-spin" />
              ) : (
                <UploadCloud size={32} color="#818cf8" />
              )}
            </div>

            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
              {isUploading ? (
                <span>Registering documents on backend...</span>
              ) : selectedCategory ? (
                <>Upload <span style={{ color: '#818cf8' }}>{selectedCategory}</span> or mixed documents</>
              ) : (
                <>Drag & Drop files or Browse Multiple Documents</>
              )}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Supports multiple mixed files (PDF, PNG, JPG, DOCX). Categories are auto-detected!
            </p>

            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              disabled={isUploading}
              onClick={(e) => {
                e.stopPropagation();
                if (fileInputRef.current) fileInputRef.current.click();
              }}
            >
              {isUploading ? 'Registering...' : 'Browse Local Files'}
            </button>
          </div>

        </div>

        {/* Right Column: Active Uploaded Files List */}
        <div>
          
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                  Uploaded Credentials ({documents.length})
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {selectedCategory ? `Showing: ${selectedCategory}` : 'Ready for AI Optical Extraction'}
                </span>
              </div>
              <span className="badge badge-success">
                <FileCheck size={12} /> {documents.length} Files Attached
              </span>
            </div>

            {documents.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
                No documents uploaded yet. Browse or drag & drop your resume, certificates, degrees, or experience letters.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                {(selectedCategory ? documents.filter(d => d.category === selectedCategory) : documents).map((doc) => (
                  <div key={doc.id} style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                      <div style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#818cf8',
                        flexShrink: 0
                      }}>
                        <FileText size={20} />
                      </div>
                      <div 
                        onClick={() => openDocumentFile(doc)}
                        className="clickable-evidence-doc"
                        style={{ overflow: 'hidden', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px' }}
                        title={`Click to view ${doc.name} in a new browser tab`}
                      >
                        <div className="evidence-doc-name" style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc.name}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span 
                        className="badge" 
                        style={{ 
                          background: 'rgba(99, 102, 241, 0.15)', 
                          color: '#a5b4fc', 
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '4px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {doc.category || 'Other Document'}
                      </span>
                      <span className={`badge ${doc.status === 'Verified' ? 'badge-success' : doc.status === 'Mismatch' ? 'badge-danger' : doc.status === 'Unsupported' ? 'badge-neutral' : 'badge-warning'}`}>
                        {doc.status}
                      </span>
                      <button 
                        onClick={() => removeDocument(doc.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                        title="Delete file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Run Analysis CTA */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {effectiveHasResume ? (
                <button 
                  id={effectiveHasAnalysisRun ? "rerun-analysis-btn" : "run-analysis-btn"}
                  onClick={() => runVerificationAnalysis(pageResumeDoc || null, { returnToReport: true })}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={isAnalyzing}
                >
                  <Sparkles size={18} className={isAnalyzing ? 'pulse-glow' : ''} /> {isAnalyzing ? 'Analyzing...' : effectiveHasAnalysisRun ? 'Rerun Analysis →' : 'Run Analysis →'}
                </button>
              ) : (
                <button 
                  id="upload-resume-cta-btn"
                  onClick={() => {
                    setSelectedCategory('Resume');
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <UploadCloud size={18} /> Upload a resume to start verification.
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
