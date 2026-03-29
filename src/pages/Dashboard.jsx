import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Cpu, Calculator, Brain, History, Zap, ArrowRight, Shield, TrendingUp, Sigma, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "../components/dashboard/StatCard";
import RecentComputations from "../components/dashboard/RecentComputations";

const CAPABILITIES = [
  { title: 'Expression Parser', desc: 'Shunting-Yard + RPN eval', tag: 'Core' },
  { title: 'Adaptive Simpson', desc: 'Recursive integration, tol 1e-10', tag: 'Calculus' },
  { title: 'Runge-Kutta 4', desc: 'ODE solver, 4th order', tag: 'Calculus' },
  { title: 'Newton-Raphson', desc: 'Root finding, quadratic convergence', tag: 'Calculus' },
  { title: 'LU Decomposition', desc: 'Gaussian elimination, O(n³)', tag: 'LinAlg' },
  { title: 'Eigenvalues 2×2', desc: 'Characteristic polynomial', tag: 'LinAlg' },
  { title: 'Conjugate Gradient', desc: 'Iterative linear solver', tag: 'LinAlg' },
  { title: 'FFT / DFT', desc: 'Cooley-Tukey O(n log n)', tag: 'Signal' },
  { title: 'Haar Wavelet', desc: 'Multi-resolution analysis', tag: 'Signal' },
  { title: 'Miller-Rabin', desc: 'Probabilistic primality, k=20', tag: 'Number' },
  { title: "Pollard's Rho", desc: 'Integer factorization', tag: 'Number' },
  { title: 'Euler Totient', desc: 'φ(n) via prime factors', tag: 'Number' },
  { title: 'Extended GCD', desc: "Bézout's coefficients", tag: 'Number' },
  { title: 'Continued Fractions', desc: 'Convergents & expansions', tag: 'Number' },
  { title: 'Gamma / Zeta / Erf', desc: 'Lanczos, Riemann, Gauss', tag: 'Special' },
  { title: 'Bessel J₀ / J₁', desc: 'Polynomial approximation', tag: 'Special' },
  { title: 'Chebyshev Approx', desc: 'Minimax polynomial fitting', tag: 'Approx' },
  { title: 'Lagrange Interp.', desc: 'Polynomial interpolation', tag: 'Approx' },
  { title: 'Newton Interp.', desc: 'Divided differences', tag: 'Approx' },
  { title: 'Monte Carlo', desc: 'Stochastic integration & π', tag: 'Stoch' },
  { title: 'Simulated Annealing', desc: 'Metaheuristic optimization', tag: 'Optim' },
  { title: 'Genetic Algorithm', desc: 'Evolutionary optimization', tag: 'Optim' },
  { title: 'Golden Section', desc: 'Unimodal minimization', tag: 'Optim' },
  { title: 'Gradient Descent', desc: 'First-order optimizer', tag: 'Optim' },
  { title: 'Bézier Curves', desc: 'De Casteljau algorithm', tag: 'Geo' },
  { title: 'Linear Regression', desc: 'OLS with R² & correlation', tag: 'Stats' },
  { title: 'Full Statistics', desc: 'Skewness, kurtosis, IQR', tag: 'Stats' },
  { title: 'AI Solver (LLM)', desc: 'GPT / Claude via InvokeLLM', tag: 'AI' },
];

const TAG_COLORS = {
  Core: 'text-primary bg-primary/10', Calculus: 'text-cyan-400 bg-cyan-400/10',
  LinAlg: 'text-purple-400 bg-purple-400/10', Signal: 'text-yellow-400 bg-yellow-400/10',
  Number: 'text-green-400 bg-green-400/10', Special: 'text-orange-400 bg-orange-400/10',
  Approx: 'text-pink-400 bg-pink-400/10', Stoch: 'text-red-400 bg-red-400/10',
  Optim: 'text-indigo-400 bg-indigo-400/10', Geo: 'text-teal-400 bg-teal-400/10',
  Stats: 'text-blue-400 bg-blue-400/10', AI: 'text-accent bg-accent/10',
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [computations, setComputations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.Computation.list('-created_date', 20).catch(() => [])
    ]).then(([u, c]) => { setUser(u); setComputations(c); setLoading(false); });
  }, []);

  const totalComputes = computations.length;
  const favorites = computations.filter(c => c.is_favorite).length;
  const avgTime = totalComputes ? Math.round(computations.reduce((s, c) => s + (c.execution_time_ms || 0), 0) / totalComputes) : 0;
  const modes = [...new Set(computations.map(c => c.mode))].length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 sm:p-10 glass-card neon-border"
      >
        <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-accent/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-5">
            <span className="h-2 w-2 rounded-full bg-green-400 pulse-glow" />
            <span className="text-xs font-semibold text-green-400 uppercase tracking-[0.2em]">Engine Online · v3.0</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
            NEXUS<br className="sm:hidden" /> Math Engine
          </h1>
          <p className="text-muted-foreground max-w-xl mb-6 text-sm leading-relaxed">
            {user?.full_name ? `Welcome back, ${user.full_name.split(' ')[0]}.` : 'Welcome.'} {' '}
            28 algorithms · 8 computation modes · AI-powered solving · 
            Signal processing · Stochastic methods · Optimization.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/engine">
              <Button className="bg-primary hover:bg-primary/90 glow-primary gap-2 font-semibold">
                <Cpu className="h-4 w-4" /> Launch Engine <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="outline" className="border-white/10 hover:bg-white/5 gap-2">
                <History className="h-4 w-4" /> History
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Calculator, label: 'Computations', value: totalComputes, color: 'primary' },
          { icon: Sigma, label: 'Modes Used', value: modes, color: 'accent' },
          { icon: TrendingUp, label: 'Avg Speed', value: `${avgTime}ms`, color: 'green' },
          { icon: Shield, label: 'Saved', value: favorites, color: 'orange' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      {/* Quick Launch + Recent */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Quick Launch</h2>
          <div className="space-y-1.5">
            {[
              { label: 'Numerical Eval', icon: Calculator, desc: 'Evaluate expressions', path: '/engine' },
              { label: 'AI Solver', icon: Brain, desc: 'AI-powered math', path: '/engine' },
              { label: 'Computation History', icon: History, desc: 'Browse past work', path: '/history' },
              { label: 'Algorithm Library', icon: GitBranch, desc: '28 algorithms', path: '/engine' },
            ].map(item => (
              <Link key={item.label} to={item.path}>
                <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all group cursor-pointer">
                  <div className="h-8 w-8 rounded-lg glass flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Recent Computations</h2>
          <RecentComputations computations={computations} />
        </div>
      </div>

      {/* Algorithm Library */}
      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Algorithm Library <span className="text-primary ml-2">{CAPABILITIES.length} modules</span>
          </h2>
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {CAPABILITIES.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="p-3 rounded-xl glass-lighter hover:border-primary/20 hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-semibold group-hover:text-primary transition-colors">{cap.title}</p>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md shrink-0 ${TAG_COLORS[cap.tag] || 'text-muted-foreground bg-secondary'}`}>
                  {cap.tag}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">{cap.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}