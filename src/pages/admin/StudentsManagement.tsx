import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, CheckCircle2, Circle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useVotingStore } from '@/lib/votingStore';

export const StudentsManagement = () => {
  const { classes } = useVotingStore();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'voted' | 'not-voted'>('all');

  // Flatten all students with class info
  const allStudents = classes.flatMap((c) =>
    c.students.map((s) => ({
      ...s,
      className: c.name,
      classGrade: c.grade,
      classId: c.id,
    }))
  );

  const filteredStudents = allStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase());
    const matchesClass = filterClass === 'all' || student.classId === filterClass;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'voted' && student.hasVoted) ||
      (filterStatus === 'not-voted' && !student.hasVoted);
    return matchesSearch && matchesClass && matchesStatus;
  });

  const totalStudents = allStudents.length;
  const votedStudents = allStudents.filter((s) => s.hasVoted).length;

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground">All Students</h1>
        <p className="text-muted-foreground mt-1">
          {votedStudents} of {totalStudents} students have voted ({totalStudents > 0 ? Math.round((votedStudents / totalStudents) * 100) : 0}%)
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl p-4 shadow-card mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="h-12 rounded-xl border border-input bg-card px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="h-12 rounded-xl border border-input bg-card px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="voted">Voted</option>
            <option value="not-voted">Not Voted</option>
          </select>
        </div>
      </motion.div>

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl shadow-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-5 py-4 text-sm font-semibold text-foreground">Student</th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-foreground">Class</th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-foreground">Grade</th>
                <th className="text-center px-5 py-4 text-sm font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <motion.tr
                  key={`${student.classId}-${student.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                          student.hasVoted ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {student.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <span className="font-medium text-foreground">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{student.className}</td>
                  <td className="px-5 py-4 text-muted-foreground">{student.classGrade}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      {student.hasVoted ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/20 text-success text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Voted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-muted-foreground text-sm font-medium">
                          <Circle className="w-4 h-4" />
                          Pending
                        </span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No students found</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
