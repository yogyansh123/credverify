import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  FileSearch, 
  Cpu, 
  Lock, 
  Award, 
  Users, 
  Sparkles, 
  AlertTriangle,
  FileCheck2,
  Share2,
  GraduationCap,
  Briefcase,
  UserCheck
} from 'lucide-react';

export const LandingPage = () => {
  const { navigateTo, handleLogin } = useApp();

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* HERO SECTION */}
      <section style={{
        position: 'relative',
        padding: '80px 24px 100px 24px',
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '60px',
        alignItems: 'center'
      }}>
        
        {/* Left Column: Headline & CTA */}
        <div>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '6px 14px',
            borderRadius: '9999px',
            color: '#818cf8',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '24px'
          }}>
            <Sparkles size={16} /> AI-Powered Credential Verification Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            marginBottom: '24px'
          }}>
            Prove your professional credentials <span className="gradient-text">with confidence.</span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: '#94a3b8',
            lineHeight: 1.7,
            marginBottom: '36px',
            maxWidth: '580px'
          }}>
            CredVerify helps you cross-reference claims in your resume against uploaded degrees, certificates, and work experience letters — making discrepancies visible before an interview.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
            <button 
              onClick={() => {
                handleLogin('individual');
                navigateTo('dashboard');
              }}
              className="btn btn-primary btn-lg"
            >
              Get Started Free <ArrowRight size={20} />
            </button>

            <button 
              onClick={() => {
                handleLogin('individual');
                navigateTo('upload');
              }}
              className="btn btn-secondary btn-lg"
            >
              Verify Credentials <FileSearch size={20} />
            </button>
          </div>

          {/* Trust Highlights */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '24px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.875rem',
            color: '#64748b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#10b981" /> AI-Assisted Analysis
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#10b981" /> Discrepancy Highlighting
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#10b981" /> Verified Profile Sharing
            </div>
          </div>

        </div>

        {/* Right Column: Interactive AI Verification Demo Preview */}
        <div style={{ position: 'relative' }}>
          
          {/* Ambient Glow */}
          <div style={{
            position: 'absolute',
            inset: '-20px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
            filter: 'blur(40px)',
            zIndex: 0
          }} />

          {/* Live Scanner Card */}
          <div className="glass-card scanner-container" style={{
            position: 'relative',
            zIndex: 1,
            padding: '28px',
            borderColor: 'rgba(99, 102, 241, 0.3)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div className="scanner-line" />

            {/* Scanner Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Cpu size={20} color="#818cf8" />
                </div>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>AI Claim Analyser</h4>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span> Sample Demo Preview
                  </span>
                </div>
              </div>
              <div className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Sample Data</div>
            </div>

            {/* Mock Analysis Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Item 1 */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>SAMPLE CLAIM</span>
                  <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>B.Tech CS @ IIT Delhi (CGPA 8.9)</span>
                </div>
                <div className="badge badge-success">Verified Match</div>
              </div>

              {/* Item 2 */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>RESUME CLAIM</span>
                  <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>3.5 Yrs Senior Engineer @ TechCorp</span>
                </div>
                <div className="badge badge-warning">Tenure Mismatch</div>
              </div>

              {/* Item 3 */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>RESUME CLAIM</span>
                  <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>AWS Solutions Architect Cert</span>
                </div>
                <div className="badge badge-success">Demo: Matched</div>
              </div>

            </div>

            {/* Bottom Card Action */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                onClick={() => navigateTo('report')}
                className="btn btn-sm btn-outline"
                style={{ width: '100%' }}
              >
                Inspect Sample Verification Report <ArrowRight size={14} />
              </button>
            </div>

          </div>

        </div>

      </section>

      {/* TARGET AUDIENCE BANNER */}
      <section style={{
        background: 'rgba(15, 23, 42, 0.4)',
        borderVertical: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '50px 24px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#64748b', marginBottom: '28px' }}>
            Built for Everyone Seeking Unshakeable Career Credibility
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px'
          }}>
            
            <div className="glass-card" style={{ padding: '24px', textAlign: 'left' }}>
              <GraduationCap size={28} color="#818cf8" style={{ marginBottom: '12px' }} />
              <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Students & Freshers</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Stand out in campus placements with verified university transcripts and certs.</p>
            </div>

            <div className="glass-card" style={{ padding: '24px', textAlign: 'left' }}>
              <Briefcase size={28} color="#a855f7" style={{ marginBottom: '12px' }} />
              <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Job Seekers</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Bypass lengthy background checks by attaching a verified CredVerify link to applications.</p>
            </div>

            <div className="glass-card" style={{ padding: '24px', textAlign: 'left' }}>
              <Award size={28} color="#06b6d4" style={{ marginBottom: '12px' }} />
              <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Working Professionals</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Maintain a dynamic audit trail of promotions, skill upgrades, and employer letters.</p>
            </div>

            <div className="glass-card" style={{ padding: '24px', textAlign: 'left' }}>
              <UserCheck size={28} color="#10b981" style={{ marginBottom: '12px' }} />
              <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Recruiters & HR</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Instantly flag resume exaggerations before scheduling expensive interviews.</p>
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section style={{
        maxWidth: '1280px',
        margin: '100px auto',
        padding: '0 24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div className="badge badge-info" style={{ marginBottom: '12px' }}>Simple 3-Step Process</div>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff' }}>How It Works</h2>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '12px auto 0 auto' }}>
            Upload your documents and get a structured analysis of how well your resume claims align with the supporting evidence.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px'
        }}>
          
          {/* Step 1 */}
          <div className="glass-card glass-card-interactive" style={{ padding: '32px', position: 'relative' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              marginBottom: '20px'
            }}>01</div>
            <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>
              Upload Resume & Credentials
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Upload your latest resume alongside supporting proofs like university marksheets, experience letters, government ID, and cert PDFs.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-card glass-card-interactive" style={{ padding: '32px', position: 'relative' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              marginBottom: '20px'
            }}>02</div>
            <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>
              AI-Assisted Document Analysis
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Our AI extracts key claims (dates, titles, institutions, grades) from your documents and highlights potential mismatches for your review.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-card glass-card-interactive" style={{ padding: '32px', position: 'relative' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              marginBottom: '20px'
            }}>03</div>
            <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>
              Generate & Share Public Profile
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Receive an overall Trust Score badge and a shareable public link + QR code that recruiters can independently audit.
            </p>
          </div>

        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section style={{
        maxWidth: '1280px',
        margin: '100px auto',
        padding: '0 24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff' }}>A Smarter Way to Present Your Credentials</h2>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '12px auto 0 auto' }}>
            Structured tools designed to help candidates present their credentials more transparently.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '30px'
        }}>
          
          <div className="glass-card" style={{ padding: '30px' }}>
            <FileCheck2 size={32} color="#6366f1" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>Multi-Category Consistency</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Scores across 4 core vectors: Identity, Education, Experience, and Skill Certifications for complete integrity.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '30px' }}>
            <AlertTriangle size={32} color="#f59e0b" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>Discrepancy & Mismatch Alerts</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Flags tenure exaggerations, inflated job titles, altered GPA numbers, and unverified skill assertions immediately.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '30px' }}>
            <Share2 size={32} color="#a855f7" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>Public Verification Link & QR</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Embed verified trust badges on your LinkedIn profile, resume PDF, or online portfolio with one click.
            </p>
          </div>

        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{
        maxWidth: '1280px',
        margin: '80px auto 0 auto',
        padding: '0 24px'
      }}>
        <div className="glass-card" style={{
          padding: '60px 40px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.4)',
          boxShadow: '0 0 50px rgba(99, 102, 241, 0.2)'
        }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
            Ready to verify your professional story?
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 32px auto' }}>
            Explore the demo and see how CredVerify can help you present your credentials more clearly and transparently.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                handleLogin('individual');
                navigateTo('dashboard');
              }}
              className="btn btn-primary btn-lg"
            >
              Start Verification Now <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => {
                handleLogin('recruiter');
                navigateTo('recruiter');
              }}
              className="btn btn-secondary btn-lg"
            >
              Explore Recruiter Portal <UserCheck size={20} />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
