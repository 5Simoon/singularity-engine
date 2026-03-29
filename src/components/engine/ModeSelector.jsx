import { motion } from "framer-motion";
import { Calculator, Brain, BarChart3, Grid3X3, TrendingUp, Hash, Sigma, Sparkles } from "lucide-react";

const MODES = [
  { id: 'numerical', label: 'Numerical', icon: Calculator, desc: 'Evaluate expressions' },
  { id: 'ai_solve', label: 'AI Solver', icon: Brain, desc: 'GPT / Claude solvers' },
  { id: 'calculus', label: 'Calculus', icon: TrendingUp, desc: 'Derivatives · integrals · ODEs' },
  { id: 'linear_algebra', label: 'Linear Algebra', icon: Grid3X3, desc: 'Matrices · eigenvalues' },
  { id: 'statistics', label: 'Statistics', icon: BarChart3, desc: 'Analysis · regression' },
  { id: 'number_theory', label: 'Number Theory', icon: Hash, desc: 'Primes · factors · modular' },
  { id: 'symbolic', label: 'Symbolic + FFT', icon: Sigma, desc: 'CAS · wavelets · Bézier' },
  { id: 'graph_theory', label: 'Graph Theory', icon: Sparkles, desc: 'Networks · optimization' },
];

export default function ModeSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {MODES.map(mode => {
        const active = selected === mode.id;
        return (
          <motion.button
            key={mode.id}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(mode.id)}
            className={`
              relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 text-center
              ${active
                ? 'border-primary/40 bg-primary/10 glow-primary'
                : 'border-white/[0.06] glass-lighter hover:border-primary/20 hover:bg-primary/5'}
            `}
          >
            <mode.icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs font-bold ${active ? 'text-primary' : 'text-foreground'}`}>{mode.label}</span>
            <span className="text-[9px] text-muted-foreground leading-tight">{mode.desc}</span>
            {active && (
              <motion.div layoutId="mode-bar" className="absolute -bottom-px left-[20%] right-[20%] h-[2px] bg-primary rounded-full" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}