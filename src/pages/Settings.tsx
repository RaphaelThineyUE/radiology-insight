import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Key, CheckCircle, Eye, EyeOff } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

export default function Settings() {
  const { hasApiKey, updateApiKey, clearApiKey, getApiKey } = useProfile();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!apiKey.startsWith('sk-')) {
      toast({ title: 'Invalid API Key', description: 'OpenAI API keys start with sk-', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await updateApiKey(apiKey);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'API Key Saved', description: 'Your OpenAI API key has been saved securely.' });
      setApiKey('');
    }
  };

  const handleClear = async () => {
    const { error } = await clearApiKey();
    if (!error) toast({ title: 'API Key Removed' });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div><h1 className="text-3xl font-bold">Settings</h1><p className="text-muted-foreground mt-1">Manage your account and API configuration</p></div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />OpenAI API Key</CardTitle>
            <CardDescription>Your API key is stored securely and used for document extraction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasApiKey ? (
              <div className="flex items-center gap-4 p-4 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
                <div className="flex-1"><p className="font-medium">API Key Configured</p><p className="text-sm text-muted-foreground">Your key is securely stored</p></div>
                <Button variant="outline" size="sm" onClick={handleClear}>Remove</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="relative">
                    <Input id="apiKey" type={showKey ? 'text' : 'password'} placeholder="sk-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                    <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2" onClick={() => setShowKey(!showKey)}>{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={!apiKey || saving}>{saving ? 'Saving...' : 'Save API Key'}</Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI Platform</a></p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
