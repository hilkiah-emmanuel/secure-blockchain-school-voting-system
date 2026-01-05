import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Users, Upload, Download, 
  ChevronRight, ToggleLeft, ToggleRight, X, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVotingStore } from '@/lib/votingStore';
import { parseCSV, generateSampleCSV } from '@/lib/csvParser';
import { toast } from 'sonner';
import { Class } from '@/lib/mockData';

export const ClassesManagement = () => {
  const { 
    classes, 
    addClass, 
    updateClass, 
    deleteClass, 
    toggleVoting,
    addStudent,
    addStudents,
    deleteStudent,
    resetStudentVotes,
    // remote ops
    addStudentRemote,
    bulkAddStudentsRemote,
    deleteStudentRemote,
    resetStudentVotesRemote,
    toggleVotingRemote
  } = useVotingStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    grade: '',
  });

  const resetForm = () => {
    setFormData({ name: '', grade: '' });
  };

  const handleCreate = () => {
    if (!formData.name.trim() || !formData.grade.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    addClass({
      ...formData,
      students: [],
      votingOpen: false,
    });
    toast.success('Class created successfully');
    setShowCreateModal(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingClass) return;
    updateClass(editingClass.id, formData);
    toast.success('Class updated');
    setEditingClass(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteClass(id);
    toast.success('Class deleted');
  };

  const handleAddStudent = async (classId: string) => {
    if (!newStudentName.trim()) return;
    try {
      await addStudentRemote(classId, newStudentName);
      setNewStudentName('');
      toast.success('Student added');
    } catch (error) {
      console.error('Add student failed', error);
      toast.error('Failed to add student');
    }
  };

  const handleFileUpload = (classId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const parsedStudents = parseCSV(text);
      
      if (parsedStudents.length === 0) {
        toast.error('No valid students found in CSV');
        return;
      }

      try {
        await bulkAddStudentsRemote(classId, parsedStudents);
        toast.success(`${parsedStudents.length} students imported`);
        setShowImportModal(null);
      } catch (error) {
        console.error('Bulk add failed', error);
        toast.error('Failed to import students');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
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

  const openEditModal = (classItem: Class) => {
    setFormData({
      name: classItem.name,
      grade: classItem.grade,
    });
    setEditingClass(classItem);
  };

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Classes</h1>
          <p className="text-muted-foreground mt-1">Manage class rosters and voting</p>
        </div>
        <Button variant="hero" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-5 h-5 mr-1.5" />
          New Class
        </Button>
      </motion.div>

      {/* Classes List */}
      <div className="space-y-4">
        {classes.map((classItem, index) => {
          const voted = classItem.students.filter(s => s.hasVoted).length;
          const total = classItem.students.length;
          const percentage = total > 0 ? Math.round((voted / total) * 100) : 0;

          return (
            <motion.div
              key={classItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl shadow-card overflow-hidden"
            >
              {/* Class Header */}
              <div 
                className="p-5 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => setExpandedClass(expandedClass === classItem.id ? null : classItem.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{classItem.name}</h3>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {classItem.grade}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {total} students
                      </span>
                      <span>{voted}/{total} voted ({percentage}%)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={classItem.votingOpen ? "success" : "secondary"}
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); toggleVotingRemote(classItem.id); }}
                      className="gap-1.5"
                    >
                      {classItem.votingOpen ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Voting Open
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Voting Closed
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); openEditModal(classItem); }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); handleDelete(classItem.id); }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedClass === classItem.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full rounded-full ${percentage === 100 ? 'bg-success' : 'bg-primary'}`}
                  />
                </div>
              </div>

              {/* Expanded Students */}
              <AnimatePresence>
                {expandedClass === classItem.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-5 space-y-4">
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowImportModal(classItem.id)}
                        >
                          <Upload className="w-4 h-4 mr-1.5" />
                          Import CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => { try { await resetStudentVotesRemote(classItem.id); toast.success('Votes reset'); } catch (err) { console.error(err); toast.error('Failed to reset votes'); } }}
                        >
                          <RefreshCw className="w-4 h-4 mr-1.5" />
                          Reset Votes
                        </Button>
                      </div>

                      {/* Add Student */}
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Add new student name"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          className="flex-1"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddStudent(classItem.id)}
                        />
                        <Button onClick={() => handleAddStudent(classItem.id)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Student List */}
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {classItem.students.map((student) => (
                          <div 
                            key={student.id} 
                            className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                              student.hasVoted ? 'bg-success/10' : 'bg-secondary/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                student.hasVoted ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary'
                              }`}>
                                {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <span className={`font-medium ${student.hasVoted ? 'text-success' : 'text-foreground'}`}>
                                {student.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {student.hasVoted && (
                                <span className="text-xs text-success font-medium">Voted</span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => { try { await deleteStudentRemote(classItem.id, student.id); toast.success('Student deleted'); } catch (err) { console.error(err); toast.error('Failed to delete student'); } }}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {classItem.students.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          No students yet. Add them above or import from CSV.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {classes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No classes created yet</p>
            <Button variant="hero" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5 mr-1.5" />
              Create Your First Class
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingClass) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowCreateModal(false); setEditingClass(null); resetForm(); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 w-full max-w-md shadow-elevated"
            >
              <h2 className="text-xl font-bold text-foreground mb-6">
                {editingClass ? 'Edit Class' : 'New Class'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Class Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Homeroom 101"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Grade</label>
                  <Input
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="10th Grade"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => { setShowCreateModal(false); setEditingClass(null); resetForm(); }}
                >
                  Cancel
                </Button>
                <Button
                  variant="hero"
                  className="flex-1"
                  onClick={editingClass ? handleUpdate : handleCreate}
                >
                  {editingClass ? 'Save Changes' : 'Create Class'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import CSV Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowImportModal(null)}
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
                  onChange={(e) => handleFileUpload(showImportModal, e)}
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
                  onClick={() => setShowImportModal(null)}
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
