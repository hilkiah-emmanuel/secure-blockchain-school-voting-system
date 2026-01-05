import { Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PrivateModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function PrivateModeToggle({ enabled, onToggle }: PrivateModeToggleProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
      <div className="flex items-center gap-3">
        {enabled ? (
          <EyeOff className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Eye className="w-5 h-5 text-muted-foreground" />
        )}
        <div>
          <Label htmlFor="private-mode" className="text-sm font-medium cursor-pointer">
            Private Mode
          </Label>
          <p className="text-xs text-muted-foreground">
            Hide selections until submission
          </p>
        </div>
      </div>
      <Switch
        id="private-mode"
        checked={enabled}
        onCheckedChange={onToggle}
      />
    </div>
  );
}









