import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Shield, Zap, Code, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import moment from "moment";

const PERMISSIONS = ["numerical", "calculus", "linear_algebra", "statistics", "number_theory", "symbolic", "ai_solve", "graph_theory"];

const PERM_COLORS = {
  numerical: 'text-primary bg-primary/10 border-primary/20',
  ai_solve: 'text-accent bg-accent/10 border-accent/20',
  calculus: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  linear_algebra: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  statistics: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  number_theory: 'text-green-400 bg-green-400/10 border-green-400/20',
  symbolic: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  graph_theory: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
};

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(40);
  crypto.getRandomValues(array);
  return 'nxs_' + Array.from(array).map(b => chars[b % chars.length]).join('');
}

async function hashKey(key) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const CODE_EXAMPLES = {
  js: `// NEXUS Math Engine — JavaScript
const res = await fetch('https://nexus.math/api/compute', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    expression: 'integral:x^2*sin(x),0,pi',
    mode: 'calculus'
  })
});
const { result, steps, executionTime } = await res.json();`,
  python: `# NEXUS Math Engine — Python
import requests

response = requests.post(
    'https://nexus.math/api/compute',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={
        'expression': 'stats:[1,2,3,4,5,6,7,8,9,10]',
        'mode': 'statistics'
    }
)
data = response.json()
print(data['result'])`,
  curl: `# NEXUS Math Engine — cURL
curl -X POST https://nexus.math/api/compute \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"expression": "isprime:997", "mode": "number_theory"}'`,
};

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPerms, setNewKeyPerms] = useState([...PERMISSIONS]);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(60);
  const [revealedKey, setRevealedKey] = useState(null); // { id, key }
  const [activeTab, setActiveTab] = useState('js');
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    base44.entities.ApiKey.list('-created_date', 50)
      .then(setKeys)
      .finally(() => setLoading(false));
  }, []);

  const createKey = async () => {
    if (!newKeyName.trim()) return toast.error('Enter a key name');
    const rawKey = generateKey();
    const hash = await hashKey(rawKey);
    const prefix = rawKey.substring(0, 12);
    const created = await base44.entities.ApiKey.create({
      name: newKeyName.trim(),
      key_hash: hash,
      key_prefix: prefix,
      is_active: true,
      permissions: newKeyPerms,
      rate_limit: newKeyRateLimit,
      total_requests: 0,
    });
    setKeys(prev => [created, ...prev]);
    setRevealedKey({ id: created.id, key: rawKey });
    setCreating(false);
    setNewKeyName('');
    setNewKeyPerms([...PERMISSIONS]);
    toast.success('API key created! Copy it now — it won\'t be shown again.');
  };

  const deleteKey = async (key) => {
    await base44.entities.ApiKey.delete(key.id);
    setKeys(prev => prev.filter(k => k.id !== key.id));
    toast.success('Key deleted');
  };

  const toggleKey = async (key) => {
    await base44.entities.ApiKey.update(key.id, { is_active: !key.is_active });
    setKeys(prev => prev.map(k => k.id === key.id ? { ...k, is_active: !k.is_active } : k));
  };

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied!');
  };

  const togglePerm = (p) => setNewKeyPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <Key className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">API Keys</h1>
            <p className="text-xs text-muted-foreground">Integrate NEXUS into your own projects</p>
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90 glow-primary gap-2 text-sm"
          onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New Key
        </Button>
      </div>

      {/* Create key form */}
      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Create New API Key
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wider">Key Name</label>
                <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                  placeholder="e.g. My React App, Production"
                  className="glass-input" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wider">Permissions</label>
                <div className="flex flex-wrap gap-1.5">
                  {PERMISSIONS.map(p => (
                    <button key={p} onClick={() => togglePerm(p)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${newKeyPerms.includes(p) ? PERM_COLORS[p] : 'text-muted-foreground border-border hover:border-primary/30'}`}>
                      {p.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wider">Rate Limit (req/min)</label>
                <div className="flex gap-2">
                  {[10, 30, 60, 120, 300].map(r => (
                    <button key={r} onClick={() => setNewKeyRateLimit(r)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${newKeyRateLimit === r ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border glass-lighter text-muted-foreground hover:border-primary/30'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button className="bg-primary hover:bg-primary/90 glow-primary gap-2" onClick={createKey}>
                <Key className="h-3.5 w-3.5" /> Generate Key
              </Button>
              <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => setCreating(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revealed key banner */}
      <AnimatePresence>
        {revealedKey && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">Save this key now — it won't be shown again</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm bg-black/30 px-3 py-2 rounded-xl text-green-400 break-all">
                {revealedKey.key}
              </code>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 hover:text-primary"
                onClick={() => copyText(revealedKey.key, 'revealed')}>
                {copied === 'revealed' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <button onClick={() => setRevealedKey(null)} className="text-xs text-muted-foreground mt-2 hover:text-foreground">
              I've saved it, dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keys list */}
      <div className="space-y-2">
        {keys.length === 0 && !creating && (
          <div className="text-center py-16 glass-card rounded-2xl">
            <Key className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No API keys yet</p>
            <Button className="mt-3 bg-primary/10 hover:bg-primary/20 text-primary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create your first key
            </Button>
          </div>
        )}
        {keys.map(key => (
          <motion.div key={key.id} layout className="glass-card rounded-2xl p-4 group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-2 w-2 rounded-full shrink-0 ${key.is_active ? 'bg-green-400 pulse-glow' : 'bg-muted-foreground/40'}`} />
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{key.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-[10px] font-mono text-muted-foreground bg-black/20 px-1.5 py-0.5 rounded">
                      {key.key_prefix}••••••••••••
                    </code>
                    <span className="text-[10px] text-muted-foreground">{key.rate_limit || 60} req/min</span>
                    {key.total_requests > 0 && (
                      <span className="text-[10px] text-muted-foreground">{key.total_requests.toLocaleString()} calls</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(key.permissions || []).map(p => (
                      <span key={p} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${PERM_COLORS[p] || ''}`}>
                        {p.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleKey(key)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                  {key.is_active ? <ToggleRight className="h-5 w-5 text-green-400" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                  onClick={() => deleteKey(key)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 ml-5">
              Created {moment(key.created_date).fromNow()}
              {key.last_used && ` · Last used ${moment(key.last_used).fromNow()}`}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Code examples */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
          <Code className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Integration Examples</span>
        </div>
        <div className="flex border-b border-white/[0.06]">
          {Object.keys(CODE_EXAMPLES).map(lang => (
            <button key={lang} onClick={() => setActiveTab(lang)}
              className={`px-4 py-2 text-xs font-mono font-bold transition-colors ${activeTab === lang ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {lang}
            </button>
          ))}
        </div>
        <div className="relative p-4">
          <pre className="font-mono text-xs text-green-300/90 leading-relaxed overflow-x-auto">
            <code>{CODE_EXAMPLES[activeTab]}</code>
          </pre>
          <Button size="icon" variant="ghost" className="absolute top-3 right-3 h-7 w-7 hover:text-primary"
            onClick={() => copyText(CODE_EXAMPLES[activeTab], 'code')}>
            {copied === 'code' ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* API reference */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> API Reference
        </h3>
        <div className="space-y-2 text-xs">
          {[
            { method: 'POST', path: '/api/compute', desc: 'Run a computation' },
            { method: 'GET', path: '/api/modes', desc: 'List available computation modes' },
            { method: 'GET', path: '/api/algorithms', desc: 'List all 30+ algorithms' },
            { method: 'GET', path: '/api/status', desc: 'Engine health & latency' },
          ].map(ep => (
            <div key={ep.path} className="flex items-center gap-3 p-2.5 rounded-xl glass-lighter">
              <span className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${ep.method === 'POST' ? 'bg-primary/10 text-primary' : 'bg-green-400/10 text-green-400'}`}>
                {ep.method}
              </span>
              <code className="text-muted-foreground font-mono">{ep.path}</code>
              <span className="text-muted-foreground/60 ml-auto">{ep.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/60">
          Base URL: <code className="text-primary">https://nexus.math/api/v1</code> · 
          Auth: <code className="text-primary">Authorization: Bearer &lt;key&gt;</code>
        </p>
      </div>
    </div>
  );
}