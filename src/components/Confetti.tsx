import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ConfettiProps {
  onComplete?: () => void;
}

export function Confetti({ onComplete }: ConfettiProps) {
  const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#FF2D55'];
  const confettiCount = 50;

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: confettiCount }).map((_, i) => {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 1 + Math.random() * 2;
        const rotation = Math.random() * 360;

        return (
          <motion.div
            key={i}
            initial={{
              opacity: 1,
              y: -20,
              x: 0,
              rotate: 0,
            }}
            animate={{
              opacity: [1, 1, 0],
              y: window.innerHeight + 100,
              x: (Math.random() - 0.5) * 200,
              rotate: rotation + 360,
            }}
            transition={{
              duration,
              delay,
              ease: 'easeOut',
            }}
            className="absolute"
            style={{
              left: `${left}%`,
              width: 12,
              height: 12,
              backgroundColor: color,
              borderRadius: '50%',
            }}
          />
        );
      })}
      
      {/* Sparkle icons */}
      {Array.from({ length: 10 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const duration = 1.5 + Math.random();

        return (
          <motion.div
            key={`sparkle-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1.5, 1, 0],
            }}
            transition={{
              duration,
              delay,
              repeat: 1,
            }}
            className="absolute"
            style={{ left: `${left}%`, top: `${Math.random() * 50}%` }}
          >
            <Sparkles className="w-6 h-6 text-primary" />
          </motion.div>
        );
      })}
    </div>
  );
}








