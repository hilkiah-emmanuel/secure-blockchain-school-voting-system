import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from 'react';
import { authAPI } from './lib/api';
import { useVotingStore } from './lib/votingStore';
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ClassRoom from "./pages/ClassRoom";
import Voting from "./pages/Voting";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { ElectionsManagement } from "./pages/admin/ElectionsManagement";
import { ClassesManagement } from "./pages/admin/ClassesManagement";
import { StudentsManagement } from "./pages/admin/StudentsManagement";
import { TeachersManagement } from "./pages/admin/TeachersManagement";
import { CandidatesManagement } from "./pages/admin/CandidatesManagement";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// SessionRestorer: restore current user + load server data when token exists
export const SessionRestorer = () => {
  const loadFromServer = useVotingStore(state => state.loadFromServer);
  const setState = (useVotingStore as any).setState;

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    (async () => {
      try {
        const res = await authAPI.me();
        if (res && res.user) {
          setState({ currentUser: res.user });
          await loadFromServer();
        }
      } catch (err) {
        console.warn('Session restore failed', err);
        // clear token on failure
        localStorage.removeItem('auth_token');
      }
    })();
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <SessionRestorer />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/class/:classId" element={<ClassRoom />} />
          <Route path="/vote/:classId/:studentId" element={<Voting />} />
          <Route path="/results/:classId" element={<Results />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="elections" element={<ElectionsManagement />} />
            <Route path="classes" element={<ClassesManagement />} />
            <Route path="students" element={<StudentsManagement />} />
            <Route path="teachers" element={<TeachersManagement />} />
            <Route path="candidates" element={<CandidatesManagement />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
 
