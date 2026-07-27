import { Save, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SaveButtonProps {
  onSave: () => boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

export function SaveButton({ onSave, isSaving, lastSaved, hasUnsavedChanges }: SaveButtonProps) {
  const handleSave = () => {
    const success = onSave();
    if (success) {
      toast.success('Dados salvos com sucesso!', {
        description: 'Suas alterações foram salvas no navegador.',
      });
    } else {
      toast.error('Erro ao salvar dados', {
        description: 'Não foi possível salvar. Tente novamente.',
      });
    }
  };

  const getLastSavedText = () => {
    if (!lastSaved) return 'Nunca salvo';
    return formatDistanceToNow(lastSaved, { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  return (
    <div className="flex items-center gap-2">
      {hasUnsavedChanges && (
        <span className="hidden sm:inline text-xs text-muted-foreground">
          Alterações não salvas
        </span>
      )}
      
      {lastSaved && !hasUnsavedChanges && (
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="h-3 w-3 text-green-500" />
          <span>Salvo {getLastSavedText()}</span>
        </div>
      )}
      
      <Button
        onClick={handleSave}
        disabled={isSaving || (!hasUnsavedChanges && lastSaved !== null)}
        size="sm"
        variant={hasUnsavedChanges ? "default" : "outline"}
        className="gap-1.5"
      >
        {isSaving ? (
          <>
            <Clock className="h-3.5 w-3.5 animate-spin" />
            <span className="hidden sm:inline">Salvando...</span>
          </>
        ) : (
          <>
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Salvar</span>
          </>
        )}
      </Button>
    </div>
  );
}
