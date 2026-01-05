import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Users, Mail, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { teachersAPI } from '@/lib/api';

interface Teacher {
  id: string;
  email: string;
  name: string;
  two_factor_enabled: number;
  created_at: number;
}

export const TeachersManagement = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Load teachers
  const loadTeachers = async () => {
    try {
      setLoading(true);
      const response = await teachersAPI.getAll();
      setTeachers(response.teachers || []);
    } catch (error: any) {
      toast.error('Failed to load teachers', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' });
    setEditingTeacher(null);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await teachersAPI.create(formData.name, formData.email, formData.password);
      toast.success('Teacher created successfully');
      setShowCreateModal(false);
      resetForm();
      loadTeachers();
    } catch (error: any) {
      toast.error('Failed to create teacher', {
        description: error.message,
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingTeacher) return;
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in name and email');
      return;
    }

    try {
      await teachersAPI.update(editingTeacher.id, formData.name, formData.email, formData.password || undefined);
      toast.success('Teacher updated');
      setEditingTeacher(null);
      resetForm();
      loadTeachers();
    } catch (error: any) {
      toast.error('Failed to update teacher', {
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    try {
      await teachersAPI.delete(id);
      toast.success('Teacher deleted');
      loadTeachers();
    } catch (error: any) {
      toast.error('Failed to delete teacher', {
        description: error.message,
      });
    }
  };

  const openEditModal = (teacher: Teacher) => {
    setFormData({
      name: teacher.name,
      email: teacher.email,
      password: '',
    });
    setEditingTeacher(teacher);
  };

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teachers Management</h1>
          <p className="text-muted-foreground mt-1">Manage teacher accounts and access</p>
        </div>
        <Button variant="hero" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-5 h-5 mr-1.5" />
          New Teacher
        </Button>
      </motion.div>

      {/* Teachers List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading teachers...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {teachers.map((teacher, index) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-5 shadow-card"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">{teacher.name}</h3>
                      {teacher.email.includes('admin') && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                          Admin
                        </span>
                      )}
                      {teacher.two_factor_enabled === 1 && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-success/20 text-success flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          2FA
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        {teacher.email}
                      </span>
                      <span>
                        Created: {new Date(teacher.created_at * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(teacher)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {!teacher.email.includes('admin') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(teacher.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {teachers.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No teachers found</p>
              <Button variant="hero" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-5 h-5 mr-1.5" />
                Create Your First Teacher
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingTeacher) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowCreateModal(false); resetForm(); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 w-full max-w-md shadow-elevated"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  {editingTeacher ? 'Edit Teacher' : 'New Teacher'}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Mwangi"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="teacher@school.co.tz"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Password {editingTeacher && '(leave blank to keep current)'}
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                >
                  Cancel
                </Button>
                <Button
                  variant="hero"
                  className="flex-1"
                  onClick={editingTeacher ? handleUpdate : handleCreate}
                >
                  {editingTeacher ? 'Save Changes' : 'Create Teacher'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

