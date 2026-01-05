import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockClasses, mockPositions, mockResults, mockElections, Class, Position, Vote, Election, Candidate, Student } from './mockData';
import { classesAPI, studentsAPI, electionsAPI } from './api';

interface VotingState {
  currentUser: { id?: string; email: string; name: string; isAdmin: boolean } | null;
  classes: Class[];
  positions: Position[];
  elections: Election[];
  results: Record<string, Record<string, number>>;
  currentStudentId: string | null;
  votes: Vote[];
  
  // Auth
  login: (email: string, password: string) => boolean;
  logout: () => void;
  loadFromServer: () => Promise<void>;
  
  // Voting
  setCurrentStudent: (studentId: string | null) => void;
  submitVote: (positionId: string, candidateId: string) => void;
  markStudentVoted: (classId: string, studentId: string) => void;
  clearVotes: () => void;
  
  // Admin - Elections
  createElection: (election: Omit<Election, 'id'>) => void;
  updateElection: (id: string, updates: Partial<Election>) => void;
  deleteElection: (id: string) => void;
  
  // Admin - Positions
  addPosition: (electionId: string, position: Omit<Position, 'id'>) => void;
  updatePosition: (electionId: string, positionId: string, updates: Partial<Position>) => void;
  deletePosition: (electionId: string, positionId: string) => void;
  
  // Admin - Candidates
  addCandidate: (positionId: string, candidate: Omit<Candidate, 'id'>) => void;
  updateCandidate: (positionId: string, candidateId: string, updates: Partial<Candidate>) => void;
  deleteCandidate: (positionId: string, candidateId: string) => void;
  // Remote candidate update
  updateCandidateRemote: (candidateId: string, data: Partial<Candidate & { approved?: number; classId?: string }>) => Promise<void>;
  
  // Admin - Classes
  addClass: (classData: Omit<Class, 'id'>) => void;
  updateClass: (id: string, updates: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  toggleVoting: (classId: string) => void;
  
  // Admin - Students
  addStudent: (classId: string, student: Omit<Student, 'id' | 'hasVoted'>) => void;
  addStudents: (classId: string, students: Omit<Student, 'id' | 'hasVoted'>[]) => void;
  updateStudent: (classId: string, studentId: string, updates: Partial<Student>) => void;
  deleteStudent: (classId: string, studentId: string) => void;
  resetStudentVotes: (classId: string) => void;
  // Remote operations (call backend)
  addStudentRemote: (classId: string, name: string, pin?: string) => Promise<void>;
  bulkAddStudentsRemote: (classId: string, students: Array<{ name: string }>) => Promise<void>;
  deleteStudentRemote: (classId: string, studentId: string) => Promise<void>;
  resetStudentVotesRemote: (classId: string) => Promise<void>;
  toggleVotingRemote: (classId: string) => Promise<void>;
  addCandidateRemote: (positionId: string, data: Partial<Candidate>) => Promise<void>;
  // Remote positions and candidate operations
  addPositionRemote: (electionId: string, data: { title: string; type?: string }) => Promise<any>;
  updatePositionRemote: (positionId: string, data: { title?: string; type?: string }) => Promise<void>;
  deletePositionRemote: (electionId: string, positionId: string) => Promise<void>;
  deleteCandidateRemote: (positionId: string, candidateId: string) => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useVotingStore = create<VotingState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      classes: mockClasses,
      positions: mockPositions,
      elections: mockElections,
      results: mockResults,
      currentStudentId: null,
      votes: [],

      login: (email: string, password: string) => {
        if (email && password.length >= 4) {
          const isAdmin = email.toLowerCase().includes('admin');
          set({ 
            currentUser: { 
              email, 
              name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              isAdmin
            } 
          });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ currentUser: null, currentStudentId: null, votes: [] });
      },

      setCurrentStudent: (studentId: string | null) => {
        set({ currentStudentId: studentId, votes: [] });
      },

