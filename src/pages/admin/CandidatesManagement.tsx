import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Users, Vote, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useVotingStore } from '@/lib/votingStore';
import { toast } from 'sonner';

interface Candidate {
  id: string;
  name: string;
  positionId: string;
  positionTitle?: string;
  photoUrl?: string;
  profile?: string;
  manifesto?: string;
  motto?: string;
}

export const CandidatesManagement = () => {
  const { elections, positions, classes, addCandidate, updateCandidate, deleteCandidate, currentUser } = useVotingStore();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [editingApproved, setEditingApproved] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    photoUrl: '',
    profile: '',
    manifesto: '',
    motto: '',
  });

  // Get all candidates from all positions
  const allCandidates: Candidate[] = positions.flatMap(position =>
    position.candidates.map(candidate => ({
      ...candidate,
      positionId: position.id,
      positionTitle: position.title,
    }))
  );

  const filteredCandidates = allCandidates.filter(candidate =>
    candidate.name.toLowerCase().includes(search.toLowerCase()) ||
    candidate.positionTitle?.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ name: '', photoUrl: '', profile: '', manifesto: '', motto: '' });
    setSelectedPosition('');
    setEditingCandidate(null);
  };

  const handleCreate = () => {
    if (!formData.name.trim() || !selectedPosition) {
      toast.error('Please fill in name and select position');
      return;
    }
    (async () => {
      try {
        const payload: any = {
          name: formData.name,
          photoUrl: formData.photoUrl || undefined,
          profile: formData.profile || undefined,
          manifesto: formData.manifesto || undefined,
          motto: formData.motto || undefined,
        };
        // If teacher is adding, include class association
        if (currentUser && !currentUser.isAdmin && selectedClass) {
          payload.classId = selectedClass;
        }

        await (await import('@/lib/votingStore')).useVotingStore.getState().addCandidateRemote(selectedPosition, payload);
        toast.success('Candidate added successfully');
        setShowCreateModal(false);
        resetForm();
      } catch (err) {
        console.error('Failed to add candidate remote', err);
        toast.error('Failed to add candidate');
      }
    })();
  };

  const handleUpdate = () => {
    if (!editingCandidate) return;
    if (!formData.name.trim()) {
      toast.error('Please fill in name');
      return;
    }

    (async () => {
      try {
        const payload: any = {
          name: formData.name,
          photoUrl: formData.photoUrl || undefined,
          profile: formData.profile || undefined,
          manifesto: formData.manifesto || undefined,
          motto: formData.motto || undefined,
        };
        // If admin, allow updating approval and class
        if (currentUser && currentUser.isAdmin) {
          payload.approved = editingApproved ? 1 : 0;
          // allow admin to change class association via selectedClass state if set
          if (selectedClass) payload.classId = selectedClass;
        }

        await (await import('@/lib/votingStore')).useVotingStore.getState().updateCandidateRemote(editingCandidate.id, payload);
        toast.success('Candidate updated');
        setEditingCandidate(null);
        resetForm();
      } catch (err) {
        console.error('Failed to update candidate remote', err);
        toast.error('Failed to update candidate');
      }
    })();
  };

  const handleDelete = (positionId: string, candidateId: string) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    (async () => {
      try {
        await (await import('@/lib/votingStore')).useVotingStore.getState().deleteCandidateRemote(positionId, candidateId);
        toast.success('Candidate deleted');
      } catch (err) {
        console.error('Delete candidate failed', err);
        toast.error('Failed to delete candidate');
      }
    })();
  };

  const openEditModal = (candidate: Candidate) => {
    setFormData({
      name: candidate.name,
      photoUrl: candidate.photoUrl || '',
      profile: candidate.profile || '',
      manifesto: candidate.manifesto || '',
      motto: candidate.motto || '',
    });
    setSelectedPosition(candidate.positionId);
    setEditingCandidate(candidate);
    setSelectedClass((candidate as any).classId || '');
    setEditingApproved(((candidate as any).approved || 0) === 1);
  };

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Candidates Management</h1>
          <p className="text-muted-foreground mt-1">Manage candidates for election positions</p>
        </div>
        <Button variant="hero" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-5 h-5 mr-1.5" />
          New Candidate
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl p-4 shadow-card mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search candidates or positions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Candidates List */}
      <div className="space-y-4">
        {elections.map((election) => (
          <motion.div
            key={election.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-5 shadow-card"
          >
            <div className="flex items-center gap-2 mb-4">
              <Vote className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{election.name}</h2>
            </div>

            {election.positions.map((position) => {
              const positionCandidates = filteredCandidates.filter(
                c => c.positionId === position.id
              );

              if (positionCandidates.length === 0 && search) return null;

              return (
                <div key={position.id} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {position.title}
                  </h3>
                  <div className="grid gap-3">
                    {positionCandidates.map((candidate, index) => (
                      <motion.div
                        key={candidate.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground">{position.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(candidate)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(position.id, candidate.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ))}

        {filteredCandidates.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              {search ? 'No candidates found' : 'No candidates yet'}
            </p>
            <Button variant="hero" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5 mr-1.5" />
              Add Your First Candidate
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingCandidate) && (
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
                  {editingCandidate ? 'Edit Candidate' : 'New Candidate'}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Position</label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    disabled={!!editingCandidate}
                    className="w-full h-12 rounded-xl border border-input bg-card px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring mt-1.5"
                  >
                    <option value="">Select position...</option>
                    {positions.map((position) => (
                      <option key={position.id} value={position.id}>
                        {position.title}
                      </option>
                    ))}
                  </select>
                </div>
                {/* If a teacher is creating a candidate, let them associate it with one of their classes */}
                {currentUser && !currentUser.isAdmin && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Associate with Class</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full h-12 rounded-xl border border-input bg-card px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring mt-1.5"
                    >
                      <option value="">Select your class (optional)</option>
                      {classes.filter((cl: any) => cl.teacher_id === currentUser.id).map((cl: any) => (
                        <option key={cl.id} value={cl.id}>{cl.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-foreground">Candidate Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Amina Hassan"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Photo URL (Optional)</label>
                  <Input
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    placeholder="https://example.com/photo.jpg"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Profile/Bio (Optional)</label>
                  <Textarea
                    value={formData.profile}
                    onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                    placeholder="Brief profile or biography of the candidate..."
                    className="mt-1.5 min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Manifesto (Optional)</label>
                  <Textarea
                    value={formData.manifesto}
                    onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
                    placeholder="Candidate's manifesto or campaign statement..."
                    className="mt-1.5 min-h-[120px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Motto (Optional)</label>
                  <Input
                    value={formData.motto}
                    onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                    placeholder="Short motto or slogan..."
                    className="mt-1.5"
                  />
                </div>
                {editingCandidate && currentUser && currentUser.isAdmin && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Approved</label>
                    <div className="mt-2 flex items-center gap-3">
                      <input type="checkbox" checked={editingApproved} onChange={(e) => setEditingApproved(e.target.checked)} />
                      <span className="text-sm text-muted-foreground">Mark candidate as approved (visible to all)</span>
                    </div>
                  </div>
                )}
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
                  onClick={editingCandidate ? handleUpdate : handleCreate}
                >
                  {editingCandidate ? 'Save Changes' : 'Add Candidate'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};






