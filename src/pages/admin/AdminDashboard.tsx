import { motion } from 'framer-motion';
import { Vote, Users, GraduationCap, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { useVotingStore } from '@/lib/votingStore';

export const AdminDashboard = () => {
  const { classes, elections, positions } = useVotingStore();

  const totalStudents = classes.reduce((acc, c) => acc + c.students.length, 0);
  const totalVoted = classes.reduce((acc, c) => acc + c.students.filter(s => s.hasVoted).length, 0);
  const activeElections = elections.filter(e => e.status === 'active').length;
  const totalCandidates = positions.reduce((acc, p) => acc + p.candidates.length, 0);
  const participationRate = totalStudents > 0 ? Math.round((totalVoted / totalStudents) * 100) : 0;

  const stats = [
    { 
      label: 'Active Elections', 
      value: activeElections, 
      icon: Vote, 
      color: 'bg-primary/10 text-primary' 
    },
    { 
      label: 'Total Classes', 
      value: classes.length, 
      icon: GraduationCap, 
      color: 'bg-warning/10 text-warning' 
    },
    { 
      label: 'Total Students', 
      value: totalStudents, 
      icon: Users, 
      color: 'bg-success/10 text-success' 
    },
    { 
      label: 'Participation', 
      value: `${participationRate}%`, 
      icon: TrendingUp, 
      color: 'bg-primary/10 text-primary' 
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage elections, classes, and students</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-2xl p-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-5 shadow-card"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Classes Overview</h2>
          <div className="space-y-3">
            {classes.slice(0, 5).map((classItem) => {
              const voted = classItem.students.filter(s => s.hasVoted).length;
              const total = classItem.students.length;
              const percentage = total > 0 ? Math.round((voted / total) * 100) : 0;
              
              return (
                <div key={classItem.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${classItem.votingOpen ? 'bg-success' : 'bg-muted-foreground'}`} />
                    <div>
                      <p className="font-medium text-foreground">{classItem.name}</p>
                      <p className="text-sm text-muted-foreground">{classItem.grade}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{percentage}%</p>
                    <p className="text-xs text-muted-foreground">{voted}/{total} voted</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Elections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl p-5 shadow-card"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Elections</h2>
          <div className="space-y-3">
            {elections.map((election) => (
              <div key={election.id} className="p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">{election.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{election.description}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    election.status === 'active' 
                      ? 'bg-success/20 text-success' 
                      : election.status === 'draft'
                      ? 'bg-warning/20 text-warning'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {election.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Vote className="w-4 h-4" />
                    {election.positions.length} positions
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {election.positions.reduce((acc, p) => acc + p.candidates.length, 0)} candidates
                  </span>
                </div>
              </div>
            ))}
            {elections.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No elections yet</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
