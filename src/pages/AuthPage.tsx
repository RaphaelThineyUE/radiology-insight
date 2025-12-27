import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, Shield, Zap } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isLogin ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (!isLogin) {
      toast({ title: 'Account created', description: 'You can now sign in.' });
      setIsLogin(true);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground">RadiologyExtract Pro</h1>
          <p className="text-primary-foreground/80 mt-2">AI-Powered Radiology Report Analysis</p>
        </div>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <FileText className="w-8 h-8 text-primary-foreground shrink-0" />
            <div><h3 className="font-semibold text-primary-foreground">Smart Extraction</h3><p className="text-primary-foreground/70 text-sm">Extract BI-RADS, findings, and recommendations automatically</p></div>
          </div>
          <div className="flex items-start gap-4">
            <Zap className="w-8 h-8 text-primary-foreground shrink-0" />
            <div><h3 className="font-semibold text-primary-foreground">Instant Analysis</h3><p className="text-primary-foreground/70 text-sm">Get structured data from reports in seconds</p></div>
          </div>
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-primary-foreground shrink-0" />
            <div><h3 className="font-semibold text-primary-foreground">Secure & Private</h3><p className="text-primary-foreground/70 text-sm">Your data stays encrypted and protected</p></div>
          </div>
        </div>
        <p className="text-primary-foreground/60 text-sm">Built for breast cancer surgeons</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isLogin ? 'Welcome back' : 'Create account'}</CardTitle>
            <CardDescription>{isLogin ? 'Sign in to your account' : 'Get started with RadiologyExtract Pro'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}</Button>
            </form>
            <div className="mt-6 text-center">
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
