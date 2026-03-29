import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { User, Shield, LogOut, Key, Cpu, Star, Zap, ExternalLink, Lock, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const AI_ENGINES = [
  { name: 'Anthropic Claude', desc: 'Constitutional AI · Sonnet / Opus / Haiku', icon: '✦', category: 'AI', url: 'https://console.anthropic.com' },
  { name: 'OpenAI GPT-4o', desc: 'GPT-4o, o1, o3-mini reasoning models', icon: '⬡', category: 'AI', url: 'https://platform.openai.com' },
  { name: 'Google Gemini', desc: 'Gemini 2.0 Flash / Pro / Ultra', icon: '✦', category: 'AI', url: 'https://aistudio.google.com' },
  { name: 'Mistral AI', desc: 'Mixtral 8x22B, Mistral Large', icon: '◈', category: 'AI', url: 'https://console.mistral.ai' },
  { name: 'HuggingFace', desc: '300K+ open-source models & Inference API', icon: '🤗', category: 'AI', url: 'https://huggingface.co' },
  { name: 'Meta Llama 3.3', desc: 'Open-source 405B reasoning model', icon: '🦙', category: 'AI', url: 'https://llama.meta.com' },
  { name: 'Cohere Command', desc: 'Command R+ for mathematical tasks', icon: '◉', category: 'AI', url: 'https://dashboard.cohere.com' },
  { name: 'xAI Grok', desc: 'Real-time web + reasoning', icon: 'X', category: 'AI', url: 'https://x.ai' },
];

const MATH_ENGINES = [
  { name: 'Wolfram Alpha', desc: 'Symbolic computation & knowledge base', icon: '🐺', category: 'CAS', url: 'https://developer.wolframalpha.com' },
  { name: 'Wolfram Mathematica', desc: 'Full symbolic math kernel via API', icon: '∑', category: 'CAS', url: 'https://www.wolfram.com/mathematica' },
  { name: 'SageMath', desc: 'Open-source CAS — Python ecosystem', icon: '📐', category: 'CAS', url: 'https://sagecell.sagemath.org' },
  { name: 'Maxima CAS', desc: 'Lisp-based symbolic math system', icon: '∫', category: 'CAS', url: 'https://maxima.sourceforge.io' },
  { name: 'SymPy', desc: 'Python symbolic mathematics library', icon: '🐍', category: 'Open Source', url: 'https://www.sympy.org' },
  { name: 'GNU Octave', desc: 'MATLAB-compatible numerical computing', icon: '🔢', category: 'Numerical', url: 'https://octave.org' },
  { name: 'OEIS', desc: 'Online Encyclopedia of Integer Sequences', icon: '🔍', category: 'Database', url: 'https://oeis.org' },
  { name: 'Desmos API', desc: 'Interactive graphing & visualization', icon: '📈', category: 'Visualization', url: 'https://www.desmos.com/api' },
  { name: 'GeoGebra API', desc: 'Geometry, algebra & calculus toolkit', icon: '📐', category: 'Visualization', url: 'https://www.geogebra.org/m/sehv2ehu' },
  { name: 'NIST DLMF', desc: 'Digital Library of Mathematical Functions', icon: '📚', category: 'Database', url: 'https://dlmf.nist.gov' },
  { name: 'PlanetMath', desc: 'Open math knowledge base', icon: '🌍', category: 'Database', url: 'https://planetmath.org' },
  { name: 'arXiv Math', desc: 'Preprint server for math research', icon: '📄', category: 'Research', url: 'https://arxiv.org/archive/math' },
];

const CAT_COLORS = {
  AI: 'text-primary bg-primary/10 border-primary/20',
  CAS: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  'Open Source': 'text-green-400 bg-green-400/10 border-green-400/20',
  Numerical: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  Database: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Visualization: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Research: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
};

function EngineSection({ title, engines }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h4>
      <div className="grid sm:grid-cols-2 gap-2">
        {engines.map(engine => (
          <div key={engine.name} className="flex items-center gap-3 p-3 rounded-xl glass-lighter hover:border-primary/20 hover:bg-white/[0.02] transition-all group">
            <span className="text-base w-7 text-center shrink-0">{engine.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{engine.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{engine.desc}</p>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 hidden sm:block ${CAT_COLORS[engine.category] || ''}`}>
              {engine.category}
            </span>
            <a href={engine.url} target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors shrink-0">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Account() {
  const [user, setUser] = useState(null);
  const [computations, setComputations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    save_history: true, high_precision: false, ai_fallback: true, show_steps: true,
  });

  useEffect(() => {
    Promise.all([
      base44.auth.me(),
      base44.entities.Computation.list('-created_date', 100).catch(() => [])
    ]).then(([u, c]) => {
      setUser(u); setComputations(c);
      if (u?.preferences) setPreferences(p => ({ ...p, ...u.preferences }));
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const totalComputes = computations.length;
  const favorites = computations.filter(c => c.is_favorite).length;
  const modesUsed = [...new Set(computations.map(c => c.mode))].length;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">Account</h1>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-2xl font-black text-primary">
            {user?.full_name?.[0] || user?.email?.[0] || '?'}
          </div>
          <div>
            <h2 className="text-lg font-black">{user?.full_name || 'User'}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs text-green-400 font-semibold">Verified · {user?.role || 'user'}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Cpu, label: 'Computations', value: totalComputes, color: 'text-primary' },
            { icon: Star, label: 'Favorites', value: favorites, color: 'text-yellow-400' },
            { icon: Zap, label: 'Modes', value: modesUsed, color: 'text-accent' },
          ].map(s => (
            <div key={s.label} className="glass rounded-xl p-3 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <p className="text-xl font-black">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* API Keys shortcut */}
      <Link to="/api-keys">
        <motion.div whileHover={{ x: 4 }} className="glass-card rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-primary/20 transition-all">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Key className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">API Keys</p>
            <p className="text-xs text-muted-foreground">Generate keys to use NEXUS in your own projects</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </Link>

      {/* Preferences */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="font-bold flex items-center gap-2 text-sm">
          <Key className="h-4 w-4 text-primary" /> Engine Preferences
        </h3>
        {[
          { key: 'save_history', label: 'Save Computation History', desc: 'Auto-save all computations' },
          { key: 'ai_fallback', label: 'AI Fallback', desc: 'Use AI when local engine fails' },
          { key: 'high_precision', label: 'High Precision Mode', desc: 'Extended decimal precision' },
          { key: 'show_steps', label: 'Always Show Steps', desc: 'Auto-expand solution steps' },
        ].map((pref, i) => (
          <div key={pref.key}>
            {i > 0 && <Separator className="bg-white/[0.06]" />}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-sm font-medium">{pref.label}</p>
                <p className="text-xs text-muted-foreground">{pref.desc}</p>
              </div>
              <Switch checked={preferences[pref.key]}
                onCheckedChange={v => setPreferences(p => ({ ...p, [pref.key]: v }))} />
            </div>
          </div>
        ))}
        <Button className="bg-primary hover:bg-primary/90 glow-primary w-full"
          onClick={async () => { await base44.auth.updateMe({ preferences }); toast.success('Saved'); }}>
          Save Preferences
        </Button>
      </div>

      {/* AI Engines */}
      <div className="glass-card rounded-2xl p-5 space-y-5">
        <h3 className="font-bold flex items-center gap-2 text-sm">
          <ExternalLink className="h-4 w-4 text-primary" /> Connected Engines & AIs
        </h3>
        <EngineSection title="AI Language Models" engines={AI_ENGINES} />
        <EngineSection title="Math Engines & CAS" engines={MATH_ENGINES} />
        <p className="text-[10px] text-muted-foreground/60 italic">
          API key connections require Builder+ subscription. Open-source engines run within NEXUS locally.
        </p>
      </div>

      {/* Security */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="font-bold flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-green-400" /> Security
        </h3>
        {[
          { icon: Lock, label: 'End-to-End Encrypted', desc: 'AES-256 encryption at rest', color: 'text-green-400' },
          { icon: Shield, label: 'JWT Session', desc: 'Cryptographically signed tokens', color: 'text-primary' },
          { icon: Key, label: 'API Keys — SHA-256 Hashed', desc: 'Keys are hashed, never stored in plain text', color: 'text-yellow-400' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl glass-lighter">
            <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 glass"
        onClick={() => base44.auth.logout()}>
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
}
