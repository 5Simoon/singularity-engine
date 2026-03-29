import { motion } from "framer-motion";
import { Copy, Clock, Cpu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function ResultDisplay({ result, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-5">
        <div className="relative float">
          <div className="h-16 w-16 rounded-2xl glass flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-2xl glow-primary opacity-60" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">Computing...</p>
          <p className="text-xs text-muted-foreground mt-1">Running advanced algorithms</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
        <div className="h-16 w-16 rounded-2xl glass flex items-center justify-center">
          <Cpu className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Enter an expression and hit compute</p>
          <p className="text-xs text-muted-foreground/60 mt-1">⌘ + Enter to run</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {/* Main result */}
      <div className="relative p-4 rounded-xl glass-lighter border border-primary/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Result</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-primary"
            onClick={() => { navigator.clipboard.writeText(result.result || ''); toast.success('Copied!'); }}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <div className="font-mono text-xl text-primary font-bold break-all glow-text-primary leading-relaxed">
          {result.result}
        </div>
      </div>

      {/* Steps */}
      {result.steps && (
        <div className="p-4 rounded-xl glass border border-white/[0.06]">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">
            Step-by-Step Solution
          </span>
          <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_pre]:bg-black/40 [&_pre]:rounded-lg [&_pre]:p-3 [&_code]:text-accent">
            <ReactMarkdown>{result.steps}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground/70 px-1">
        {result.executionTime && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> {result.executionTime}ms
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Cpu className="h-3 w-3" /> {result.mode}
        </span>
      </div>
    </motion.div>
  );
}