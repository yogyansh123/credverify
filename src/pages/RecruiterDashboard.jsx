import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ExternalLink, 
  UserCheck, 
  Eye,
  SlidersHorizontal,
  ChevronRight,
  User,
  X
} from 'lucide-react';

export const RecruiterDashboard = () => {
  const { candidates, navigateTo, setSelectedCandidate, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Fully Verified', 'Needs Review'
  const [activeModalCandidate, setActiveModalCandidate] = useState(null);

  const filteredCandidates = candidates.filter(cand => {
    const matchesSearch = cand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cand.roleApplied.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cand.topSkills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Fully Verified') return matchesSearch && cand.trustScore >= 90;
    if (statusFilter === 'Needs Review') return matchesSearch && cand.flaggedCount > 0;
    return matchesSearch;
  });

  const handleInspectReport = (candidate) => {
    setSelectedCandidate(candidate);
    showToast(`Loading Audit Report for ${candidate.name}...`, 'info');
    navigateTo('report');
  };

  const handleOpenPublicProfile = (candidate) => {
    setSelectedCandidate(candidate);
    navigateTo('public-profile');
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* RECRUITER PORTAL HEADER */}
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
            <span className="badge badge-info"><UserCheck size={12} /> Recruiter Enterprise Workspace</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }}>
            Candidate Credential Roster
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Demo: Review how CredVerify surfaces credential discrepancies before you schedule interviews. <span className="badge badge-neutral" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>Sample Candidate Data</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => showToast('Batch inviting 5 shortlisted candidates for credential verification...', 'success')}
            className="btn btn-primary"
          >
            + Request Credential Audit
          </button>
        </div>
      </div>

      {/* SEARCH BAR & FILTER ROW */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          alignItems: 'center'
        }}>
          
          {/* Search Field */}
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              className="form-input"
              placeholder="Search by name, applied role, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '42px' }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['All', 'Fully Verified', 'Needs Review'].map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: statusFilter === tab ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: statusFilter === tab ? 'rgba(168, 85, 247, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  color: statusFilter === tab ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab === 'All' && 'All Candidates (5)'}
                {tab === 'Fully Verified' && 'Trust > 90% (3)'}
                {tab === 'Needs Review' && 'Flagged Discrepancies (2)'}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* CANDIDATE CARDS GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px'
      }}>
        {filteredCandidates.map((cand) => {
          const isHighTrust = cand.trustScore >= 90;
          return (
            <div 
              key={cand.id}
              className="glass-card glass-card-interactive"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: isHighTrust ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'
              }}
            >
              
              {/* Card Header: Avatar & Trust Badge */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <img 
                      src={cand.avatarUrl} 
                      alt={cand.name}
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: isHighTrust ? '2px solid #10b981' : '2px solid #f59e0b'
                      }}
                    />
                    <div>
                      <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>{cand.name}</h3>
                      <span style={{ fontSize: '0.8rem', color: '#818cf8', display: 'block' }}>{cand.roleApplied}</span>
                    </div>
                  </div>

                  <div style={{
                    background: isHighTrust ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    border: isHighTrust ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: isHighTrust ? '#10b981' : '#f59e0b' }}>
                      {cand.trustScore}%
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Trust Score</span>
                  </div>
                </div>

                {/* Candidate Verified Metrics Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '12px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  textAlign: 'center',
                  fontSize: '0.75rem'
                }}>
                  <div>
                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1rem', display: 'block' }}>{cand.verifiedCount}</span>
                    <span style={{ color: '#94a3b8' }}>Verified Docs</span>
                  </div>
                  <div>
                    <span style={{ color: cand.flaggedCount > 0 ? '#ef4444' : '#10b981', fontWeight: 800, fontSize: '1rem', display: 'block' }}>{cand.flaggedCount}</span>
                    <span style={{ color: '#94a3b8' }}>Flagged Claims</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontWeight: 800, fontSize: '1rem', display: 'block' }}>{cand.unsupportedCount}</span>
                    <span style={{ color: '#94a3b8' }}>Unsupported</span>
                  </div>
                </div>

                {/* Skills Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                  {cand.topSkills.map((sk, i) => (
                    <span key={i} className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <button 
                  onClick={() => handleInspectReport(cand)}
                  className="btn btn-primary btn-sm"
                >
                  <FileText size={14} /> Audit Report
                </button>

                <button 
                  onClick={() => handleOpenPublicProfile(cand)}
                  className="btn btn-outline btn-sm"
                >
                  <Eye size={14} /> Public Profile
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
