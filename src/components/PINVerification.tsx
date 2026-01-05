import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PINVerificationProps {
  studentId: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function PINVerification({ studentId, onVerified, onCancel }: PINVerificationProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!pin || pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const { studentsAPI } = await import('@/lib/api');
      const result = await studentsAPI.verifyPin(studentId, pin);
      
      if (result.verified) {
        onVerified();
      } else {
        setError('Invalid PIN. Please try again.');
        setPin('');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            PIN Verification Required
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Please enter your PIN to verify your identity before voting.
          </p>
          
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              autoFocus
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onCancel}
              disabled={isVerifying}
            >
              <X className="w-4 h-4 mr-1.5" />
              Cancel
            </Button>
            <Button
              variant="hero"
              className="flex-1"
              onClick={handleVerify}
              disabled={isVerifying || !pin}
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}









