import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createLogger } from '@/lib/logger';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function useLogsPoll(interval = 500) {
    const [logs, setLogs] = React.useState<any[]>([]);
    React.useEffect(() => {
        const tick = () => {
            try {
                const w = window as any;
                setLogs([...(w.__APP_LOGS__ || [])]);
            } catch { /* ignore */ }
        };
        tick();
        const id = window.setInterval(tick, interval);
        return () => window.clearInterval(id);
    }, [interval]);
    return logs;
}

export default function DevConsole() {
    const enabled = (import.meta.env.VITE_ENABLE_DEV_CONSOLE ?? import.meta.env.DEV) as boolean;
    const [open, setOpen] = React.useState<boolean>(false);
    const [level, setLevel] = React.useState<LogLevel | 'all'>('all');
    const [scope, setScope] = React.useState<string>('');
    const logs = useLogsPoll();
    const log = createLogger('DevConsole');

    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
                setOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    if (!enabled) return null;

    const filtered = logs.filter((l) => {
        const levelOk = level === 'all' ? true : l.level === level;
        const scopeOk = scope ? String(l.scope || '').toLowerCase().includes(scope.toLowerCase()) : true;
        return levelOk && scopeOk;
    });

    const clearLogs = () => {
        try { (window as any).__APP_LOGS__ = []; } catch { }
        log.info('Cleared logs');
    };

    return (
        <div className="fixed bottom-4 right-4 z-[100]">
            {!open && (
                <Button variant="secondary" onClick={() => setOpen(true)}>Open Dev Console (Ctrl+Shift+D)</Button>
            )}
            {open && (
                <Card className="w-[480px] shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Dev Console</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Close</Button>
                            <Button variant="destructive" size="sm" onClick={clearLogs}>Clear</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 mb-3">
                            <select className="border rounded px-2 py-1 text-sm" value={level} onChange={(e) => setLevel(e.target.value as any)}>
                                <option value="all">All</option>
                                <option value="debug">Debug</option>
                                <option value="info">Info</option>
                                <option value="warn">Warn</option>
                                <option value="error">Error</option>
                            </select>
                            <input className="border rounded px-2 py-1 text-sm flex-1" placeholder="Filter by scope" value={scope} onChange={(e) => setScope(e.target.value)} />
                        </div>
                        <div className="h-72 overflow-auto bg-muted rounded p-2 text-xs font-mono">
                            {filtered.length === 0 ? (
                                <div className="text-muted-foreground">No logs</div>
                            ) : (
                                filtered.slice(-500).map((l, i) => (
                                    <div key={i} className="mb-1">
                                        <span className="text-muted-foreground">[{new Date(l.ts).toLocaleTimeString()}]</span>{' '}
                                        <span className="font-semibold">[{l.scope}]</span>{' '}
                                        <span className={
                                            l.level === 'error' ? 'text-destructive' : l.level === 'warn' ? 'text-warning' : l.level === 'info' ? 'text-primary' : ''
                                        }>{String(l.level).toUpperCase()}</span>{': '}
                                        <span>{l.message}</span>
                                        {Array.isArray(l.args) && l.args.length > 0 && (
                                            <pre className="mt-1 whitespace-pre-wrap break-words">{JSON.stringify(l.args.length === 1 ? l.args[0] : l.args, null, 2)}</pre>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
