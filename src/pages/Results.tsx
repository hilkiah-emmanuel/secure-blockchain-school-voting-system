import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Download, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVotingStore } from '@/lib/votingStore';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Results = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { currentUser, classes, positions, results } = useVotingStore();

  const classItem = classes.find((c) => c.id === classId);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  if (!classItem) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Class not found</p>
      </div>
    );
  }

  const votedCount = classItem.students.filter((s) => s.hasVoted).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 glass border-b border-border/50"
      >
        <div className="container px-4">
          <div className="flex items-center h-16 gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/class/${classId}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">Election Results - Tanzania</h1>
              <p className="text-sm text-muted-foreground">
                {votedCount} kura zimeandikwa ({Math.round((votedCount / classItem.students.length) * 100)}% participation)
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={async () => {
                  try {
                    const { resultsAPI } = await import('@/lib/api');
                    await resultsAPI.exportCSV(classId!);
                    toast.success('Results exported as CSV');
                  } catch (error) {
                    toast.error('Failed to export CSV');
                  }
                }}
              >
                <Download className="w-4 h-4 mr-1.5" />
                CSV
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={async () => {
                  try {
                    const { exportResultsToPDF } = await import('@/lib/pdfExport');
                    await exportResultsToPDF(
                      results,
                      classItem?.name || 'Unknown Class',
                      new Date().toLocaleDateString()
                    );
                    toast.success('Results exported as PDF');
                  } catch (error) {
                    toast.error('Failed to export PDF');
                  }
                }}
              >
                <Download className="w-4 h-4 mr-1.5" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Results */}
      <main className="container p-4 pb-8">
        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-card mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Election Summary</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold text-foreground">{votedCount}</p>
              <p className="text-sm text-muted-foreground">Total Votes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{positions.length}</p>
              <p className="text-sm text-muted-foreground">Positions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{Math.round((votedCount / classItem.students.length) * 100)}%</p>
              <p className="text-sm text-muted-foreground">Participation</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{classItem.students.length}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {positions.map((position, posIndex) => {
            const positionResults = results[position.id] || {};
            const totalVotes = Object.values(positionResults).reduce((a, b) => a + b, 0);
            
            // Sort candidates by votes
            const sortedCandidates = [...position.candidates].sort((a, b) => {
              return (positionResults[b.id] || 0) - (positionResults[a.id] || 0);
            });

            const maxVotes = Math.max(...Object.values(positionResults), 1);

            // Chart data
            const chartData = sortedCandidates.map(candidate => ({
              name: candidate.name.split(' ')[0], // First name only for chart
              votes: positionResults[candidate.id] || 0,
              fullName: candidate.name,
            }));

            const pieData = chartData.map((item, index) => ({
              name: item.name,
              value: item.votes,
              fullName: item.fullName,
            }));

            const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#FF2D55'];

            return (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: posIndex * 0.1 }}
                className="bg-card rounded-2xl p-5 shadow-card"
              >
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-semibold text-foreground">{position.title}</h2>
                  {sortedCandidates[0] && (positionResults[sortedCandidates[0].id] || 0) > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 text-warning"
                    >
                      <Trophy className="w-5 h-5" />
                      <span className="text-sm font-medium">{sortedCandidates[0].name}</span>
                    </motion.div>
                  )}
                </div>

                {/* Charts */}
                {totalVotes > 0 && (
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Bar Chart */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Vote Distribution</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Bar dataKey="votes" fill="#007AFF" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Pie Chart */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Vote Percentage</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Detailed Results */}
                <div className="space-y-4">
                  {sortedCandidates.map((candidate, index) => {
                    const votes = positionResults[candidate.id] || 0;
                    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const isWinner = index === 0 && votes > 0;

                    return (
                      <div key={candidate.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isWinner && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3 + posIndex * 0.1 }}
                              >
                                <Trophy className="w-5 h-5 text-warning" />
                              </motion.div>
                            )}
                            <span className={`font-medium ${isWinner ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {candidate.name}
                            </span>
                          </div>
                          <span className={`text-sm font-semibold ${isWinner ? 'text-primary' : 'text-muted-foreground'}`}>
                            {votes} kura ({percentage}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(votes / maxVotes) * 100}%` }}
                            transition={{ delay: 0.2 + posIndex * 0.1, duration: 0.6, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              isWinner ? 'bg-primary' : 'bg-muted-foreground/30'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
                  Jumla ya kura: {totalVotes}
                </p>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Results;
