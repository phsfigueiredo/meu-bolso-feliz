import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Folder, Plus, Trash2, Pencil, X, Check } from 'lucide-react';
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

interface DebtGroupManagerProps {
  groups: string[];
  onAddGroup: (name: string) => void;
  onEditGroup: (oldName: string, newName: string) => void;
  onDeleteGroup: (name: string) => void;
  expenseCountByGroup: Record<string, number>;
}

export function DebtGroupManager({ 
  groups, 
  onAddGroup, 
  onEditGroup, 
  onDeleteGroup,
  expenseCountByGroup 
}: DebtGroupManagerProps) {
  const [open, setOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');

  const handleAddGroup = () => {
    if (newGroupName.trim() && !groups.includes(newGroupName.trim())) {
      onAddGroup(newGroupName.trim());
      setNewGroupName('');
    }
  };

  const handleStartEdit = (group: string) => {
    setEditingGroup(group);
    setEditedName(group);
  };

  const handleSaveEdit = () => {
    if (editingGroup && editedName.trim() && editedName !== editingGroup) {
      onEditGroup(editingGroup, editedName.trim());
    }
    setEditingGroup(null);
    setEditedName('');
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditedName('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Folder className="h-4 w-4" />
          Gerenciar Grupos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Grupos de Dívidas
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add new group */}
          <div className="flex gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nome do novo grupo..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
            />
            <Button onClick={handleAddGroup} size="icon" disabled={!newGroupName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Groups list */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Grupos existentes</Label>
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum grupo criado ainda
              </p>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <div 
                    key={group} 
                    className="flex items-center gap-2 p-3 rounded-lg border bg-card"
                  >
                    {editingGroup === group ? (
                      <>
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={handleSaveEdit}
                          className="h-8 w-8 text-success"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={handleCancelEdit}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Folder className="h-4 w-4 text-primary shrink-0" />
                        <span className="flex-1 font-medium truncate">{group}</span>
                        <Badge variant="secondary" className="shrink-0">
                          {expenseCountByGroup[group] || 0} despesas
                        </Badge>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleStartEdit(group)}
                          className="h-8 w-8 shrink-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-destructive shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir grupo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                As despesas deste grupo não serão excluídas, apenas desagrupadas.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteGroup(group)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}