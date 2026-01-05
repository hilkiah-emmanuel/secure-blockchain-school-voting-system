import { motion } from 'framer-motion';
import { Trophy, Star, Award, Target, Users, CheckCircle2 } from 'lucide-react';

interface AchievementBadgeProps {
  type: 'first-vote' | '100-participation' | 'all-voted' | 'election-complete' | 'perfect-turnout';
  title: string;
  description: string;
  onClose?: () => void;
}

const iconMap = {
  'first-vote': Star,
  '100-participation': Trophy,
  'all-voted': Users,
  'election-complete': Award,
  'perfect-turnout': Target,
};

const colorMap = {
  'first-vote': 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  '100-participation': 'bg-primary/20 text-primary',
  'all-voted': 'bg-green-500/20 text-green-600 dark:text-green-400',
  'election-complete': 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  'perfect-turnout': 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
};

export function AchievementBadge({ type, title, description, onClose }: AchievementBadgeProps) {
  const Icon = iconMap[type];
  const colorClass = colorMap[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
    >
      <div className={`${colorClass} rounded-2xl p-6 shadow-elevated border-2 border-current/20 backdrop-blur-xl max-w-md`}>
        <div className="flex items-start gap-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 2 }}
            className={`p-3 rounded-xl ${colorClass}`}
          >
            <Icon className="w-8 h-8" />
          </motion.div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm opacity-90">{description}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-current/60 hover:text-current transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}








