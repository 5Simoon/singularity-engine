import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { History as HistoryIcon, Star, Trash2, Search, Filter, Clock, Cpu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import moment from "moment";
import ReactMarkdown from "react-markdown";

const MODE_COLORS = {
  numerical: 'text-primary bg-primary/10 border-primary/20',
  ai_solve: 'text-accent bg-accent/10 border-accent/20',
  calculus: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  linear_algebra: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  statistics: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  number_theory: 'text-green-400 bg-green-400/10 border-green-400/20',
  symbolic: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  graph_theory: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
};

export default function History() {
  const [computations, setComputations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    base44.entities.Computation.list('-created_date', 200)
      .then(setComputations)
      .finally(() => setLoading(false));
  }, []);

  const filtered = computations.filter(c => {
    if (search && !c.input_expression?.toLowerCase().includes(search.toLowerCase()) &&
        !c.result?.toLowerCase().includes(search.toLowerCase())) return false;
    if (modeFilter !== 'all' && c.mode !== modeFilter) return false;
    return true;
  });

  const toggleFavorite = async (comp) => {
    await base44.entities.Computation.update(comp.id, { is_favorite: !comp.is_favorite });
    setComputations(prev => prev.map(c => c.id === comp.id ? { ...c, is_favorite: !c.is_favorite } : c));
    toast.success(comp.is_favorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const deleteComp = async (comp) => {
    await base44.entities.Computation.delete(comp.id);
    setComputations(prev => prev.filter(c => c.id !== comp.id));
    toast.success('Deleted');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center">
          <HistoryIcon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">History</h1>
          <p className="text-xs text-muted-foreground">{computations.length} computations stored</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expressions or results..."
            className="pl-9 glass-input text-sm" />
        </div>
        <Select value={modeFilter} onValueChange={setModeFilter}>
          <SelectTrigger className="w-full sm:w-[180px] glass-input text-sm">
            <Filter className="h-3.5 w-3.5 mr-2" /><SelectValue />
          </SelectTrigger>
          <SelectContent className="glass">
            <SelectItem value="all">All Modes</SelectItem>
            {['numerical', 'ai_solve', 'calculus', 'linear_algebra', 'statistics', 'number_theory', 'symbolic', 'graph_theory'].map(m => (
              <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map(comp => (
            <motion.div key={comp.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              className="glass-card rounded-2xl overflow-hidden group">
              <button onClick={() => setExpanded(expanded === comp.id ? null : comp.id)}
                className="w-full text-left p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl glass flex items-center justify-center shrink-0 mt-0.5">
                    <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{comp.input_expression}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${MODE_COLORS[comp.mode] || 'text-muted-foreground bg-secondary border-border'}`}>
                        {comp.mode?.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />{moment(comp.created_date).fromNow()}
                      </span>
                      {comp.execution_time_ms && (
                        <span className="text-[10px] text-muted-foreground">{comp.execution_time_ms}ms</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(comp); }}>
                      <Star className={`h-3.5 w-3.5 ${comp.is_favorite ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteComp(comp); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded === comp.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                <div className="mt-2 font-mono text-sm text-primary/90 truncate ml-11">→ {comp.result}</div>
              </button>

              <AnimatePresence>
                {expanded === comp.id && comp.steps && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 border-t border-white/[0.06] pt-3 ml-11">
                      <div className="prose prose-sm prose-invert max-w-none text-sm glass rounded-xl p-3 [&_code]:text-accent [&_pre]:bg-black/30 [&_pre]:rounded-lg [&_pre]:p-3">
                        <ReactMarkdown>{comp.steps}</ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-2xl glass mx-auto flex items-center justify-center mb-4">
              <HistoryIcon className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">{search || modeFilter !== 'all' ? 'No matching computations' : 'No computations yet'}</p>
          </div>
        )}
      </div>
    </div>
  );
}