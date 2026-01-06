import { useState } from 'react';
import { FamilyProfile, profileTypeLabels, profileColors } from '@/types/finance';
import { cn } from '@/lib/utils';
import { Plus, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ProfileSelectorProps {
  profiles: FamilyProfile[];
  selectedProfileId: string | 'all';
  onSelectProfile: (id: string | 'all') => void;
  onAddProfile: (profile: Omit<FamilyProfile, 'id'>) => void;
  onDeleteProfile: (id: string) => void;
}

export function ProfileSelector({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onAddProfile,
  onDeleteProfile,
}: ProfileSelectorProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<FamilyProfile['type']>('outro');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const colorIndex = profiles.length % profileColors.length;
    
    onAddProfile({
      name: name.trim(),
      type,
      color: profileColors[colorIndex],
    });

    setOpen(false);
    setName('');
    setType('outro');
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
      <button
        onClick={() => onSelectProfile('all')}
        className={cn(
          'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0',
          selectedProfileId === 'all'
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
        )}
      >
        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        Todos
      </button>

      {profiles.map((profile) => (
        <div key={profile.id} className="relative group shrink-0">
          <button
            onClick={() => onSelectProfile(profile.id)}
            className={cn(
              'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
              selectedProfileId === profile.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <div 
              className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full" 
              style={{ backgroundColor: profile.color }}
            />
            {profile.name}
          </button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir perfil?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso irá excluir o perfil "{profile.name}" e todas as suas despesas e receitas associadas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDeleteProfile(profile.id)}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-full gap-1 h-7 sm:h-8 px-2.5 sm:px-3 text-xs sm:text-sm shrink-0">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Perfil</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[90vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Perfil</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Maria, João Jr..."
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as FamilyProfile['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(profileTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
