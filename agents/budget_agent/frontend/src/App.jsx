import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import { AppProvider } from './context/AppContext';
import { BudgetProvider } from './context/BudgetContext';
import Sidebar from './components/Sidebar';
import TransactionClassificationModal from './components/TransactionClassificationModal';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const TaxPage = lazy(() => import('./pages/TaxPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const PendingPage = lazy(() => import('./pages/PendingPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const PortfolioXRayPage = lazy(() => import('./pages/PortfolioXRayPage'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Layout Wrapper
function AppLayout({ children }) {
  return (
    <>
      <div className="animated-bg" />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppProvider>
        <BudgetProvider>
          <TransactionClassificationModal />
          <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } />
              
              <Route path="/upload" element={
                <ProtectedRoute>
                  <AppLayout><UploadPage /></AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <AppLayout><AnalyticsPage /></AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/portfolio-xray" element={
                <ProtectedRoute>
                  <AppLayout><PortfolioXRayPage /></AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/tax" element={
                <ProtectedRoute>
                  <AppLayout><TaxPage /></AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/chat" element={
                <ProtectedRoute>
                  <AppLayout><ChatPage /></AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/pending" element={
                <ProtectedRoute>
                  <AppLayout><PendingPage /></AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/budget" element={
                <ProtectedRoute>
                  <AppLayout><BudgetPage /></AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/goals" element={
                <ProtectedRoute>
                  <AppLayout><GoalsPage /></AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/categories" element={
                <ProtectedRoute>
                  <AppLayout><CategoriesPage /></AppLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </BudgetProvider>
      </AppProvider>
    </Router>
  );
}

export default App;