      submitVote: (positionId: string, candidateId: string) => {
        const vote: Vote = {
          positionId,
          candidateId,
          timestamp: Date.now(),
          hash: `0x${Math.random().toString(16).slice(2, 18)}`,
        };
        
        set((state) => {
          const existingVoteIndex = state.votes.findIndex(v => v.positionId === positionId);
          const newVotes = [...state.votes];
          
          if (existingVoteIndex >= 0) {
            newVotes[existingVoteIndex] = vote;
          } else {
            newVotes.push(vote);
          }
          
          const newResults = { ...state.results };
          if (!newResults[positionId]) {
            newResults[positionId] = {};
          }
          newResults[positionId][candidateId] = (newResults[positionId][candidateId] || 0) + 1;
          
          return { votes: newVotes, results: newResults };
        });
      },

      markStudentVoted: (classId: string, studentId: string) => {
        set((state) => ({
          classes: state.classes.map(c => 
            c.id === classId 
              ? { 
                  ...c, 
                  students: c.students.map(s => 
                    s.id === studentId ? { ...s, hasVoted: true } : s
                  ) 
                }
              : c
          ),
          currentStudentId: null,
          votes: [],
        }));
      },

      clearVotes: () => {
        set({ votes: [] });
      },

      // Load data from server (classes, elections)
      loadFromServer: async () => {
        try {
          const classesRes = await classesAPI.getAll();
          const electionsRes = await electionsAPI.getAll();

          // Normalize classes: API returns { classes }
          const classesFromApi = classesRes.classes || [];

          // Build positions list from elections
          const electionsFromApi = electionsRes.elections || [];
          const positionsList: Position[] = [];
          const currentUser = get().currentUser;

          electionsFromApi.forEach((e: any) => {
            if (e.positions && Array.isArray(e.positions)) {
              e.positions.forEach((p: any) => {
                // Filter candidates: show approved ones to everyone; show pending (approved=0) to admins and to teachers who own the class
                if (p.candidates && Array.isArray(p.candidates)) {
                  p.candidates = p.candidates.filter((c: any) => {
                    if (c.approved === 1 || c.approved === undefined) return true;
                    if (currentUser && currentUser.isAdmin) return true;
                    // allow teacher to see candidates submitted for their class
                    if (c.class_id && Array.isArray(classesFromApi)) {
                      const cls = classesFromApi.find((cl: any) => cl.id === c.class_id);
                      if (cls && currentUser && cls.teacher_id === currentUser.id) return true;
                    }
                    return false;
                  });
                }
                positionsList.push(p);
              });
            }
          });

          set({
            classes: classesFromApi,
            elections: electionsFromApi,
            positions: positionsList,
          });
        } catch (error) {
          console.warn('Failed to load from server:', error);
        }
      },

      // Remote student operations
      addStudentRemote: async (classId: string, name: string, pin?: string) => {
        const res: any = await studentsAPI.add(classId, name, pin);
        // res returns { id, name, hasVoted }
        set((state) => ({
          classes: state.classes.map(c => c.id === classId ? { ...c, students: [...c.students, { id: (res as any).id, name: (res as any).name, hasVoted: false }] } : c)
        }));
      },

      bulkAddStudentsRemote: async (classId: string, students: Array<{ name: string }>) => {
        const res: any = await studentsAPI.bulkAdd(classId, students);
        const added: any[] = (res && res.students) || [];
        set((state) => ({
          classes: state.classes.map(c => c.id === classId ? { ...c, students: [...c.students, ...added.map((s: any) => ({ id: s.id, name: s.name, hasVoted: s.hasVoted }))] } : c)
        }));
      },

      deleteStudentRemote: async (classId: string, studentId: string) => {
        await studentsAPI.delete(studentId);
        set((state) => ({
          classes: state.classes.map(c => c.id === classId ? { ...c, students: c.students.filter(s => s.id !== studentId) } : c)
        }));
      },

      resetStudentVotesRemote: async (classId: string) => {
        await studentsAPI.resetVotes(classId);
        set((state) => ({
          classes: state.classes.map(c => c.id === classId ? { ...c, students: c.students.map(s => ({ ...s, hasVoted: false })) } : c)
        }));
      },

      toggleVotingRemote: async (classId: string) => {
        try {
          const res = await classesAPI.toggleVoting(classId);
          set((state) => ({
            classes: state.classes.map(c => c.id === classId ? { ...c, votingOpen: !!res.votingOpen } : c)
          }));
        } catch (error) {
          console.error('Toggle voting failed', error);
        }
      },

