import { Link } from "react-router-dom";
import { Clock, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";

const MODE_DOTS = {
  numerical: 'bg-primary', ai_solve: 'bg-accent', calculus: 'bg-cyan-400',
  linear_algebra: 'bg-purple-400', statistics: 'bg-blue-400', number_theory: 'bg-green-400',
  symbolic: 'bg-orange-400', graph_theory: 'bg-pink-400',
};

export default function RecentComputations({ computations }) {
  if (!computations?.length) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        No computations yet. <Link to="/engine" className="text-primary hover:underline">Start computing!</Link>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {computations.slice(0, 7).map((comp) => (
        <div key={comp.id}
          className="flex items-center gap-3 p-3 rounded-xl glass-lighter hover:border-primary/20 hover:bg-white/[0.02] transition-all group">
          <div className={`h-2 w-2 rounded-full ${MODE_DOTS[comp.mode] || 'bg-muted-foreground'} shrink-0`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono truncate">{comp.input_expression}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Clock className="h-2.5 w-2.5" />{moment(comp.created_date).fromNow()}
              {comp.execution_time_ms && <span>· {comp.execution_time_ms}ms</span>}
            </p>
          </div>
          {comp.is_favorite && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />}
          <p className="text-xs font-mono text-primary truncate max-w-[140px] shrink-0">{comp.result}</p>
        </div>
      ))}
      <Link to="/history">
        <Button variant="ghost" className="w-full mt-1 text-xs text-muted-foreground hover:text-primary gap-1">
          View all history <ArrowRight className="h-3 w-3" />
        </Button>
      </Link>
    </div>
  );
}
