import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Toast } from './components/common/Toast';

import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { IndividualDashboard } from './pages/IndividualDashboard';
import { DocumentUploadPage } from './pages/DocumentUploadPage';
import { VerificationAnalysisPage } from './pages/VerificationAnalysisPage';
import { VerificationReportPage } from './pages/VerificationReportPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { RecruiterDashboard } from './pages/RecruiterDashboard';

const MainContent = () => {
  const { currentView } = useApp();

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage />;
      case 'auth':
        return <AuthPage />;
      case 'dashboard':
        return <IndividualDashboard />;
      case 'upload':
        return <DocumentUploadPage />;
      case 'analysis':
        return <VerificationAnalysisPage />;
      case 'report':
        return <VerificationReportPage />;
      case 'public-profile':
        return <PublicProfilePage />;
      case 'recruiter':
        return <RecruiterDashboard />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        {renderView()}
      </main>
      <Footer />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
