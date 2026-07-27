import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { fetchAndDecryptSeed } from '@/lib/crypto';
import { initFromDecryptedSeed } from '@/lib/localStorage';

const AUTH_KEY = 'finance_app_authenticated';

interface PasswordGateProps {
  children: React.ReactNode;
}

const PasswordGate = ({ children }: PasswordGateProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const authenticated = localStorage.getItem(AUTH_KEY);
    if (authenticated === 'true') setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isChecking) return;
    setIsChecking(true);
    try {
      const decrypted = await fetchAndDecryptSeed(password);
      const result = await initFromDecryptedSeed(decrypted);
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      toast({
        title: 'Bem-vindo!',
        description:
          result === 'seeded'
            ? 'Base carregada a partir do seed criptografado.'
            : 'Acesso liberado — usando dados já salvos no navegador.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({
        title: msg === 'wrong-password' ? 'Senha incorreta' : 'Falha ao desbloquear',
        description: msg === 'wrong-password'
          ? 'Não foi possível descriptografar a base. Verifique a senha.'
          : msg,
        variant: 'destructive',
      });
      setPassword('');
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setPassword('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Área Protegida</CardTitle>
            <p className="text-sm text-muted-foreground">
              Digite a senha para descriptografar e acessar os dados
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite a senha..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  autoFocus
                  disabled={isChecking}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button type="submit" className="w-full" disabled={isChecking}>
                {isChecking ? 'Verificando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleLogout}
        className="fixed bottom-4 right-4 z-50 p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full transition-colors"
        title="Sair"
      >
        <Lock className="w-4 h-4" />
      </button>
      {children}
    </div>
  );
};

export default PasswordGate;
