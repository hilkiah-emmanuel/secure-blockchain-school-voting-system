import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, CheckCircle2, User, BarChart3, Plus, X, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVotingStore } from '@/lib/votingStore';
import { studentsAPI } from '@/lib/api';
import { parseCSV, generateSampleCSV } from '@/lib/csvParser';
import { toast } from 'sonner';

const ClassRoom = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser, classes, setCurrentStudent, addStudent, addStudents, deleteStudent } = useVotingStore();

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

  const filteredStudents = classItem.students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const votedCount = classItem.students.filter((s) => s.hasVoted).length;

  const handleStudentSelect = (studentId: string) => {
    const student = classItem.students.find((s) => s.id === studentId);
    if (student && !student.hasVoted) {
      setCurrentStudent(studentId);
      navigate(`/vote/${classId}/${studentId}`);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !classId) return;
    
    try {
      await studentsAPI.add(classId, newStudentName);
      addStudent(classId, { name: newStudentName });
      setNewStudentName('');
      toast.success('Student added successfully');
    } catch (error) {
      toast.error('Failed to add student');
      console.error(error);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student?')) return;
    
    try {
      await studentsAPI.delete(studentId);
      deleteStudent(classId!, studentId);
      toast.success('Student removed');
    } catch (error) {
      toast.error('Failed to remove student');
      console.error(error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !classId) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const parsedStudents = parseCSV(text);
      
      if (parsedStudents.length === 0) {
        toast.error('No valid students found in CSV');
        return;
      }

      try {
        await studentsAPI.bulkAdd(classId, parsedStudents);
        addStudents(classId, parsedStudents);
        toast.success(`${parsedStudents.length} students imported`);
        setShowImportModal(false);
      } catch (error) {
        toast.error('Failed to import students');
        console.error(error);
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadSampleCSV = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_students.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const isTeacher = currentUser && !currentUser.isAdmin;

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
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">{classItem.name}</h1>
              <p className="text-sm text-muted-foreground">
                {votedCount} of {classItem.students.length} wanachama wamepiga kura
              </p>
            </div>
            <Button
              variant="glass"
              size="sm"
              onClick={() => navigate(`/results/${classId}`)}
            >
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Results
            </Button>
          </div>

          {/* Search */}
          <div className="pb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Teacher Student Management */}
      {isTeacher && (
        <div className="container px-4 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 shadow-card space-y-3"
          >
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add new student name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
              />
              <Button onClick={handleAddStudent} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <Upload className="w-4 h-4 mr-1.5" />
                Import CSV
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Student List */}
      <main className="container p-4 pb-8">
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredStudents.map((student, index) => (
              <motion.div
                key={student.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
              >
                <button
                  onClick={() => handleStudentSelect(student.id)}
                  disabled={student.hasVoted}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${
                    student.hasVoted
                      ? 'bg-success/10 cursor-default'
                      : 'bg-card hover:bg-secondary active:scale-[0.99] shadow-soft hover:shadow-card'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                      student.hasVoted
                        ? 'bg-success/20 text-success'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {student.hasVoted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      student.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${student.hasVoted ? 'text-success' : 'text-foreground'}`}>
                      {student.name}
                    </p>
                    {student.hasVoted && (
                      <p className="text-sm text-success/80">Vote recorded</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {!student.hasVoted && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    {isTeacher && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStudent(student.id);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredStudents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">No students found</p>
          </motion.div>
        )}
      </main>

      {/* Import CSV Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 w-full max-w-md shadow-elevated"
            >
              <h2 className="text-xl font-bold text-foreground mb-2">Import Students</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Upload a CSV file with student names. One name per line.
              </p>
              
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={downloadSampleCSV}
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Sample CSV
                </Button>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassRoom;
