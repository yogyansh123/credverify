import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, User, UserCheck, Mail, Lock, ArrowRight, Globe, Key, Share2 } from 'lucide-react';

export const AuthPage = () => {
  const { handleLogin, handleSignUp, isLoading } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState('individual'); // 'individual' or 'recruiter'
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      await handleSignUp({ name: name || 'Candidate', email: email.trim(), role: selectedRole });
    } else {
      await handleLogin(selectedRole, email.trim(), name.trim());
    }
  };

  return (
    <div style={{
      maxWidth: '480px',
      margin: '60px auto 80px auto',
      padding: '0 20px'
    }}>
      <div className="glass-card" style={{ padding: '36px' }}>
        
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <ShieldCheck size={28} color="#ffffff" />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.6rem', fontWeight: 800 }}>
            {isSignUp ? 'Create your CredVerify Account' : 'Welcome back to CredVerify'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '6px' }}>
            {isSignUp ? 'Verify credentials and prove your authentic work history.' : 'Access your verification dashboard and trust scores.'}
          </p>
        </div>

        {/* Tab Switcher: Login / Sign Up */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              background: !isSignUp ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: !isSignUp ? '#818cf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              background: isSignUp ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: isSignUp ? '#818cf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Role Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Select User Account Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            
            <div 
              onClick={() => setSelectedRole('individual')}
              style={{
                border: selectedRole === 'individual' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                background: selectedRole === 'individual' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                padding: '14px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <User size={20} color={selectedRole === 'individual' ? '#818cf8' : '#64748b'} style={{ marginBottom: '4px' }} />
              <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>Individual</div>
              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Student / Candidate</div>
            </div>

            <div 
              onClick={() => setSelectedRole('recruiter')}
              style={{
                border: selectedRole === 'recruiter' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                background: selectedRole === 'recruiter' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                padding: '14px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <UserCheck size={20} color={selectedRole === 'recruiter' ? '#c084fc' : '#64748b'} style={{ marginBottom: '4px' }} />
              <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>Recruiter</div>
              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>HR / Hiring Manager</div>
            </div>

          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit}>
          
          {isSignUp && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Jane Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignUp}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                className="form-input" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : (isSignUp ? 'Create Free Account' : 'Sign In to Dashboard')} <ArrowRight size={18} />
          </button>
        </form>

        {/* Social Logins */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '16px' }}>
            Or continue with OAuth Mock
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <button 
              onClick={() => handleLogin(selectedRole)}
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'center' }}
            >
              <Globe size={16} /> Google
            </button>
            <button 
              onClick={() => handleLogin(selectedRole)}
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'center' }}
            >
              <Share2 size={16} color="#0077b5" /> LinkedIn
            </button>
            <button 
              onClick={() => handleLogin(selectedRole)}
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'center' }}
            >
              <Key size={16} /> SSO
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
