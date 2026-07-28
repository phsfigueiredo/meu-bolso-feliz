import { useState } from 'react';
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ExpenseCategory } from '@/types/finance';

interface CategoryManagerProps {
  categories: ExpenseCategory[];
  onAdd: (cat: ExpenseCategory) => void;
  onUpdate: (oldName: string, patch: Partial<ExpenseCategory>) => void;
  onDelete: (name: string) => void;
}

const PRESET_COLORS = [
  { name: 'Vermelho', value: 'hsl(0 84% 60%)' },
  { name: 'Laranja', value: 'hsl(24 95% 53%)' },
  { name: 'Amarelo', value: 'hsl(48 96% 53%)' },
  { name: 'Verde', value: 'hsl(142 71% 45%)' },
  { name: 'Azul', value: 'hsl(217 91% 60%)' },
  { name: 'Roxo', value: 'hsl(262 83% 58%)' },
  { name: 'Rosa', value: 'hsl(330 81% 60%)' },
  { name: 'Cinza', value: 'hsl(220 9% 46%)' },
];

export function CategoryManager({ categories, onAdd, onUpdate, onDelete }: CategoryManagerProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[3].value);
  const [editing, setEditing] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editing) {
      onUpdate(editing, { name: trimmed, color });
      setEditing(null);
    } else {
      onAdd({ name: trimmed, color });
    }
    setName('');
    setColor(PRESET_COLORS[3].value);
  };

  const startEdit = (cat: ExpenseCategory) => {
    setEditing(cat.name);
    setName(cat.name);
    setColor(cat.color);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 sm:h-9">
          <Tag className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Categorias</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Categorias customizadas</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="cat-name">{editing ? `Editando "${editing}"` : 'Nome da nova categoria'}</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Saúde, Lazer, Pet..."
              maxLength={40}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  aria-label={c.name}
                  title={c.name}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    color === c.value ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={!name.trim()}>
              <Plus className="h-4 w-4 mr-1.5" />
              {editing ? 'Salvar' : 'Adicionar'}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditing(null);
                  setName('');
                  setColor(PRESET_COLORS[3].value);
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>

        {categories.length > 0 && (
          <div className="border-t pt-3 space-y-1">
            <p className="text-xs text-muted-foreground mb-2">Categorias criadas ({categories.length})</p>
            <div className="max-h-56 overflow-y-auto space-y-1">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center gap-2 rounded-md border px-2 py-1.5"
                >
                  <div
                    className="h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm flex-1 truncate">{cat.name}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(cat)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Excluir categoria "${cat.name}"? Despesas associadas ficam sem categoria.`)) {
                        onDelete(cat.name);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
