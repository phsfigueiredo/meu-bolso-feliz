import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, LogOut, Mail, Eye, EyeOff, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { storage } from '@/lib/storage';
import { fetchAndDecryptSeed } from '@/lib/crypto';
import type { Session } from '@supabase/supabase-js';

interface Props {
  children: React.ReactNode;
}

const SupabaseAuthGate = ({ children }: Props) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    try {
      const fn = mode === 'signup' ? supabase.auth.signUp : supabase.auth.signInWithPassword;
      const { error } = await fn.call(supabase.auth, { email, password });
      if (error) throw error;
      if (mode === 'signup') {
        toast({
          title: 'Conta criada',
          description: 'Se a confirmação por email estiver ativa, verifique sua caixa de entrada.',
        });
      }
    } catch (err) {
      toast({
        title: mode === 'signup' ? 'Falha ao criar conta' : 'Falha ao entrar',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
  };

  const handleImportSeed = async () => {
    const seedPassword = window.prompt('Senha do seed criptografado (a antiga senha do app):');
    if (!seedPassword) return;
    setBusy(true);
    try {
      const decrypted = await fetchAndDecryptSeed(seedPassword);
      const result = await storage.importFromSeed(decrypted);
      if (result.imported) {
        toast({
          title: 'Seed importado',
          description: `${result.profiles} perfis, ${result.expenses} despesas, ${result.incomes} rendas.`,
        });
        // reload para o useFinances buscar do Supabase
        window.location.reload();
      } else {
        toast({
          title: 'Nada importado',
          description: 'Sua conta já tem dados no Supabase — o seed não sobrescreve.',
        });
      }
    } catch (err) {
      toast({
        title: 'Falha ao importar',
        description: err instanceof Error && err.message === 'wrong-password'
          ? 'Senha do seed incorreta.'
          : err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">
              {mode === 'signup' ? 'Criar conta' : 'Entrar'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {mode === 'signup'
                ? 'Crie sua conta para começar. Dados são isolados por usuário.'
                : 'Acesse suas finanças na nuvem'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                  disabled={busy}
                />
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                  minLength={6}
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
              className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === 'signup'
                ? 'Já tenho conta — entrar'
                : 'Não tenho conta — criar uma'}
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button
          onClick={handleImportSeed}
          disabled={busy}
          className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors disabled:opacity-50"
          title="Importar seed criptografado (se conta estiver vazia)"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={handleLogout}
          className="p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full transition-colors"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
      {children}
    </div>
  );
};

export default SupabaseAuthGate;
