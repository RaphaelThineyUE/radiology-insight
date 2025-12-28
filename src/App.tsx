import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import React, { Suspense } from "react";
import { createLogger } from "@/lib/logger";
import DevConsole from "@/components/dev/DevConsole";
import { useRouteMetrics } from "@/hooks/useRouteMetrics";
const AuthPage = React.lazy(() => import("./pages/AuthPage"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Upload = React.lazy(() => import("./pages/Upload"));
const Results = React.lazy(() => import("./pages/Results"));
const Library = React.lazy(() => import("./pages/Library"));
const Settings = React.lazy(() => import("./pages/Settings"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();
const log = createLogger('App');

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  log.debug('ProtectedRoute check', { loading, userPresent: !!user });

  if (loading) {
    log.info('ProtectedRoute loading');
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    log.info('ProtectedRoute redirect to /auth');
    return <Navigate to="/auth" replace />;
  }

  log.debug('ProtectedRoute render children');
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  log.debug('AppRoutes render', { loading, userPresent: !!user });
  useRouteMetrics();

  if (loading) {
    log.info('AppRoutes loading');
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>}>
      <Routes>
        <Route path="/auth" element={user ? (log.info('Redirecting authenticated user from /auth to /'), <Navigate to="/" replace />) : <AuthPage />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/results/:documentId" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
          <DevConsole />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
