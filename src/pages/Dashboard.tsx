import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, CheckCircle2, Clock, LogOut, ChevronRight, Award, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVotingStore } from '@/lib/votingStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ProgressRing } from '@/components/ProgressRing';
import { StatsCard } from '@/components/StatsCard';
import { AchievementBadge } from '@/components/AchievementBadge';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, classes, logout } = useVotingStore();
  const [showAchievement, setShowAchievement] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Check for achievements
    const allVoted = classes.every(c => 
      c.students.every(s => s.hasVoted) && c.students.length > 0
    );
    if (allVoted && classes.length > 0) {
      setShowAchievement(true);
      setTimeout(() => setShowAchievement(false), 5000);
    }
  }, [classes]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getVotingProgress = (classItem: typeof classes[0]) => {
    const voted = classItem.students.filter(s => s.hasVoted).length;
    const total = classItem.students.length;
    return { voted, total, percentage: total > 0 ? Math.round((voted / total) * 100) : 0 };
  };

  // Calculate overall stats
  const totalStudents = classes.reduce((acc, c) => acc + c.students.length, 0);
  const totalVoted = classes.reduce((acc, c) => acc + c.students.filter(s => s.hasVoted).length, 0);
  const participationRate = totalStudents > 0 ? Math.round((totalVoted / totalStudents) * 100) : 0;
  const activeClasses = classes.filter(c => c.votingOpen).length;
  const completedClasses = classes.filter(c => 
    c.students.length > 0 && c.students.every(s => s.hasVoted)
  ).length;

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 glass border-b border-border/50"
      >
        <div className="container flex items-center justify-between h-16 px-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">My Classes - Tanzania</h1>
            <p className="text-sm text-muted-foreground">{currentUser.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Stats Overview */}
      <div className="container p-4 pb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon={Users}
            label="Total Students"
            value={totalStudents}
            color="primary"
            delay={0.1}
          />
          <StatsCard
            icon={CheckCircle2}
            label="Voted"
            value={totalVoted}
            change={participationRate}
            color="success"
            delay={0.2}
          />
          <StatsCard
            icon={Clock}
            label="Active Classes"
            value={activeClasses}
            color="warning"
            delay={0.3}
          />
          <StatsCard
            icon={Award}
            label="Completed"
            value={completedClasses}
            color="purple"
            delay={0.4}
          />
        </div>

        {/* Overall Progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl p-6 shadow-card mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Overall Participation</h2>
              <p className="text-sm text-muted-foreground">Tanzania Student Elections 2024</p>
            </div>
            <ProgressRing progress={participationRate} size={100} />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-muted-foreground">{totalVoted} voted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-muted-foreground">{totalStudents - totalVoted} remaining</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Class Grid */}
      <main className="container p-4 pb-8">
        <div className="grid gap-4">
          {classes.map((classItem, index) => {
            const progress = getVotingProgress(classItem);
            
            return (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => navigate(`/class/${classItem.id}`)}
                  className="w-full text-left bg-card rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all duration-300 active:scale-[0.99] group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {classItem.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">{classItem.grade}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{classItem.students.length} students</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {classItem.votingOpen ? (
                          <>
                            <Clock className="w-4 h-4 text-warning" />
                            <span className="text-warning font-medium">Voting Open</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-success" />
                            <span className="text-success font-medium">Complete</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percentage}%` }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          progress.percentage === 100 ? 'bg-success' : 'bg-primary'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {progress.voted} of {progress.total} voted ({progress.percentage}%)
                      </p>
                      {progress.percentage === 100 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1 text-success text-sm font-medium"
                        >
                          <Award className="w-4 h-4" />
                          <span>100% Complete!</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Achievement Badge */}
      {showAchievement && (
        <AchievementBadge
          type="perfect-turnout"
          title="🎉 Perfect Turnout!"
          description="All classes have achieved 100% participation! Excellent work!"
          onClose={() => setShowAchievement(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
