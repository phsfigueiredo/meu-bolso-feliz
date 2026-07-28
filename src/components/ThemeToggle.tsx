import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita mismatch SSR/CSR (mesmo com Vite, o resolvedTheme só chega no client)
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="h-8 w-8" aria-hidden />;
  }

  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark';
  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="h-8 w-8"
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
