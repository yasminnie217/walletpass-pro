import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useClient } from './hooks/useClient';

import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Card from './pages/Card';
import Join from './pages/Join';
import Members from './pages/Members';
import Scanner from './pages/Scanner';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9F6F0' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: '#00704A' }} />
    </div>
  );
}

// Redirects authenticated users away from /login
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Requires auth. If no client profile → /onboarding. If profile exists → render page.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { client, clientChecked } = useClient();

  if (authLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  // Only wait for client query once we know a user is logged in
  if (!clientChecked) return <Spinner />;
  if (!client) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

// Onboarding route — requires auth but no client profile yet
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { client, clientChecked } = useClient();

  if (authLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!clientChecked) return <Spinner />;
  if (client) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/join/:clientId" element={<Join />} />

      {/* Onboarding — auth required, no client profile */}
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

      {/* Protected — auth + client profile required */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/card" element={<ProtectedRoute><Card /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
      <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: '"Inter", sans-serif', borderRadius: '12px' },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
