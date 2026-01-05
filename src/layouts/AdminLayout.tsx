import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useVotingStore } from '@/lib/votingStore';
import { AdminSidebar } from '@/components/AdminSidebar';
import { LayoutDashboard, Vote, GraduationCap, Users } from 'lucide-react';

export const AdminLayout = () => {
  const navigate = useNavigate();
  const currentUser = useVotingStore((state) => state.currentUser);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Main content first so sidebar appears on the right */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Desktop / large screens: right sidebar */}
      <div className="hidden md:block">
        <AdminSidebar side="right" />
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-4 left-0 right-0 flex justify-center z-50">
        <div className="bg-card/95 backdrop-blur rounded-full px-3 py-2 shadow-elevated flex items-center gap-2">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-secondary">
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/admin/elections')} className="p-2 rounded-lg hover:bg-secondary">
            <Vote className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/admin/classes')} className="p-2 rounded-lg hover:bg-secondary">
            <GraduationCap className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/admin/students')} className="p-2 rounded-lg hover:bg-secondary">
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
