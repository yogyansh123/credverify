import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  currentUserMock, 
  categoryScoresMock, 
  uploadedDocumentsMock, 
  claimsAnalysisMock, 
  recruitersCandidatesMock,
  verificationActivityMock
} from '../data/mockData';
import { api } from '../services/api';

const AppContext = createContext();

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('credverify_user_profile');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};

const getStoredCategoryScores = () => {
  try {
    const raw = localStorage.getItem('credverify_category_scores');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};

const getStoredAnalysisMeta = () => {
  try {
    const raw = localStorage.getItem('credverify_analysis_meta');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};

const getStoredDocuments = () => {
  try {
    const userProfile = getStoredUser();
    if (!userProfile || !userProfile.id || userProfile.isDemo || userProfile.id === currentUserMock.id) {
      return [];
    }
    const raw = localStorage.getItem('credverify_documents');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(d => (d.userId || d.user_id) === userProfile.id);
      }
    }
  } catch (e) {}
  return [];
};

const getStoredClaims = () => {
  try {
    const userProfile = getStoredUser();
    if (!userProfile || !userProfile.id || userProfile.isDemo || userProfile.id === currentUserMock.id) {
      return [];
    }
    const raw = localStorage.getItem('credverify_claims');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(c => !c.user_id || c.user_id === userProfile.id);
      }
    }
  } catch (e) {}
  return [];
};

const getStoredActiveDoc = () => {
  try {
    const userProfile = getStoredUser();
    if (!userProfile || !userProfile.id || userProfile.isDemo || userProfile.id === currentUserMock.id) {
      return null;
    }
    const raw = localStorage.getItem('credverify_active_doc');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.userId === userProfile.id || parsed.user_id === userProfile.id)) {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
};

