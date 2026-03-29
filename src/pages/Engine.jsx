import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Play, Trash2, BookmarkPlus, Terminal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ModeSelector from "../components/engine/ModeSelector";
import ResultDisplay from "../components/engine/ResultDisplay";
import QuickActions from "../components/engine/QuickActions";
import { compute } from "../components/engine/computeHandler";

export default function Engine() {
  const [mode, setMode] = useState("numerical");
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompute = async () => {
    if (!expression.trim()) return;
    setIsLoading(true);
    setResult(null);
    const res = await compute(expression, mode);
    setResult(res);
    setIsLoading(false);
    base44.entities.Computation.create({
      title: expression.substring(0, 80),
      input_expression: expression,
      mode,
      result: res.result,
      steps: res.steps || '',
      execution_time_ms: res.executionTime,
      is_favorite: false,
      tags: [mode]
    }).catch(() => {});
  };

  const handleSave = () => {
    if (!result) return;
    base44.entities.Computation.filter({ input_expression: expression }).then(items => {
      if (items.length) base44.entities.Computation.update(items[0].id, { is_favorite: true });
    });
    toast.success('Saved to favorites');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <Terminal className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Compute Engine</h1>
          <span className="h-2 w-2 rounded-full bg-green-400 pulse-glow ml-1" />
        </div>
        <p className="text-sm text-muted-foreground ml-11">
          28 algorithms · AI solvers · Signal processing · Stochastic methods
        </p>
      </motion.div>

      {/* Mode Selection */}
      <ModeSelector selected={mode} onSelect={(m) => { setMode(m); setResult(null); }} />

      {/* Input */}
      <div className="space-y-3">
        <QuickActions mode={mode} onSelect={setExpression} />

        <div className="relative glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono ml-2 uppercase tracking-widest">input.math</span>
            <div className="ml-auto flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-primary font-mono">{mode}</span>
            </div>
          </div>
          <Textarea
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleCompute(); } }}
            placeholder={getPlaceholder(mode)}
            className="min-h-[130px] font-mono text-sm bg-transparent border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground/40 px-4 py-3"
          />
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <span className="text-[10px] text-muted-foreground/50">⌘ + Enter to run</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setExpression(''); setResult(null); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
              <Button size="sm" className="h-7 bg-primary hover:bg-primary/90 glow-primary text-xs font-semibold"
                onClick={handleCompute} disabled={isLoading || !expression.trim()}>
                <Play className="h-3.5 w-3.5 mr-1" /> Run
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono ml-2 uppercase tracking-widest">output.result</span>
          </div>
          {result && (
            <Button variant="ghost" size="sm" className="h-7 text-xs hover:text-primary" onClick={handleSave}>
              <BookmarkPlus className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
          )}
        </div>
        <div className="p-4 sm:p-5">
          <ResultDisplay result={result} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

function getPlaceholder(mode) {
  return {
    numerical: 'sqrt(144) + sin(pi/4)^2 * factorial(5) * gamma(4.5)',
    ai_solve: 'Solve x^2 - 5x + 6 = 0 step by step, or "Prove sqrt(2) is irrational"',
    calculus: 'derivative:sin(x)*x^2,x=pi/4  |  integral:x^2,0,1  |  newton:x^3-x-2,1.5  |  ode:-2*y,0,1,0,5',
    linear_algebra: 'det:[[1,2],[3,4]]  |  inverse:[[2,1],[5,3]]  |  eigen:[[4,1],[2,3]]  |  multiply:[[1,2],[3,4]]*[[5,6],[7,8]]',
    statistics: 'stats:[2,4,6,8,10]  |  regression:[1,2,3,4,5],[2,4,5,4,5]  |  normal:0,0,1',
    number_theory: 'isprime:997  |  factor:360  |  fibonacci:50  |  gcd:252,105  |  sieve:100  |  totient:100',
    symbolic: 'roots:[6,-5,1]  |  fft:[1,0,1,0,1,0,1,0]  |  montecarlo:pi  |  bezier or chebyshev queries',
    graph_theory: 'Describe a graph problem (shortest path, MST, coloring) for AI to solve...',
  }[mode] || 'Enter expression...';
}