import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Vote, 
  Users, 
  GraduationCap, 
  Settings, 
  LogOut,
  ChevronLeft,
  Menu,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVotingStore } from '@/lib/votingStore';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { title: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { title: 'Elections', path: '/admin/elections', icon: Vote },
  { title: 'Classes', path: '/admin/classes', icon: GraduationCap },
  { title: 'Students', path: '/admin/students', icon: Users },
  { title: 'Teachers', path: '/admin/teachers', icon: UserPlus },
  { title: 'Candidates', path: '/admin/candidates', icon: UserCheck },
];

type Side = 'left' | 'right';

interface AdminSidebarProps {
  side?: Side;
}

export const AdminSidebar = ({ side = 'left' }: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useVotingStore();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavItems = navItems.filter(item => {
    // Teachers shouldn't manage teachers list
    if (!currentUser) return false;
    if (!currentUser.isAdmin && item.title === 'Teachers') return false;
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isRight = side === 'right';

  return (
    <motion.aside
      initial={{ width: 256 }}
      animate={{ width: collapsed ? 64 : 256 }}
      className={
        `h-screen bg-card flex flex-col sticky top-0 transition-all duration-200 ` +
        `${isRight ? 'border-l' : 'border-r'} border-border ` +
        `${collapsed ? (isRight ? 'rounded-l-full' : 'rounded-r-full') : 'rounded-none'}`
      }
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Vote className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Admin Panel</span>
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={collapsed ? 'mx-auto' : ''}
        >
          {collapsed ? <Menu className="w-5 h-5" /> : (isRight ? <ChevronLeft className="w-5 h-5 rotate-180" /> : <ChevronLeft className="w-5 h-5" />)}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
  {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-soft' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.title}</span>}
            </button>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-border space-y-2">
        {!collapsed && currentUser && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-foreground truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
          </div>
        )}
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          {!collapsed && <span className="text-xs text-muted-foreground flex-1">Theme</span>}
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
};