      // Remote candidate operations
      addCandidateRemote: async (positionId: string, data: Partial<Candidate>) => {
        const res = await (electionsAPI as any).addCandidate(positionId, data);

        // Update local store
        set((state) => ({
          positions: state.positions.map(p => p.id === positionId ? { ...p, candidates: [...p.candidates, res] } : p),
          elections: state.elections.map(e => ({
            ...e,
            positions: e.positions.map((p: any) => p.id === positionId ? { ...p, candidates: [...p.candidates, res] } : p)
          }))
        }));
      },

      updateCandidateRemote: async (candidateId: string, data: Partial<Candidate & { approved?: number; classId?: string }>) => {
        await (electionsAPI as any).updateCandidate(candidateId, data);
        // update local store
        set((state) => ({
          positions: state.positions.map(p => ({
            ...p,
            candidates: p.candidates.map(c => c.id === candidateId ? { ...c, ...data } : c)
          })),
          elections: state.elections.map(e => ({
            ...e,
            positions: e.positions.map((p: any) => ({
              ...p,
              candidates: p.candidates.map((c: any) => c.id === candidateId ? { ...c, ...data } : c)
            }))
          }))
        }));
      },

      // Remote position operations
      addPositionRemote: async (electionId: string, data: { title: string; type?: string }) => {
        const resRaw = await (electionsAPI as any).addPosition(electionId, data);
        const res = { ...resRaw, type: (resRaw.type as any) || 'single' };
        // res should be { id, title, type, candidates: [] }
        set((state) => ({
          elections: state.elections.map(e => e.id === electionId ? { ...e, positions: [...e.positions, res] } : e),
          positions: [...state.positions, res],
        }));
        return res;
      },

      updatePositionRemote: async (positionId: string, data: { title?: string; type?: string }) => {
        await (electionsAPI as any).updatePosition(positionId, data);
        set((state) => ({
          positions: state.positions.map(p => p.id === positionId ? { ...p, type: (data.type as any) || p.type, ...data } : p),
          elections: state.elections.map(e => ({
            ...e,
            positions: e.positions.map((p: any) => p.id === positionId ? { ...p, type: (data.type as any) || p.type, ...data } : p)
          }))
        }));
      },

      deletePositionRemote: async (electionId: string, positionId: string) => {
        await (electionsAPI as any).deletePosition(positionId);
        set((state) => ({
          elections: state.elections.map(e => e.id === electionId ? { ...e, positions: e.positions.filter((p: any) => p.id !== positionId) } : e),
          positions: state.positions.filter(p => p.id !== positionId),
        }));
      },

      // Remote candidate delete
      deleteCandidateRemote: async (positionId: string, candidateId: string) => {
        // Call backend
        await (electionsAPI as any).deleteCandidate(candidateId);
        set((state) => ({
          positions: state.positions.map(p => p.id === positionId ? { ...p, candidates: p.candidates.filter((c: any) => c.id !== candidateId) } : p),
          elections: state.elections.map(e => ({
            ...e,
            positions: e.positions.map((p: any) => p.id === positionId ? { ...p, candidates: p.candidates.filter((c: any) => c.id !== candidateId) } : p)
          }))
        }));
      },

      // Admin - Elections
      createElection: (election) => {
        set((state) => ({
          elections: [...state.elections, { ...election, id: generateId() }],
        }));
      },

      updateElection: (id, updates) => {
        set((state) => ({
          elections: state.elections.map(e => e.id === id ? { ...e, ...updates } : e),
        }));
      },

      deleteElection: (id) => {
        set((state) => ({
          elections: state.elections.filter(e => e.id !== id),
        }));
      },

      // Admin - Positions
      addPosition: (electionId, position) => {
        const newPosition = { ...position, id: generateId() };
        set((state) => ({
          elections: state.elections.map(e => 
            e.id === electionId 
              ? { ...e, positions: [...e.positions, newPosition] }
              : e
          ),
          positions: [...state.positions, newPosition],
        }));
      },

      updatePosition: (electionId, positionId, updates) => {
        set((state) => ({
          elections: state.elections.map(e => 
            e.id === electionId 
              ? { 
                  ...e, 
                  positions: e.positions.map(p => 
                    p.id === positionId ? { ...p, ...updates } : p
                  )
                }
              : e
          ),
          positions: state.positions.map(p => 
            p.id === positionId ? { ...p, ...updates } : p
          ),
        }));
      },

