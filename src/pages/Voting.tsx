import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Shield, User, FileText, Quote, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVotingStore } from '@/lib/votingStore';
import { toast } from 'sonner';
import { votesAPI } from '@/lib/api';
import { Confetti } from '@/components/Confetti';
import { AchievementBadge } from '@/components/AchievementBadge';

const Voting = () => {
  const { classId, studentId } = useParams();
  const navigate = useNavigate();
  const [currentPosition, setCurrentPosition] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [viewingCandidate, setViewingCandidate] = useState<string | null>(null);

  const { currentUser, classes, positions, /* submitVote, */ markStudentVoted, votes } = useVotingStore();

  const classItem = classes.find((c) => c.id === classId);
  const student = classItem?.students.find((s) => s.id === studentId);
  const position = positions[currentPosition];

  useEffect(() => {
    if (!currentUser || !student || student.hasVoted) {
      navigate(classId ? `/class/${classId}` : '/dashboard');
    }
  }, [currentUser, student, classId, navigate]);

  if (!classItem || !student || !position) return null;

  const handleSelect = (candidateId: string) => {
    setSelections((prev) => ({
      ...prev,
      [position.id]: candidateId,
    }));
  };

  const handleNext = () => {
    if (currentPosition < positions.length - 1) {
      setCurrentPosition((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPosition > 0) {
      setCurrentPosition((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(selections).length !== positions.length) {
      toast.error('Please vote for all positions');
      return;
    }

    setIsSubmitting(true);

    // Submit all votes via API (recorded on blockchain by server)
    try {
      for (const [positionId, candidateId] of Object.entries(selections)) {
        await votesAPI.submit({ classId: classId!, studentId: studentId!, positionId, candidateId });
      }

      // Mark student as voted locally
      markStudentVoted(classId!, studentId!);
    } catch (error) {
      console.error('Vote submission failed', error);
      toast.error('Failed to submit vote. Please try again.');
      setIsSubmitting(false);
      return;
    }

    // Show celebration
    setShowConfetti(true);
    setShowAchievement(true);

    toast.success('Vote Recorded!', {
      description: 'Your vote has been securely recorded on the blockchain.',
      icon: <Shield className="w-5 h-5 text-success" />,
      duration: 3000,
    });

    // Navigate after celebration
    setTimeout(() => {
      navigate(`/class/${classId}`);
    }, 2500);
  };

  const isAllVoted = Object.keys(selections).length === positions.length;
  const isLastPosition = currentPosition === positions.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
      {showAchievement && (
        <AchievementBadge
          type="first-vote"
          title="🎉 Vote Submitted!"
          description="Your vote has been securely recorded. Thank you for participating in Tanzania's democratic process!"
          onClose={() => setShowAchievement(false)}
        />
      )}
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
              <h1 className="text-lg font-semibold text-foreground">Cast Your Vote</h1>
              <p className="text-sm text-muted-foreground">{student.name}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-foreground">
                Position {currentPosition + 1} of {positions.length}
              </span>
            </div>
            <div className="flex gap-1.5">
              {positions.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                    idx < currentPosition
                      ? 'bg-success'
                      : idx === currentPosition
                      ? 'bg-primary'
                      : 'bg-secondary'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Voting Area */}
      <main className="flex-1 container p-4 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={position.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">{position.title}</h2>

            <div className="grid gap-3">
              {position.candidates.map((candidate, index) => {
                const isSelected = selections[position.id] === candidate.id;

                return (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <motion.button
                      onClick={() => handleSelect(candidate.id)}
                      className={`relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 w-full ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-glow'
                          : 'bg-card hover:bg-secondary shadow-soft hover:shadow-card active:scale-[0.99]'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold ${
                          isSelected ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {candidate.photoUrl ? (
                          <img 
                            src={candidate.photoUrl} 
                            alt={candidate.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          candidate.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-lg">{candidate.name}</p>
                        {candidate.motto && (
                          <p className={`text-sm mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            "{candidate.motto}"
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {(candidate.profile || candidate.manifesto) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingCandidate(candidate.id);
                            }}
                            className={`h-8 w-8 ${isSelected ? 'text-primary-foreground hover:bg-primary-foreground/20' : ''}`}
                          >
                            <User className="w-4 h-4" />
                          </Button>
                        )}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center"
                            >
                              <Check className="w-5 h-5" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 p-4 pb-safe"
      >
        <div className="container flex items-center gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={handlePrev}
            disabled={currentPosition === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>

          {isLastPosition ? (
            <Button
              variant="success"
              size="lg"
              onClick={handleSubmit}
              disabled={!isAllVoted || isSubmitting}
              className="flex-[2]"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-success-foreground border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-1.5" />
                  Submit Vote
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="hero"
              size="lg"
              onClick={handleNext}
              disabled={!selections[position.id]}
              className="flex-[2]"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Candidate Profile Modal */}
      <AnimatePresence>
        {viewingCandidate && (() => {
          const candidate = position.candidates.find(c => c.id === viewingCandidate);
          if (!candidate) return null;
          
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setViewingCandidate(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-elevated"
              >
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Candidate Profile</h2>
                  <Button variant="ghost" size="icon" onClick={() => setViewingCandidate(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Candidate Header */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold text-primary overflow-hidden">
                      {candidate.photoUrl ? (
                        <img 
                          src={candidate.photoUrl} 
                          alt={candidate.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        candidate.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{candidate.name}</h3>
                      <p className="text-muted-foreground">{position.title}</p>
                      {candidate.motto && (
                        <div className="flex items-center gap-2 mt-2 text-primary">
                          <Quote className="w-4 h-4" />
                          <p className="text-sm italic">"{candidate.motto}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile */}
                  {candidate.profile && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold text-foreground">Profile</h4>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap">{candidate.profile}</p>
                    </div>
                  )}

                  {/* Manifesto */}
                  {candidate.manifesto && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold text-foreground">Manifesto</h4>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap">{candidate.manifesto}</p>
                    </div>
                  )}

                  {!candidate.profile && !candidate.manifesto && (
                    <p className="text-center text-muted-foreground py-8">
                      No additional information available for this candidate.
                    </p>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setViewingCandidate(null)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="hero"
                    className="flex-1"
                    onClick={() => {
                      handleSelect(candidate.id);
                      setViewingCandidate(null);
                    }}
                  >
                    Select This Candidate
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default Voting;
