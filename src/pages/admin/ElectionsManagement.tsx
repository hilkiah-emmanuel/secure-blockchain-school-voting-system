import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Users, ChevronRight, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVotingStore } from '@/lib/votingStore';
import { toast } from 'sonner';
import { Election, Position } from '@/lib/mockData';

export const ElectionsManagement = () => {
  const { elections, positions, createElection, updateElection, deleteElection, addPosition, deletePosition, addCandidate, deleteCandidate, addCandidateRemote, currentUser } = useVotingStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingElection, setEditingElection] = useState<Election | null>(null);
  const [expandedElection, setExpandedElection] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'draft' as 'draft' | 'active' | 'completed',
  });

  const [newPosition, setNewPosition] = useState('');
  const [newCandidate, setNewCandidate] = useState<{ positionId: string; name: string } | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [newCandidateForm, setNewCandidateForm] = useState({ name: '', photoUrl: '', profile: '', manifesto: '', motto: '' });

  const resetForm = () => {
    setFormData({ name: '', description: '', startDate: '', endDate: '', status: 'draft' });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter an election name');
      return;
    }
    createElection({
      ...formData,
      positions: [],
    });
    toast.success('Election created successfully');
    setShowCreateModal(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingElection) return;
    updateElection(editingElection.id, formData);
    toast.success('Election updated');
    setEditingElection(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteElection(id);
    toast.success('Election deleted');
  };

  const handleAddPosition = async (electionId: string) => {
    if (!newPosition.trim()) return;
    try {
      await (await import('@/lib/votingStore')).useVotingStore.getState().addPositionRemote(electionId, { title: newPosition, type: 'single' });
      setNewPosition('');
      toast.success('Position added');
    } catch (error) {
      console.error('Add position failed', error);
      toast.error('Failed to add position');
    }
  };

  const handleAddCandidate = () => {
    // legacy handler left empty; use modal-based submit
  };

  const handleSubmitCandidate = async () => {
    if (!newCandidate || !newCandidateForm.name.trim()) return;
    try {
      await addCandidateRemote(newCandidate.positionId, { ...newCandidateForm });
      setNewCandidate(null);
      setNewCandidateForm({ name: '', photoUrl: '', profile: '', manifesto: '', motto: '' });
      setShowCandidateModal(false);
      toast.success('Candidate added');
    } catch (error) {
      console.error('Add candidate failed', error);
      toast.error('Failed to add candidate');
    }
  };

  const openEditModal = (election: Election) => {
    setFormData({
      name: election.name,
      description: election.description,
      startDate: election.startDate,
      endDate: election.endDate,
      status: election.status,
    });
    setEditingElection(election);
  };

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Elections</h1>
          <p className="text-muted-foreground mt-1">Create and manage elections</p>
        </div>
        {currentUser && currentUser.isAdmin && (
          <Button variant="hero" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5 mr-1.5" />
            New Election
          </Button>
        )}
      </motion.div>

      {/* Elections List */}
      <div className="space-y-4">
        {elections.map((election, index) => (
          <motion.div
            key={election.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-2xl shadow-card overflow-hidden"
          >
            {/* Election Header */}
            <div 
              className="p-5 cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => setExpandedElection(expandedElection === election.id ? null : election.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{election.name}</h3>
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
                  <p className="text-sm text-muted-foreground mb-3">{election.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {election.startDate} - {election.endDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {election.positions.length} positions
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); openEditModal(election); }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); handleDelete(election.id); }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedElection === election.id ? 'rotate-90' : ''}`} />
                </div>
              </div>
            </div>

            {/* Expanded Positions */}
            <AnimatePresence>
              {expandedElection === election.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border"
                >
                  <div className="p-5 space-y-4">
                    {currentUser && currentUser.isAdmin ? (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Add new position (e.g., President)"
                          value={newPosition}
                          onChange={(e) => setNewPosition(e.target.value)}
                          className="flex-1"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddPosition(election.id)}
                        />
                        <Button onClick={() => handleAddPosition(election.id)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Only admins can add positions.</p>
                    )}

                    {election.positions.map((position) => (
                      <div key={position.id} className="bg-secondary/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-foreground">{position.title}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (!confirm('Delete position and its candidates?')) return;
                              try {
                                await (await import('@/lib/votingStore')).useVotingStore.getState().deletePositionRemote(election.id, position.id);
                                toast.success('Position deleted');
                              } catch (err) {
                                console.error('Delete position failed', err);
                                toast.error('Failed to delete position');
                              }
                            }}
                            className="text-destructive hover:text-destructive h-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Candidates */}
                        <div className="space-y-2 mb-3">
                          {position.candidates.map((candidate) => (
                            <div key={candidate.id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2">
                              <span className="text-sm text-foreground">{candidate.name}</span>
                                <div className="flex items-center gap-2">
                                  {candidate.motto && <span className="text-xs text-muted-foreground italic">"{candidate.motto}"</span>}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteCandidate(position.id, candidate.id)}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Candidate */}
                        {newCandidate?.positionId === position.id ? (
                          <div className="flex items-center gap-2">
                            <Button size="sm" onClick={() => setShowCandidateModal(true)}>Add Candidate Details</Button>
                            <Button size="sm" variant="ghost" onClick={() => setNewCandidate(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNewCandidate({ positionId: position.id, name: '' })}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Add Candidate
                          </Button>
                        )}
                      </div>
                    ))}

                    {election.positions.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No positions yet. Add one above.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {elections.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No elections created yet</p>
            <Button variant="hero" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5 mr-1.5" />
              Create Your First Election
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingElection) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowCreateModal(false); setEditingElection(null); resetForm(); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 w-full max-w-md shadow-elevated"
            >
              <h2 className="text-xl font-bold text-foreground mb-6">
                {editingElection ? 'Edit Election' : 'New Election'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Fall 2024 Student Council"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Annual student council elections"
                    className="mt-1.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Start Date</label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">End Date</label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1.5 w-full h-12 rounded-xl border border-input bg-card px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => { setShowCreateModal(false); setEditingElection(null); resetForm(); }}
                >
                  Cancel
                </Button>
                <Button
                  variant="hero"
                  className="flex-1"
                  onClick={editingElection ? handleUpdate : handleCreate}
                >
                  {editingElection ? 'Save Changes' : 'Create Election'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Candidate Details Modal */}
      <AnimatePresence>
        {showCandidateModal && newCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCandidateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-elevated"
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Add Candidate</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <Input value={newCandidateForm.name} onChange={(e) => setNewCandidateForm({ ...newCandidateForm, name: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Motto</label>
                  <Input value={newCandidateForm.motto} onChange={(e) => setNewCandidateForm({ ...newCandidateForm, motto: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Photo URL</label>
                  <Input value={newCandidateForm.photoUrl} onChange={(e) => setNewCandidateForm({ ...newCandidateForm, photoUrl: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Profile</label>
                  <Input value={newCandidateForm.profile} onChange={(e) => setNewCandidateForm({ ...newCandidateForm, profile: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Manifesto</label>
                  <Input value={newCandidateForm.manifesto} onChange={(e) => setNewCandidateForm({ ...newCandidateForm, manifesto: e.target.value })} className="mt-1.5" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="secondary" className="flex-1" onClick={() => setShowCandidateModal(false)}>Cancel</Button>
                <Button variant="hero" className="flex-1" onClick={handleSubmitCandidate}>Add Candidate</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