      deletePosition: (electionId, positionId) => {
        set((state) => ({
          elections: state.elections.map(e => 
            e.id === electionId 
              ? { ...e, positions: e.positions.filter(p => p.id !== positionId) }
              : e
          ),
          positions: state.positions.filter(p => p.id !== positionId),
        }));
      },

      // Admin - Candidates
      addCandidate: (positionId, candidate) => {
        const newCandidate = { ...candidate, id: generateId() };
        set((state) => ({
          positions: state.positions.map(p => 
            p.id === positionId 
              ? { ...p, candidates: [...p.candidates, newCandidate] }
              : p
          ),
          elections: state.elections.map(e => ({
            ...e,
            positions: e.positions.map(p => 
              p.id === positionId 
                ? { ...p, candidates: [...p.candidates, newCandidate] }
                : p
            )
          })),
        }));
      },

      updateCandidate: (positionId, candidateId, updates) => {
        set((state) => ({
          positions: state.positions.map(p => 
            p.id === positionId 
              ? { 
                  ...p, 
                  candidates: p.candidates.map(c => 
                    c.id === candidateId ? { ...c, ...updates } : c
                  )
                }
              : p
          ),
          elections: state.elections.map(e => ({
            ...e,
            positions: e.positions.map(p => 
              p.id === positionId 
                ? { 
                    ...p, 
                    candidates: p.candidates.map(c => 
                      c.id === candidateId ? { ...c, ...updates } : c
                    )
                  }
                : p
            )
          })),
        }));
      },

      deleteCandidate: (positionId, candidateId) => {
        set((state) => ({
          positions: state.positions.map(p => 
            p.id === positionId 
              ? { ...p, candidates: p.candidates.filter(c => c.id !== candidateId) }
              : p
          ),
          elections: state.elections.map(e => ({
            ...e,
            positions: e.positions.map(p => 
              p.id === positionId 
                ? { ...p, candidates: p.candidates.filter(c => c.id !== candidateId) }
                : p
            )
          })),
        }));
      },

      // Admin - Classes
      addClass: (classData) => {
        set((state) => ({
          classes: [...state.classes, { ...classData, id: generateId() }],
        }));
      },

      updateClass: (id, updates) => {
        set((state) => ({
          classes: state.classes.map(c => c.id === id ? { ...c, ...updates } : c),
        }));
      },

      deleteClass: (id) => {
        set((state) => ({
          classes: state.classes.filter(c => c.id !== id),
        }));
      },

      toggleVoting: (classId) => {
        set((state) => ({
          classes: state.classes.map(c => 
            c.id === classId ? { ...c, votingOpen: !c.votingOpen } : c
          ),
        }));
      },

      // Admin - Students
      addStudent: (classId, student) => {
        set((state) => ({
          classes: state.classes.map(c => 
            c.id === classId 
              ? { 
                  ...c, 
                  students: [...c.students, { ...student, id: generateId(), hasVoted: false }] 
                }
              : c
          ),
        }));
      },

      addStudents: (classId, students) => {
        set((state) => ({
          classes: state.classes.map(c => 
            c.id === classId 
              ? { 
                  ...c, 
                  students: [
                    ...c.students, 
                    ...students.map(s => ({ ...s, id: generateId(), hasVoted: false }))
                  ] 
                }
              : c
          ),
        }));
      },

      updateStudent: (classId, studentId, updates) => {
        set((state) => ({
          classes: state.classes.map(c => 
            c.id === classId 
              ? { 
                  ...c, 
                  students: c.students.map(s => 
                    s.id === studentId ? { ...s, ...updates } : s
                  ) 
                }
              : c
          ),
        }));
      },

      deleteStudent: (classId, studentId) => {
        set((state) => ({
          classes: state.classes.map(c => 
            c.id === classId 
              ? { ...c, students: c.students.filter(s => s.id !== studentId) }
              : c
          ),
        }));
      },

      resetStudentVotes: (classId) => {
        set((state) => ({
          classes: state.classes.map(c => 
            c.id === classId 
              ? { ...c, students: c.students.map(s => ({ ...s, hasVoted: false })) }
              : c
          ),
        }));
      },
    }),
    {
      name: 'voting-storage',
    }
  )
);