export const AppProvider = ({ children }) => {
  const initialStoredUser = getStoredUser();
  const [currentView, setCurrentView] = useState('landing'); // landing, auth, dashboard, upload, analysis, report, public-profile, recruiter
  const [authRole, setAuthRole] = useState(initialStoredUser?.role || 'individual'); // 'individual' or 'recruiter'
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialStoredUser));
  const [user, setUser] = useState(initialStoredUser || currentUserMock);
  const [documents, setDocuments] = useState(getStoredDocuments);
  const [claims, setClaims] = useState(getStoredClaims);
  const [credentials, setCredentials] = useState([]);
  const [candidates, setCandidates] = useState(recruitersCandidatesMock);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activities, setActivities] = useState([]);
  
  const [activeDocument, setActiveDocument] = useState(getStoredActiveDoc);
  const [categoryScores, setCategoryScores] = useState(getStoredCategoryScores() || []);
  const [analysisMeta, setAnalysisMeta] = useState(getStoredAnalysisMeta);

  // Context for claim-targeted evidence upload
  const [requestedClaim, setRequestedClaim] = useState(null);
  // Context for highlighting specific claim in report (e.g. from dashboard mismatch alert)
  const [highlightedClaimId, setHighlightedClaimId] = useState(null);

  // Backend connectivity state
  const [backendStatus, setBackendStatus] = useState('connecting'); // 'connecting' | 'connected' | 'offline'
  const [backendHealth, setBackendHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Analysis running state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Helper to format backend document into frontend format
  const formatBackendDoc = (bDoc) => ({
    id: bDoc.id,
    userId: bDoc.user_id,
    name: bDoc.original_name,
    category: bDoc.category,
    fileSize: `${((bDoc.file_size_bytes || 1024 * 1024) / (1024 * 1024)).toFixed(1)} MB`,
    uploadedAt: bDoc.uploaded_at ? new Date(bDoc.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
    status: bDoc.status || 'Pending',
    hash: `0x${bDoc.id.replace(/-/g, '').slice(0, 12)}`,
    extractedClaims: bDoc.extracted_claims_count ?? 0
  });

  // Canonical helper to determine if a document is a Resume
  // Real backend documents only; excludes mock/demo docs and explicit non-resume categories (e.g. Government ID, Certifications)
  const isResumeDoc = useCallback((d) => {
    if (!d || typeof d !== 'object') return false;
    const docId = String(d.id || '');
    // Ignore mock demo documents from mockData.js (e.g. 'doc_1', 'doc_2')
    if (docId.startsWith('doc_') && !docId.includes('-')) return false;

    const cat = (d.category || '').toLowerCase().trim();
    const name = (d.name || d.original_name || '').toLowerCase().trim();

    if (cat === 'resume') return true;

    const nonResumeCategories = [
      'government id',
      'certifications',
      'degree / marksheet',
      'experience letter'
    ];
    if (nonResumeCategories.includes(cat)) {
      return false;
    }

    return name.includes('resume') || name.includes('cv');
  }, []);

  // Compute active user's primary Resume document from current backend documents
  const currentResumeDoc = useMemo(() => {
    const docFromList = (documents || []).find(d => isResumeDoc(d));
    if (docFromList) return docFromList;
    if (activeDocument && isResumeDoc(activeDocument)) return activeDocument;
    return null;
  }, [documents, activeDocument, isResumeDoc]);

  const hasResume = Boolean(currentResumeDoc);

  // Canonical helper to determine if the CURRENT active resume has already been successfully analyzed
  const hasAnalysisRun = useMemo(() => {
    if (!hasResume || !currentResumeDoc) return false;

    // 1. If analysisMeta exists, verify it matches the current active resume
    if (analysisMeta && analysisMeta.trustScore !== undefined && analysisMeta.trustScore !== null) {
      if (analysisMeta.analyzedDocId) {
        if (analysisMeta.analyzedDocId === currentResumeDoc.id) return true;
      } else {
        return true;
      }
    }

    // 2. If backend document state confirms it has been analyzed (status is Verified or claims were extracted)
    if (
      currentResumeDoc.status === 'Verified' ||
      (currentResumeDoc.extractedClaims !== undefined && currentResumeDoc.extractedClaims > 0)
    ) {
      return true;
    }

    // 3. If claims exist for the active user/resume
    if (claims && claims.length > 0) {
      return true;
    }

    return false;
  }, [hasResume, currentResumeDoc, analysisMeta, claims]);

  // Automatically persist documents, claims, and activeDocument to localStorage
  useEffect(() => {
    if (Array.isArray(documents)) {
      try {
        localStorage.setItem('credverify_documents', JSON.stringify(documents));
      } catch (e) {}
    }
  }, [documents]);

  useEffect(() => {
    if (Array.isArray(claims)) {
      try {
        localStorage.setItem('credverify_claims', JSON.stringify(claims));
      } catch (e) {}
    }
  }, [claims]);

  useEffect(() => {
    if (activeDocument) {
      try {
        localStorage.setItem('credverify_active_doc', JSON.stringify(activeDocument));
      } catch (e) {}
    }
  }, [activeDocument]);

  // Helper to sync user records (documents, claims, credentials) from backend
  const syncUserBackendData = async (backendUserId) => {
    if (!backendUserId) return;
    try {
      // 1. Documents: For real user, replace documents list with backend documents only
      const backendDocs = await api.getUserDocuments(backendUserId);
      let resumeDoc = null;
      if (Array.isArray(backendDocs)) {
        const formatted = backendDocs.map(formatBackendDoc);
        setDocuments(formatted);
        try { localStorage.setItem('credverify_documents', JSON.stringify(formatted)); } catch (e) {}
        resumeDoc = formatted.find(isResumeDoc) || null;
        setActiveDocument(resumeDoc);
        if (resumeDoc) {
          try { localStorage.setItem('credverify_active_doc', JSON.stringify(resumeDoc)); } catch (e) {}
        } else {
          try { localStorage.removeItem('credverify_active_doc'); } catch (e) {}
        }

        if (!resumeDoc) {
          setClaims([]);
          setCategoryScores([]);
          setAnalysisMeta(null);
          setAnalysisProgress(0);
          setUser(prev => {
            const updated = {
              ...prev,
              trustScore: null,
              verifiedCount: 0,
              flaggedCount: 0,
              unsupportedCount: 0
            };
            try { localStorage.setItem('credverify_user_profile', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
          try {
            localStorage.removeItem('credverify_claims');
            localStorage.removeItem('credverify_active_doc');
            localStorage.removeItem('credverify_analysis_meta');
            localStorage.removeItem('credverify_category_scores');
          } catch (e) {}
        } else if (resumeDoc.extractedClaims === 0 && (resumeDoc.status === 'Pending' || !resumeDoc.status)) {
          // Current resume in backend has never been analyzed
          setClaims([]);
          setCategoryScores([]);
          setAnalysisMeta(null);
          setAnalysisProgress(0);
          setUser(prev => {
            const updated = {
              ...prev,
              trustScore: null,
              verifiedCount: 0,
              flaggedCount: 0,
              unsupportedCount: 0
            };
            try { localStorage.setItem('credverify_user_profile', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
          try {
            localStorage.removeItem('credverify_claims');
            localStorage.removeItem('credverify_analysis_meta');
            localStorage.removeItem('credverify_category_scores');
          } catch (e) {}
        }
      }

      // 2. Claims: For real user, replace claims list with backend claims ONLY if an analyzed resume exists
      if (resumeDoc && (resumeDoc.extractedClaims > 0 || resumeDoc.status === 'Verified')) {
        const backendClaims = await api.getUserClaims(backendUserId);
        if (Array.isArray(backendClaims)) {
          const formattedClaims = backendClaims.map(c => ({
            id: c.id,
            user_id: c.user_id,
            userId: c.user_id,
            category: c.category,
            claimText: c.claim_text || c.claimText,
            claim_text: c.claim_text || c.claimText,
            status: c.status,
            confidence_pct: c.confidence_pct,
            confidence: c.confidence || (c.confidence_pct != null ? `${c.confidence_pct}%` : 'N/A'),
            matchedDocument: c.matched_document || c.matchedDocument || (c.status === 'Match' ? 'Supporting Document' : 'No supporting document uploaded'),
            matched_document: c.matched_document || c.matchedDocument || (c.status === 'Match' ? 'Supporting Document' : 'No supporting document uploaded'),
            matched_document_id: c.matched_document_id || c.matchedDocumentId || null,
            details: c.details,
            source_document_id: c.source_document_id
          }));
          setClaims(formattedClaims);
          try { localStorage.setItem('credverify_claims', JSON.stringify(formattedClaims)); } catch (e) {}

          const vCount = formattedClaims.filter(c => c.status === 'Match').length;
          const fCount = formattedClaims.filter(c => c.status === 'Mismatch').length;
          const uCount = formattedClaims.filter(c => c.status === 'Unsupported').length;
          setUser(prev => {
            const updated = {
              ...prev,
              verifiedCount: vCount,
              flaggedCount: fCount,
              unsupportedCount: uCount,
            };
            try { localStorage.setItem('credverify_user_profile', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
        }
      } else {
        setClaims([]);
        try { localStorage.removeItem('credverify_claims'); } catch (e) {}
      }

      // 3. Credentials
      const backendCreds = await api.getUserCredentials(backendUserId);
      if (Array.isArray(backendCreds)) {
        setCredentials(backendCreds);
      }
    } catch (err) {
      console.warn('Could not sync user backend data:', err);
      if (String(err?.message || '').includes('404') || String(err?.message || '').toLowerCase().includes('not found')) {
        try {
          localStorage.removeItem('credverify_user_profile');
          localStorage.removeItem('credverify_documents');
          localStorage.removeItem('credverify_claims');
          localStorage.removeItem('credverify_active_doc');
          localStorage.removeItem('credverify_category_scores');
          localStorage.removeItem('credverify_analysis_meta');
        } catch (e) {}
        setUser(currentUserMock);
        setDocuments([]);
        setClaims([]);
        setActiveDocument(null);
      }
    }
  };

  // Initialize and check backend health on mount
  const checkHealth = useCallback(async () => {
    try {
      setBackendStatus('connecting');
      const health = await api.getHealth();
      setBackendHealth(health);
      setBackendStatus('connected');

      // Sync active user profile with backend - DO NOT overwrite active real user with currentUserMock!
      try {
        const stored = getStoredUser();
        const storedDocs = getStoredDocuments();
        let targetUserId = (stored && !stored.isDemo && stored.id) || null;
        let targetEmail = (stored && !stored.isDemo && stored.email) || null;

        if (!targetUserId && Array.isArray(storedDocs) && storedDocs.length > 0) {
          const docWithUser = storedDocs.find(d => d.userId || d.user_id);
          if (docWithUser) {
            targetUserId = docWithUser.userId || docWithUser.user_id;
          }
        }

        if (targetUserId || targetEmail) {
          try {
            let backendUser = null;
            if (targetUserId) {
              try { backendUser = await api.getUser(targetUserId); } catch (e) {}
            }
            if (!backendUser && targetEmail) {
              try { backendUser = await api.getUserByEmail(targetEmail); } catch (e) {}
            }
            if (backendUser) {
              const updated = {
                ...(stored || {}),
                id: backendUser.id,
                name: backendUser.name,
                email: backendUser.email,
                role: backendUser.role,
                headline: backendUser.headline || stored?.headline || 'Verified Professional',
                summary: backendUser.summary || stored?.summary || '',
                avatarUrl: backendUser.avatar_url || stored?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                isDemo: false
              };
              setUser(updated);
              try { localStorage.setItem('credverify_user_profile', JSON.stringify(updated)); } catch (e) {}
              await syncUserBackendData(backendUser.id);
              return;
            } else {
              // Stored user ID or email does not exist on the backend!
              // Strictly purge all stale local data to prevent restoring phantom documents/claims
              console.warn('Stored user session does not exist on backend. Purging stale local data:', targetUserId);
              try {
                localStorage.removeItem('credverify_user_profile');
                localStorage.removeItem('credverify_documents');
                localStorage.removeItem('credverify_claims');
                localStorage.removeItem('credverify_active_doc');
                localStorage.removeItem('credverify_category_scores');
                localStorage.removeItem('credverify_analysis_meta');
              } catch (e) {}
              setUser(currentUserMock);
              setDocuments([]);
              setClaims([]);
              setActiveDocument(null);
              setCategoryScores([]);
              setAnalysisMeta(null);
              return;
            }
          } catch (fetchErr) {
            console.warn('Could not sync active stored user from backend:', fetchErr);
          }
        }
        // If there is no stored user, do NOT seed currentUserMock onto the backend or overwrite user!
        // We keep mockData purely for offline/demo fallback in memory.
      } catch (userErr) {
        console.warn('Backend user synchronization notice:', userErr);
      }
    } catch (err) {
      console.warn('FastAPI backend is offline or unreachable:', err);
      setBackendStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const formatMismatchReason = (claim) => {
    if (!claim) return 'Mismatch detected — view report for details';
    const rawDetails = claim.details || claim.mismatchReason || claim.mismatch_reason || '';
    if (!rawDetails) return 'Mismatch detected — view report for details';

    const lower = rawDetails.toLowerCase();
    if (lower.includes('date') || lower.includes('tenure') || lower.includes('period') || lower.includes('year') || lower.includes('month')) {
      return 'Employment dates do not match';
    }
    if (lower.includes('employer') || lower.includes('company') || lower.includes('organization') || lower.includes('entity')) {
      return 'Employer name or entity discrepancy';
    }
    if (lower.includes('role') || lower.includes('title') || lower.includes('position')) {
      return 'Job title or role discrepancy';
    }
    if (lower.includes('issuer') || lower.includes('registry') || lower.includes('credential id')) {
      return 'Credential issuer registry discrepancy';
    }
    const firstSentence = rawDetails.split('.')[0].replace(/^potential mismatch:\s*/i, '').replace(/^warning:\s*/i, '').trim();
    if (firstSentence && firstSentence.length > 5 && firstSentence.length < 70) {
      return firstSentence;
    }
    return 'Mismatch detected — view report for details';
  };

  const navigateTo = (view, candidateId = null, options = {}) => {
    if (candidateId) {
      const cand = candidates.find(c => c.id === candidateId || c.publicId === candidateId);
      if (cand) setSelectedCandidate(cand);
    }
    if (options && options.highlightClaimId) {
      setHighlightedClaimId(options.highlightClaimId);
    } else if (view !== 'report') {
      setHighlightedClaimId(null);
    }
    // If navigating directly via regular navbar/links (not for a specific claim), reset requestedClaim
    if (view !== 'upload') {
      setRequestedClaim(null);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic Activity Feed synchronized with actual claims and documents
  const dynamicActivities = useMemo(() => {
    // If no documents exist for current user, activity feed is strictly empty
    if (!documents || documents.length === 0) {
      return [];
    }

    const isRealUser = Boolean(user && !user.isDemo && user.id && user.id !== currentUserMock.id);

    const acts = [];
    const mismatchClaims = (claims || []).filter(c => (c.status || '').toLowerCase() === 'mismatch');

    // 1. Mismatch alerts at the top
    mismatchClaims.forEach(mc => {
      acts.push({
        id: `mismatch_${mc.id}`,
        type: 'mismatch',
        claimId: mc.id,
        date: 'Recent',
        category: mc.category || 'Experience',
        action: `${mc.category || 'Experience'} Letter — Mismatch Alert`,
        claimText: mc.claim_text || mc.claimText,
        supportingDocument: mc.matched_document || mc.matchedDocument || 'Supporting Document',
        mismatchReason: formatMismatchReason(mc),
        status: 'Mismatch Alert'
      });
    });

    // 2. Supporting verified / uploaded credentials
    const nonResumeDocs = (documents || []).filter(d => {
      const c = (d.category || '').toLowerCase();
      const n = (d.name || d.original_name || '').toLowerCase();
      return c !== 'resume' && !n.includes('resume') && !n.includes('cv');
    });

    const mismatchDocNames = new Set(
      mismatchClaims.map(mc => (mc.matched_document || mc.matchedDocument || '').toLowerCase().trim())
    );

    nonResumeDocs.forEach(d => {
      const docNameNorm = (d.name || d.original_name || '').toLowerCase().trim();
      if (mismatchDocNames.has(docNameNorm)) {
        return; // Mismatch alert already shown for this document above
      }
      acts.push({
        id: `doc_ver_${d.id}`,
        type: d.status === 'Verified' ? 'verified' : (d.status === 'Mismatch' ? 'mismatch' : 'unsupported'),
        date: d.uploadedAt || 'Recent',
        action: `Uploaded ${d.category || 'Credential'}`,
        supportingDocument: d.name || d.original_name,
        status: d.status || 'Verified'
      });
    });

    // 3. Resume upload / analysis activity
    const resumeDoc = (documents || []).find(d => {
      const c = (d.category || '').toLowerCase();
      const n = (d.name || d.original_name || '').toLowerCase();
      return c === 'resume' || n.includes('resume') || n.includes('cv');
    });

    if (resumeDoc) {
      if (analysisMeta) {
        acts.push({
          id: `resume_act_${resumeDoc.id}`,
          type: 'completed',
          date: resumeDoc.uploadedAt || 'Recent',
          action: 'Resume Verification Analysis',
          supportingDocument: resumeDoc.name || resumeDoc.original_name,
          status: 'Completed'
        });
      }
      acts.push({
        id: `resume_upload_${resumeDoc.id}`,
        type: 'document',
        date: resumeDoc.uploadedAt || 'Recent',
        action: 'Uploaded Resume',
        supportingDocument: resumeDoc.name || resumeDoc.original_name,
        status: analysisMeta ? 'Verified' : 'Pending'
      });
    }

    if (acts.length === 0) {
      if (isRealUser || !user?.isDemo) {
        return [];
      }
      return verificationActivityMock;
    }
    return acts;
  }, [claims, documents, user?.isDemo, user?.id, analysisMeta]);

  const openUploadForClaim = (claim) => {
    setRequestedClaim(claim);
    setCurrentView('upload');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDocumentFile = (docOrClaim) => {
    if (!docOrClaim) return;
    let docId = docOrClaim.matched_document_id || docOrClaim.matchedDocumentId || docOrClaim.id;
    if (!docId) {
      const docName = docOrClaim.matched_document || docOrClaim.matchedDocument || docOrClaim.name || docOrClaim.original_name;
      if (docName && docName !== 'No supporting document uploaded' && docName !== 'Self-Reported in Resume') {
        const found = documents.find(d => d.name === docName || d.original_name === docName || d.stored_name === docName);
        if (found) docId = found.id;
      }
    }
    if (!docId) {
      showToast('No backend document file available to view.', 'warning');
      return;
    }
    const effectiveUserId = user?.id || '';
    const fileUrl = api.getDocumentFileUrl(docId, effectiveUserId);
    if (fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLogin = async (role = 'individual', email = '', name = '') => {
    setIsLoading(true);
    const targetEmail = email.trim();
    const targetName = name.trim();

    if (backendStatus === 'connected' && targetEmail) {
      try {
        let profile = null;
        try {
          profile = await api.getUserByEmail(targetEmail);
        } catch (err) {
          if (err.status === 404) {
            profile = await api.createUser({
              name: targetName || (role === 'recruiter' ? 'Recruiting Team' : 'Verified Candidate'),
              email: targetEmail,
              role: role,
              headline: role === 'recruiter' ? 'Talent Acquisition Lead' : 'Software Professional'
            });
          } else {
            throw err;
          }
        }

        if (profile) {
          const realUser = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            headline: profile.headline || (role === 'recruiter' ? 'Talent Acquisition Lead' : 'Software Professional'),
            summary: profile.summary || '',
            avatarUrl: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
            trustScore: 0,
            verifiedCount: 0,
            flaggedCount: 0,
            unsupportedCount: 0,
            verificationDate: 'Today',
            isDemo: false
          };
          setUser(realUser);
          try {
            localStorage.setItem('credverify_user_profile', JSON.stringify(realUser));
          } catch (e) {}
          setDocuments([]);
          setClaims([]);
          setCategoryScores([]);
          setAnalysisMeta(null);
          try {
            localStorage.removeItem('credverify_category_scores');
            localStorage.removeItem('credverify_analysis_meta');
          } catch (e) {}
          setActiveDocument(null);
          await syncUserBackendData(profile.id);
        }
      } catch (err) {
        console.warn('Login backend error:', err);
      }
    } else if (targetEmail) {
      const localUser = {
        name: targetName || 'Candidate',
        email: targetEmail,
        role: role,
        trustScore: 0,
        isDemo: false
      };
      setUser(localUser);
      try {
        localStorage.setItem('credverify_user_profile', JSON.stringify(localUser));
        localStorage.removeItem('credverify_category_scores');
        localStorage.removeItem('credverify_analysis_meta');
      } catch (e) {}
      setDocuments([]);
      setClaims([]);
      setCategoryScores([]);
      setAnalysisMeta(null);
    }

    setAuthRole(role);
    setIsLoggedIn(true);
    setIsLoading(false);
    showToast(`Signed in as ${role === 'recruiter' ? 'Recruiter' : 'Candidate'}!`, 'success');
    setCurrentView(role === 'recruiter' ? 'recruiter' : 'dashboard');
  };

  const handleSignUp = async ({ name, email, role }) => {
    setIsLoading(true);
    try {
      const targetName = name.trim() || 'Candidate';
      const targetEmail = email.trim();
      if (backendStatus === 'connected') {
        const profile = await api.createUser({
          name: targetName,
          email: targetEmail,
          role: role,
          headline: role === 'recruiter' ? 'Technical Recruiter' : 'Professional'
        });

        const realUser = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          headline: profile.headline || 'Profile Created',
          avatarUrl: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
          trustScore: 0,
          verifiedCount: 0,
          flaggedCount: 0,
          unsupportedCount: 0,
          verificationDate: 'Today',
          isDemo: false
        };
        setUser(realUser);
        try {
          localStorage.setItem('credverify_user_profile', JSON.stringify(realUser));
        } catch (e) {}
        setDocuments([]);
        setClaims([]);
        setCategoryScores([]);
        setAnalysisMeta(null);
        try {
          localStorage.removeItem('credverify_category_scores');
          localStorage.removeItem('credverify_analysis_meta');
        } catch (e) {}
        setActiveDocument(null);
        showToast('Account registered successfully on CredVerify Backend!', 'success');
      } else {
        const localUser = {
          name: targetName,
          email: targetEmail,
          role: role,
          trustScore: 0,
          isDemo: false
        };
        setUser(localUser);
        try {
          localStorage.setItem('credverify_user_profile', JSON.stringify(localUser));
          localStorage.removeItem('credverify_category_scores');
          localStorage.removeItem('credverify_analysis_meta');
        } catch (e) {}
        setDocuments([]);
        setClaims([]);
        setCategoryScores([]);
        setAnalysisMeta(null);
        showToast('Account registered locally (Backend offline).', 'info');
      }

      setAuthRole(role);
      setIsLoggedIn(true);
      setCurrentView(role === 'recruiter' ? 'recruiter' : 'dashboard');
    } catch (err) {
      showToast(err.message || 'Registration error. Please check your inputs.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('credverify_user_profile');
      localStorage.removeItem('credverify_documents');
      localStorage.removeItem('credverify_claims');
      localStorage.removeItem('credverify_active_doc');
      localStorage.removeItem('credverify_category_scores');
      localStorage.removeItem('credverify_analysis_meta');
    } catch (e) {}
    setUser(currentUserMock);
    setDocuments(uploadedDocumentsMock);
    setClaims(claimsAnalysisMock);
    setActiveDocument(uploadedDocumentsMock[0] || null);
    setCategoryScores(categoryScoresMock);
    setAnalysisMeta(null);
    setIsLoggedIn(false);
    showToast('Logged out of session.', 'info');
    setCurrentView('landing');
  };

  // Client-side category detection matching standard CredVerify document categories
  const detectDocumentCategory = (filename, fallbackCategory = 'Other Document') => {
    const fn = (filename || '').toLowerCase();
    if (/resume|cv|curriculum|biodata|bio_data/i.test(fn)) return 'Resume';
    if (/aws|azure|gcp|cert|completion|badge|license|coursera|udemy|credly|pmp|cissp|comptia|scrum/i.test(fn)) return 'Certifications';
    if (/degree|transcript|marksheet|diploma|graduation|btech|b\.tech|mtech|m\.tech|bachelor|master|semester|sem_|gradecard|grade_sheet|convocation|university/i.test(fn)) return 'Degree / Marksheet';
    if (/xornor|experience|internship|intern|trainee|relieving|offer|service_letter|service_cert|employment|recommendation|training/i.test(fn)) return 'Experience Letter';
    if (/passport|national_id|aadhaar|aadhar|pan|driving|license|voter|gov_id|identity/i.test(fn)) return 'Government ID';
    if (/paper|publication|patent|journal|ieee/i.test(fn)) return 'Other Document';
    return fallbackCategory || 'Other Document';
  };

  // Upload/Register Document (real backend integration with fallback)
  const addDocument = async (newDoc, rawFile = null, options = {}) => {
    const { skipGlobalRefresh = false, skipToast = false } = options;
    setIsUploading(true);
    try {
      // Check if user is already saved in localStorage
      let activeUser = user;
      try {
        const stored = localStorage.getItem('credverify_user_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id && !parsed.isDemo) {
            activeUser = parsed;
          }
        }
      } catch (e) {}

      let isMockOrDemo = !activeUser?.id || activeUser.id === currentUserMock.id || activeUser.email === currentUserMock.email || activeUser.isDemo;

      // Prevent duplicates in frontend state
      const existingDoc = documents.find(d => 
        (d.name === (rawFile?.name || newDoc.name) || d.original_name === (rawFile?.name || newDoc.name)) &&
        (rawFile ? Math.abs((d.file_size_bytes || 0) - rawFile.size) < 100 : true)
      );
      if (existingDoc) {
        if (!skipToast) {
          showToast(`Document already uploaded: ${newDoc.name}`, 'info');
        }
        setIsUploading(false);
        return existingDoc;
      }

      if (backendStatus === 'connected') {
        // If active user is supposedly real, verify it actually exists on the backend
        if (!isMockOrDemo && activeUser?.id) {
          try {
            const verified = await api.getUser(activeUser.id);
            if (!verified || !verified.id) {
              isMockOrDemo = true;
            }
          } catch (e) {
            isMockOrDemo = true;
          }
        }

        if (isMockOrDemo) {
          // Auto-provision an isolated real backend user session
          const rawDocName = (rawFile?.name || newDoc.name || '').replace(/\.[^/.]+$/, '').replace(/[_.-]+/g, ' ').trim();
          const cleanInitialName = rawDocName.replace(/\b(resume|cv|updated|final|doc|v\d+)\b/gi, '').trim() || 'Candidate';
          const randomSuffix = Math.floor(Math.random() * 10000);
          const autoEmail = `candidate_${Date.now()}_${randomSuffix}@credverify.local`;

          try {
            const created = await api.createUser({
              name: cleanInitialName,
              email: autoEmail,
              role: 'individual',
              headline: 'Verified Professional'
            });

            activeUser = {
              id: created.id,
              name: created.name,
              email: created.email,
              role: created.role,
              headline: created.headline || 'Verified Professional',
              summary: '',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
              trustScore: null,
              verifiedCount: 0,
              flaggedCount: 0,
              unsupportedCount: 0,
              verificationDate: 'Today',
              isDemo: false
            };
            setUser(activeUser);
            try {
              localStorage.setItem('credverify_user_profile', JSON.stringify(activeUser));
              localStorage.removeItem('credverify_documents');
              localStorage.removeItem('credverify_claims');
              localStorage.removeItem('credverify_active_doc');
              localStorage.removeItem('credverify_category_scores');
              localStorage.removeItem('credverify_analysis_meta');
            } catch (e) {}
            // Crucial: clear stale data for the fresh user session
            setDocuments([]);
            setClaims([]);
            setCategoryScores([]);
            setAnalysisMeta(null);
          } catch (createErr) {
            console.warn('Could not auto-create isolated user for upload:', createErr);
          }
        }

        let backendResult = null;
        if (rawFile) {
          // Real multipart file upload to backend with isolated user.id and auto-detected category
          const categoryToSend = newDoc.category || detectDocumentCategory(rawFile.name);
          try {
            backendResult = await api.uploadDocument(rawFile, activeUser.id, categoryToSend);
          } catch (uploadErr) {
            // If user ID was invalid or not found, auto-provision a fresh user and retry once
            const errMsg = String(uploadErr?.message || '').toLowerCase();
            if (errMsg.includes('not found') || errMsg.includes('404') || errMsg.includes('user')) {
              console.warn('User ID rejected on upload; reprovisioning fresh backend user:', activeUser.id);
              const rawDocName = (rawFile.name || '').replace(/\.[^/.]+$/, '').replace(/[_.-]+/g, ' ').trim();
              const cleanName = rawDocName.replace(/\b(resume|cv|updated|final|doc|v\d+)\b/gi, '').trim() || 'Candidate';
              const autoEmail = `candidate_${Date.now()}_${Math.floor(Math.random() * 10000)}@credverify.local`;
              const fresh = await api.createUser({
                name: cleanName,
                email: autoEmail,
                role: 'individual',
                headline: 'Verified Professional'
              });
              activeUser = {
                id: fresh.id,
                name: fresh.name,
                email: fresh.email,
                role: fresh.role,
                headline: fresh.headline || 'Verified Professional',
                summary: '',
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                trustScore: null,
                verifiedCount: 0,
                flaggedCount: 0,
                unsupportedCount: 0,
                verificationDate: 'Today',
                isDemo: false
              };
              setUser(activeUser);
              try {
                localStorage.setItem('credverify_user_profile', JSON.stringify(activeUser));
                localStorage.removeItem('credverify_documents');
                localStorage.removeItem('credverify_claims');
                localStorage.removeItem('credverify_active_doc');
                localStorage.removeItem('credverify_category_scores');
                localStorage.removeItem('credverify_analysis_meta');
              } catch (e) {}
              setDocuments([]);
              setClaims([]);
              setCategoryScores([]);
              setAnalysisMeta(null);
              backendResult = await api.uploadDocument(rawFile, fresh.id, categoryToSend);
            } else {
              throw uploadErr;
            }
          }
        } else if (activeUser?.isDemo) {
          // Metadata registration for demo/mock mode only
          const sizeBytes = Math.round(parseFloat(newDoc.fileSize || '1.5') * 1024 * 1024);
          backendResult = await api.createDocument({
            user_id: activeUser.id,
            original_name: newDoc.name,
            category: newDoc.category,
            file_size_bytes: sizeBytes,
            mime_type: 'application/pdf'
          });
        } else {
          // Real user session without real file -> do not invent dummy records!
          setIsUploading(false);
          return null;
        }

        const formatted = formatBackendDoc(backendResult);

        // Refresh user documents from backend if not skipping
        if (!skipGlobalRefresh && activeUser?.id) {
          try {
            const freshDocs = await api.getUserDocuments(activeUser.id);
            if (Array.isArray(freshDocs)) {
              const formattedList = freshDocs.map(formatBackendDoc);
              setDocuments(formattedList);
              try {
                localStorage.setItem('credverify_documents', JSON.stringify(formattedList));
              } catch (e) {}

              if (isResumeDoc(formatted)) {
                setActiveDocument(formatted);
                try {
                  localStorage.setItem('credverify_active_doc', JSON.stringify(formatted));
                } catch (e) {}
                // Fresh unanalyzed resume: reset analysis state
                setClaims([]);
                setCategoryScores([]);
                setAnalysisMeta(null);
                setAnalysisProgress(0);
                setUser(prev => {
                  const updated = {
                    ...prev,
                    trustScore: null,
                    verifiedCount: 0,
                    flaggedCount: 0,
                    unsupportedCount: 0
                  };
                  try { localStorage.setItem('credverify_user_profile', JSON.stringify(updated)); } catch (e) {}
                  return updated;
                });
                try {
                  localStorage.removeItem('credverify_claims');
                  localStorage.removeItem('credverify_analysis_meta');
                  localStorage.removeItem('credverify_category_scores');
                } catch (e) {}
              } else {
                setActiveDocument(prev => (prev && isResumeDoc(prev)) ? prev : (formattedList.find(isResumeDoc) || null));
              }
              setIsUploading(false);
              if (!skipToast) {
                showToast(`Document uploaded & registered: ${newDoc.name}`, 'success');
              }
              return formatted;
            }
          } catch (fetchErr) {
            console.warn('Could not re-fetch user documents after upload:', fetchErr);
          }
        }

        setDocuments(prev => {
          const realDocs = prev.filter(d => !d.id.startsWith('doc_') || d.id.includes('-'));
          const next = [formatted, ...realDocs.filter(d => d.id !== formatted.id)];
          try {
            localStorage.setItem('credverify_documents', JSON.stringify(next));
          } catch (e) {}
          return next;
        });

        if (isResumeDoc(formatted)) {
          setActiveDocument(formatted);
          try {
            localStorage.setItem('credverify_active_doc', JSON.stringify(formatted));
          } catch (e) {}
          setClaims([]);
          setCategoryScores([]);
          setAnalysisMeta(null);
          setAnalysisProgress(0);
          setUser(prev => {
            const updated = {
              ...prev,
              trustScore: null,
              verifiedCount: 0,
              flaggedCount: 0,
              unsupportedCount: 0
            };
            try { localStorage.setItem('credverify_user_profile', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
          try {
            localStorage.removeItem('credverify_claims');
            localStorage.removeItem('credverify_analysis_meta');
            localStorage.removeItem('credverify_category_scores');
          } catch (e) {}
        } else {
          setActiveDocument(prev => (prev && isResumeDoc(prev)) ? prev : null);
        }

        setIsUploading(false);
        if (!skipToast) {
          showToast(`Document uploaded & registered: ${newDoc.name}`, 'success');
        }
        return formatted;
      } else {
        setDocuments(prev => {
          const next = [newDoc, ...prev];
          try {
            localStorage.setItem('credverify_documents', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
        if (isResumeDoc(newDoc)) {
          setActiveDocument(newDoc);
        } else {
          setActiveDocument(prev => (prev && isResumeDoc(prev)) ? prev : newDoc);
        }
        if (!skipToast) {
          showToast(`Attached ${newDoc.name} locally (Offline mode).`, 'success');
        }
        return newDoc;
      }
    } catch (err) {
      console.warn('Backend upload registration error:', err);
      setDocuments(prev => [newDoc, ...prev]);
      setActiveDocument(newDoc);
      if (!skipToast) {
        showToast(`Document attached: ${newDoc.name}`, 'info');
      }
      return newDoc;
    } finally {
      setIsUploading(false);
    }
  };

  // Multi-Document batch upload with automatic per-file classification
  const addDocuments = async (filesList, defaultCategory = 'Other Document') => {
    if (!filesList || filesList.length === 0) return [];
    setIsUploading(true);
    const uploadedDocs = [];
    try {
      const filesArray = Array.from(filesList);
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        const detectedCat = detectDocumentCategory(file.name, defaultCategory);
        const newDoc = {
          name: file.name,
          category: detectedCat,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploadedAt: 'Just now',
          status: 'Pending',
          hash: `0x${Math.random().toString(16).substr(2, 12)}`,
          extractedClaims: 0
        };
        const isLast = i === filesArray.length - 1;
        const res = await addDocument(newDoc, file, { 
          skipGlobalRefresh: !isLast, 
          skipToast: filesArray.length > 1 
        });
        if (res) uploadedDocs.push(res);
      }
      if (filesArray.length > 1) {
        showToast(`Uploaded ${uploadedDocs.length} document(s) with automatic category detection.`, 'success');
      }
      return uploadedDocs;
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = async (docId) => {
    const targetDoc = documents.find(d => d.id === docId);

    // Identify if it's a real backend document (standard UUID or non-mock doc)
    const isBackendDoc = Boolean(
      docId && 
      typeof docId === 'string' && 
      !docId.startsWith('doc_') && 
      (docId.includes('-') || docId.length > 20)
    );

    const effectiveUserId = targetDoc?.userId || user?.id || getStoredUser()?.id;

    // Helper to immediately and completely purge the deleted document from all state & storage
    const purgeDocumentFromStateAndStorage = (deletedId) => {
      setDocuments(prev => {
        const nextDocs = prev.filter(d => d.id !== deletedId);
        try {
          localStorage.setItem('credverify_documents', JSON.stringify(nextDocs));
        } catch (e) {}

        const remainingResume = nextDocs.find(isResumeDoc) || null;
        setActiveDocument(remainingResume);

        if (!remainingResume) {
          // If deleted document was the resume (or no resume remains):
          // Immediately reset all analysis/claims/scores state
          setClaims([]);
          setCategoryScores([]);
          setAnalysisProgress(0);
          setAnalysisMeta(null);
          setUser(u => {
            const updated = {
              ...u,
              trustScore: null,
              verifiedCount: 0,
              flaggedCount: 0,
              unsupportedCount: 0,
              verificationDate: 'Today'
            };
            try { localStorage.setItem('credverify_user_profile', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
          try {
            localStorage.removeItem('credverify_claims');
            localStorage.removeItem('credverify_active_doc');
            localStorage.removeItem('credverify_analysis_meta');
            localStorage.removeItem('credverify_category_scores');
          } catch (e) {}
        } else {
          try {
            localStorage.setItem('credverify_active_doc', JSON.stringify(remainingResume));
          } catch (e) {}
        }

        return nextDocs;
      });
    };

    if (isBackendDoc && backendStatus === 'connected') {
      try {
        await api.deleteDocument(docId, effectiveUserId);
      } catch (err) {
        // If 404 (document or user not found on backend), proceed with local purge anyway
        const errMsg = String(err?.message || '').toLowerCase();
        if (!errMsg.includes('404') && !errMsg.includes('not found')) {
          console.error('Failed to delete document from backend:', err);
          showToast(`Failed to delete document: ${err.message}`, 'error');
          return;
        }
      }

      // Always purge deleted document from local state and storage
      purgeDocumentFromStateAndStorage(docId);

      // Re-fetch fresh documents from backend if user exists
      if (effectiveUserId) {
        try {
          const freshDocs = await api.getUserDocuments(effectiveUserId);
          if (Array.isArray(freshDocs)) {
            const formattedList = freshDocs.map(formatBackendDoc);
            setDocuments(formattedList);
            try {
              localStorage.setItem('credverify_documents', JSON.stringify(formattedList));
            } catch (e) {}
            const remainingResume = formattedList.find(isResumeDoc) || null;
            setActiveDocument(remainingResume);
            if (!remainingResume) {
              setClaims([]);
              setCategoryScores([]);
              setAnalysisProgress(0);
              setAnalysisMeta(null);
              try {
                localStorage.removeItem('credverify_claims');
                localStorage.removeItem('credverify_active_doc');
                localStorage.removeItem('credverify_analysis_meta');
                localStorage.removeItem('credverify_category_scores');
              } catch (e) {}
            }
          }
        } catch (fetchErr) {
          if (String(fetchErr?.message || '').includes('404') || String(fetchErr?.message || '').toLowerCase().includes('not found')) {
            try {
              localStorage.removeItem('credverify_user_profile');
              localStorage.removeItem('credverify_documents');
              localStorage.removeItem('credverify_claims');
              localStorage.removeItem('credverify_active_doc');
              localStorage.removeItem('credverify_category_scores');
              localStorage.removeItem('credverify_analysis_meta');
            } catch (e) {}
          }
        }
      }

      showToast(`Document "${targetDoc?.name || 'Document'}" deleted.`, 'info');
    } else {
      purgeDocumentFromStateAndStorage(docId);
      showToast('Document removed from active session.', 'info');
    }
  };

  // Create claim (backend connected)
  const createClaim = async (claimData) => {
    try {
      if (backendStatus === 'connected' && user?.id) {
        const res = await api.createClaim({
          user_id: user.id,
          ...claimData
        });
        setClaims(prev => [res, ...prev]);
        showToast('Claim registered with backend verification pipeline.', 'success');
        return res;
      }
    } catch (err) {
      showToast(`Failed to register claim: ${err.message}`, 'error');
    }
  };

  // Create credential (backend connected)
  const createCredential = async (credData) => {
    try {
      if (backendStatus === 'connected' && user?.id) {
        const res = await api.createCredential({
          user_id: user.id,
          ...credData
        });
        setCredentials(prev => [res, ...prev]);
        showToast('Credential record stored in database.', 'success');
        return res;
      }
    } catch (err) {
      showToast(`Failed to register credential: ${err.message}`, 'error');
    }
  };

  const runVerificationAnalysis = async (targetDoc = null, options = {}) => {
    const isDocObj = (d) => Boolean(d && typeof d === 'object' && d.id && !d.nativeEvent && !d._reactName && !d.target);

    // Step 1: When connected to backend, pull ALL current backend documents belonging to active user
    let currentDocs = documents;
    let effectiveUserId = user?.id || getStoredUser()?.id;

    if (backendStatus === 'connected' && !effectiveUserId) {
      const stored = getStoredUser();
      if (stored?.email) {
        try {
          const u = await api.getUserByEmail(stored.email);
          if (u?.id) {
            effectiveUserId = u.id;
            setUser(prev => ({ ...prev, id: u.id }));
          }
        } catch (e) {}
      }
    }

    if (!effectiveUserId && Array.isArray(currentDocs) && currentDocs.length > 0) {
      const docWithUser = currentDocs.find(d => d.userId || d.user_id);
      if (docWithUser) {
        effectiveUserId = docWithUser.userId || docWithUser.user_id;
      }
    }

    if (backendStatus === 'connected' && effectiveUserId && !user?.isDemo) {
      try {
        const backendDocs = await api.getUserDocuments(effectiveUserId);
        if (Array.isArray(backendDocs)) {
          currentDocs = backendDocs.map(formatBackendDoc);
          setDocuments(currentDocs);
        }
      } catch (docErr) {
        console.warn('Error fetching fresh user documents on rerun analysis:', docErr);
      }
    }

    // Step 2: Strictly resolve docToAnalyze as ONLY the primary Resume document.
    // The resume is the source of claims; supporting documents (PAN, Aadhaar, certificates) must NEVER be analyzed as the source document!
    let docToAnalyze = null;
    if (isDocObj(targetDoc) && isResumeDoc(targetDoc)) {
      docToAnalyze = targetDoc;
    } else if (isDocObj(activeDocument) && isResumeDoc(activeDocument)) {
      docToAnalyze = activeDocument;
    } else {
      // Find the first resume in currentDocs
      const foundResume = currentDocs.find(d => isResumeDoc(d));
      if (foundResume) {
        docToAnalyze = foundResume;
      }
    }

    // Requirement 2, 3, 4: If NO Resume exists:
    // Do NOT allow Rerun Analysis.
    // Do NOT treat PAN/Aadhaar/certificate as the primary analysis document.
    if (!docToAnalyze || !isResumeDoc(docToAnalyze)) {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      showToast('Upload a resume to start verification.', 'info');
      navigateTo('upload');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(15);
    // Clear any previous claims so fresh analysis results are evaluated.
    setClaims([]);

    if (options.returnToReport) {
      navigateTo('report');
    } else {
      navigateTo('analysis');
    }

    setActiveDocument(docToAnalyze);

    // Handle case where NO documents exist at all
    if (!docToAnalyze) {
      const zeroScores = [
        { category: "Identity Consistency", score: 50, status: "Under Review", description: "No documents uploaded." },
        { category: "Education Consistency", score: 50, status: "Under Review", description: "No documents uploaded." },
        { category: "Work Experience", score: 50, status: "Under Review", description: "No documents uploaded." },
        { category: "Certifications", score: 50, status: "Under Review", description: "No documents uploaded." }
      ];
      setClaims([]);
      setCategoryScores(zeroScores);
      setUser(prev => {
        const updated = {
          ...prev,
          trustScore: 40,
          verifiedCount: 0,
          flaggedCount: 0,
          unsupportedCount: 0,
          verificationDate: 'Today'
        };
        try { localStorage.setItem('credverify_user_profile', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
      setAnalysisMeta({
        extractionMethod: 'zero_documents',
        isFallback: false,
        analyzedDocName: 'None',
        trustScore: 40,
        categoryScores: zeroScores
      });
      try {
        localStorage.removeItem('credverify_analysis_meta');
        localStorage.removeItem('credverify_category_scores');
      } catch (e) {}
      setAnalysisProgress(100);
      setIsAnalyzing(false);
      return;
    }

    const isBackendDoc = Boolean(
      docToAnalyze?.id && 
      typeof docToAnalyze.id === 'string' &&
      !docToAnalyze.id.startsWith('doc_') &&
      (docToAnalyze.id.includes('-') || docToAnalyze.id.length > 20)
    );

    if (isBackendDoc && backendStatus === 'connected') {
      try {
        // Stage 1: Text extraction
        setAnalysisProgress(25);
        await new Promise(r => setTimeout(r, 30));

        // Stage 2: Processing & API Call
        setAnalysisProgress(50);
        const result = await api.analyzeDocument(docToAnalyze.id);
        
        // Stage 3: Discrepancy & Claims evaluation
        setAnalysisProgress(75);
        await new Promise(r => setTimeout(r, 30));

        // Stage 4: Apply results EXCLUSIVELY from latest backend analysis response
        const newClaims = Array.isArray(result.claims) ? result.claims.map(c => ({
          id: c.id,
          user_id: c.user_id,
          userId: c.user_id,
          category: c.category,
          claimText: c.claim_text || c.claimText,
          claim_text: c.claim_text || c.claimText,
          status: c.status,
          confidence_pct: c.confidence_pct,
          confidence: c.confidence || (c.confidence_pct != null ? `${c.confidence_pct}%` : 'N/A'),
          matchedDocument: c.matched_document || c.matchedDocument,
          matched_document: c.matched_document || c.matchedDocument,
          matched_document_id: c.matched_document_id || c.matchedDocumentId || null,
          details: c.details,
          source_document_id: c.source_document_id
        })) : [];
        setClaims(newClaims);
        try {
          localStorage.setItem('credverify_claims', JSON.stringify(newClaims));
        } catch (e) {}

        // Fetch fresh backend documents to ensure counts and statuses are synchronized
        try {
          if (effectiveUserId) {
            const freshDocs = await api.getUserDocuments(effectiveUserId);
            if (Array.isArray(freshDocs)) {
              setDocuments(freshDocs.map(formatBackendDoc));
            }
          }
        } catch (e) {}

        const isGenericName = (n) => !n || ['verified candidate', 'candidate', 'new candidate', 'user', 'priyan sharma'].includes(n.trim().toLowerCase());

        const docNameClean = (docToAnalyze.name || docToAnalyze.original_name || '')
          .replace(/\.[^/.]+$/, '')
          .replace(/[_.-]+/g, ' ')
          .replace(/\b(resume|cv|updated|final|doc|v\d+)\b/gi, '')
          .trim();

        const candidateNameResolved = 
          (result.candidate_name && !isGenericName(result.candidate_name) ? result.candidate_name : null) ||
          (user?.name && !isGenericName(user.name) ? user.name : null) ||
          (docNameClean && !isGenericName(docNameClean) ? docNameClean : null) ||
          result.candidate_name ||
          'Verified Candidate';

        const categoryScoresResolved = (result.metrics?.category_scores && result.metrics.category_scores.length > 0)
          ? result.metrics.category_scores
          : [];

        // STRICT REQUIREMENT: trustScore MUST come exclusively from latest backend response
        const trustScoreResolved = (result.metrics?.trust_score !== undefined && result.metrics?.trust_score !== null)
          ? result.metrics.trust_score
          : (result.metrics?.verified_count === 0 ? 45 : 50);

        setCategoryScores(categoryScoresResolved);
        try {
          localStorage.setItem('credverify_category_scores', JSON.stringify(categoryScoresResolved));
        } catch (e) {}

        setUser(prev => {
          const updated = {
            ...prev,
            name: candidateNameResolved,
            trustScore: trustScoreResolved,
            verifiedCount: result.metrics?.verified_count ?? 0,
            flaggedCount: result.metrics?.mismatch_count ?? 0,
            unsupportedCount: result.metrics?.unsupported_count ?? 0,
            verificationDate: 'Today'
          };
          try {
            localStorage.setItem('credverify_user_profile', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        const metaObj = {
          extractionMethod: result.extraction_method,
          textSnippet: result.extracted_text_snippet,
          isFallback: result.extraction_method === 'metadata_fallback',
          analyzedDocId: docToAnalyze.id,
          analyzedDocName: docToAnalyze.name || docToAnalyze.original_name,
          candidateName: candidateNameResolved,
          trustScore: trustScoreResolved,
          categoryScores: categoryScoresResolved
        };
        setAnalysisMeta(metaObj);
        try {
          localStorage.setItem('credverify_analysis_meta', JSON.stringify(metaObj));
        } catch (e) {}

        setAnalysisProgress(100);
        setIsAnalyzing(false);
        showToast(`AI Credential Verification complete for ${docToAnalyze.name || docToAnalyze.original_name}!`, 'success');
        return;
      } catch (err) {
        console.error('Backend analysis error:', err);
        showToast(`Verification analysis error: ${err.message || 'Server error'}`, 'error');
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        return;
      }
    }

    // Fallback simulation (when backend is offline or analyzing mock/simulated item)
    const simulatedUnsupported = [
      {
        id: 'sim_1',
        category: 'Education',
        claimText: 'Degree & Academic Qualifications',
        status: 'Unsupported',
        confidence_pct: 25,
        matchedDocument: 'No supporting document uploaded',
        details: 'No supporting degree or marksheet document found among uploaded credentials.'
      },
      {
        id: 'sim_2',
        category: 'Experience',
        claimText: 'Professional Experience & Tenure Record',
        status: 'Unsupported',
        confidence_pct: 25,
        matchedDocument: 'No supporting document uploaded',
        details: 'No experience or relieving letter uploaded to substantiate employment history.'
      },
      {
        id: 'sim_3',
        category: 'Certifications',
        claimText: 'Professional Certifications & Licenses',
        status: 'Unsupported',
        confidence_pct: 20,
        matchedDocument: 'No supporting document uploaded',
        details: 'No certification badge or certificate document uploaded.'
      }
    ];
    setClaims(simulatedUnsupported);
    const simulatedCategoryScores = [
      { category: "Identity Consistency", score: 50, status: "Under Review", description: "Requires primary document proof." },
      { category: "Education Consistency", score: 50, status: "Under Review", description: "Requires supporting degree/marksheet." },
      { category: "Work Experience", score: 50, status: "Under Review", description: "Requires experience or relieving letter." },
      { category: "Certifications", score: 50, status: "Under Review", description: "Requires certification badge." }
    ];
    setCategoryScores(simulatedCategoryScores);
    setUser(prev => ({
      ...prev,
      trustScore: 45,
      verifiedCount: 0,
      flaggedCount: 0,
      unsupportedCount: 3,
      verificationDate: 'Today'
    }));
    setAnalysisMeta({
      extractionMethod: 'demo_fallback',
      isFallback: true,
      analyzedDocName: docToAnalyze?.name || 'Sample Resume',
      trustScore: 45,
      categoryScores: simulatedCategoryScores
    });

    let current = 25;
    const interval = setInterval(() => {
      current += 25;
      if (current >= 100) {
        clearInterval(interval);
        setAnalysisProgress(100);
        setIsAnalyzing(false);
        showToast('AI Credential Verification complete (Demo Mode)!', 'info');
      } else {
        setAnalysisProgress(current);
      }
    }, 400);
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        navigateTo,
        authRole,
        setAuthRole,
        isLoggedIn,
        handleLogin,
        handleSignUp,
        handleLogout,
        user,
        setUser,
        documents,
        activeDocument,
        setActiveDocument,
        addDocument,
        addDocuments,
        detectDocumentCategory,
        removeDocument,
        claims,
        credentials,
        createClaim,
        createCredential,
        categoryScores,
        setCategoryScores,
        analysisMeta,
        requestedClaim,
        setRequestedClaim,
        openUploadForClaim,
        openDocumentFile,
        candidates,
        selectedCandidate,
        setSelectedCandidate,
        activities: dynamicActivities,
        highlightedClaimId,
        setHighlightedClaimId,
        formatMismatchReason,
        isAnalyzing,
        analysisProgress,
        runVerificationAnalysis,
        hasResume,
        hasAnalysisRun,
        isResumeDoc,
        currentResumeDoc,
        toast,
        showToast,
        // Backend states
        backendStatus,
        backendHealth,
        checkHealth,
        isLoading,
        isUploading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
