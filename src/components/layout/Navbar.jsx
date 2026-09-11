import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  UploadCloud, 
  Cpu, 
  FileText, 
  Share2, 
  UserCheck, 
  LogOut, 
  LogIn, 
  User,
  Sparkles,
  Search,
  Activity
} from 'lucide-react';

export const Navbar = () => {
  const { 
    currentView, 
    navigateTo, 
    isLoggedIn, 
    authRole, 
    setAuthRole,
    handleLogout,
    backendStatus,
    checkHealth
  } = useApp();

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(7, 9, 14, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '14px 24px'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        
        {/* Brand Logo */}
        <div 
          onClick={() => navigateTo('landing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <ShieldCheck size={24} color="#ffffff" />
          </div>
          <div>
            <span style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: '#ffffff'
            }}>
              Cred<span className="gradient-text-primary">Verify</span>
            </span>
            <span style={{
              display: 'block',
              fontSize: '0.65rem',
              fontWeight: 600,
              color: '#94a3b8',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              AI Credential Engine
            </span>
          </div>
        </div>

        {/* Dynamic Center Nav Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '4px 6px',
          borderRadius: '9999px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {isLoggedIn ? (
            authRole === 'individual' ? (
              <>
                <button 
                  onClick={() => navigateTo('dashboard')}
                  className={`btn btn-sm ${currentView === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ border: currentView === 'dashboard' ? 'none' : 'transparent' }}
                >
                  <LayoutDashboard size={15} /> Dashboard
                </button>
                <button 
                  onClick={() => navigateTo('upload')}
                  className={`btn btn-sm ${currentView === 'upload' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ border: currentView === 'upload' ? 'none' : 'transparent' }}
                >
                  <UploadCloud size={15} /> Upload Documents
                </button>
                <button 
                  onClick={() => navigateTo('analysis')}
                  className={`btn btn-sm ${currentView === 'analysis' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ border: currentView === 'analysis' ? 'none' : 'transparent' }}
                >
                  <Cpu size={15} /> AI Analysis
                </button>
                <button 
                  onClick={() => navigateTo('report')}
                  className={`btn btn-sm ${currentView === 'report' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ border: currentView === 'report' ? 'none' : 'transparent' }}
                >
                  <FileText size={15} /> Report
                </button>
                <button 
                  onClick={() => navigateTo('public-profile')}
                  className={`btn btn-sm ${currentView === 'public-profile' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ border: currentView === 'public-profile' ? 'none' : 'transparent' }}
                >
                  <Share2 size={15} /> Public Profile
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigateTo('recruiter')}
                  className={`btn btn-sm ${currentView === 'recruiter' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ border: currentView === 'recruiter' ? 'none' : 'transparent' }}
                >
                  <Search size={15} /> Candidate Roster
                </button>
                <button 
                  onClick={() => navigateTo('report')}
                  className={`btn btn-sm ${currentView === 'report' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ border: currentView === 'report' ? 'none' : 'transparent' }}
                >
                  <FileText size={15} /> Sample Audit Report
                </button>
              </>
            )
          ) : (
            <>
              <button 
                onClick={() => navigateTo('landing')}
                className={`btn btn-sm ${currentView === 'landing' ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: currentView === 'landing' ? 'none' : 'transparent' }}
              >
                Overview
              </button>
              <button 
                onClick={() => navigateTo('public-profile')}
                className={`btn btn-sm ${currentView === 'public-profile' ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: currentView === 'public-profile' ? 'none' : 'transparent' }}
              >
                Sample Profile
              </button>
            </>
          )}
        </div>

        {/* Right Actions & Quick Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Backend Status Pill */}
          <div 
            onClick={checkHealth}
            title={backendStatus === 'connected' ? 'FastAPI Backend connected at http://127.0.0.1:8000' : 'Backend is offline or connecting. Click to retry.'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: backendStatus === 'connected' ? 'rgba(16, 185, 129, 0.12)' : (backendStatus === 'connecting' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)'),
              border: backendStatus === 'connected' ? '1px solid rgba(16, 185, 129, 0.3)' : (backendStatus === 'connecting' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'),
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: backendStatus === 'connected' ? '#10b981' : (backendStatus === 'connecting' ? '#f59e0b' : '#ef4444'),
              userSelect: 'none'
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: backendStatus === 'connected' ? '#10b981' : (backendStatus === 'connecting' ? '#f59e0b' : '#ef4444'),
              boxShadow: backendStatus === 'connected' ? '0 0 6px #10b981' : 'none'
            }} />
            <span>{backendStatus === 'connected' ? 'API Live' : (backendStatus === 'connecting' ? 'Connecting...' : 'API Offline')}</span>
          </div>

          {/* Quick Role Switcher Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: '9999px',
            padding: '3px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button
              onClick={() => {
                setAuthRole('individual');
                navigateTo(isLoggedIn ? 'dashboard' : 'landing');
              }}
              style={{
                background: authRole === 'individual' ? '#6366f1' : 'transparent',
                color: authRole === 'individual' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <User size={12} /> Candidate
            </button>
            <button
              onClick={() => {
                setAuthRole('recruiter');
                navigateTo('recruiter');
              }}
              style={{
                background: authRole === 'recruiter' ? '#a855f7' : 'transparent',
                color: authRole === 'recruiter' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <UserCheck size={12} /> Recruiter
            </button>
          </div>

          {/* Auth Button */}
          {isLoggedIn ? (
            <button 
              onClick={handleLogout}
              className="btn btn-sm btn-outline"
              title="Sign Out"
            >
              <LogOut size={15} /> Sign Out
            </button>
          ) : (
            <button 
              onClick={() => navigateTo('auth')}
              className="btn btn-sm btn-primary"
            >
              <LogIn size={15} /> Sign In
            </button>
          )}
        </div>

      </div>
    </nav>
  );
};
