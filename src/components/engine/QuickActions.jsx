import { Button } from "@/components/ui/button";

const QUICK_ACTIONS = {
  numerical: [
    { label: 'sqrt(144)', value: 'sqrt(144)' },
    { label: 'sin(pi/4)', value: 'sin(pi/4)' },
    { label: 'gamma(5.5)', value: 'gamma(5.5)' },
    { label: 'factorial(20)', value: 'factorial(20)' },
    { label: 'cf:3.14159265', value: 'cf:3.14159265' },
    { label: 'bessel:0,2.4', value: 'bessel:0,2.4' },
  ],
  ai_solve: [
    { label: 'Solve quadratic', value: 'Solve x^2 - 5x + 6 = 0 step by step' },
    { label: 'Prove sqrt(2) irrational', value: 'Prove that sqrt(2) is irrational' },
    { label: 'Basel problem', value: 'What is the sum of 1/n^2 for n=1 to infinity? (Basel problem)' },
    { label: 'Riemann hypothesis', value: 'Explain the Riemann hypothesis and its significance' },
  ],
  calculus: [
    { label: "d/dx sin(x²)", value: 'derivative:sin(x^2),x=1' },
    { label: '∫ x²sin(x) 0→π', value: 'integral:x^2*sin(x),0,pi' },
    { label: 'Newton: x³-x-2', value: 'newton:x^3-x-2,1.5' },
    { label: 'Bisect: cos(x)-x', value: 'bisect:cos(x)-x,0,1' },
    { label: 'Secant method', value: 'secant:x^3-2,1,2' },
    { label: 'Arc length sin(x)', value: 'arclength:sin(x),0,pi' },
  ],
  linear_algebra: [
    { label: 'Det 3×3', value: 'det:[[1,2,3],[4,5,6],[7,8,10]]' },
    { label: 'Inverse 2×2', value: 'inverse:[[2,1],[5,3]]' },
    { label: 'Eigenvalues', value: 'eigen:[[4,1],[2,3]]' },
    { label: 'Vec cross product', value: 'cross:[1,2,3],[4,5,6]' },
    { label: 'CG solver', value: 'cg:[[4,1],[1,3]]|[1,2]' },
  ],
  statistics: [
    { label: 'Stats dataset', value: 'stats:[12,15,18,22,25,28,30,33,35,38]' },
    { label: 'Regression', value: 'regression:[1,2,3,4,5],[2,4,5,4,5]' },
    { label: 't-Test', value: 'ttest:[82,85,88,90,92],[75,78,80,83,85]' },
    { label: 'Shannon entropy', value: 'entropy:[0.5,0.25,0.125,0.125]' },
  ],
  number_theory: [
    { label: 'Miller-Rabin 997', value: 'isprime:997' },
    { label: "Pollard's ρ 8051", value: 'factor:8051' },
    { label: 'CRT problem', value: 'crt:2,3,5|3,4,6' },
    { label: 'Collatz 27', value: 'collatz:27' },
    { label: 'Bell(10)', value: 'bell:10' },
    { label: 'Catalan(10)', value: 'catalan:10' },
  ],
  symbolic: [
    { label: 'FFT signal', value: 'fft:[1,0,1,0,1,0,1,0]' },
    { label: 'Monte Carlo π', value: 'montecarlo:pi:500000' },
    { label: 'Poly roots', value: 'roots:[6,-5,1]' },
    { label: 'Bézier curve', value: 'bezier:[{"x":0,"y":0},{"x":0.5,"y":1},{"x":1,"y":0}]' },
    { label: 'Mandelbrot', value: 'mandelbrot:-0.75,0.1' },
  ],
  graph_theory: [
    { label: 'Dijkstra', value: 'dijkstra:{"A":[{"to":"B","weight":4},{"to":"C","weight":2}],"B":[{"to":"D","weight":3}],"C":[{"to":"B","weight":1},{"to":"D","weight":5}],"D":[]}|A' },
    { label: 'Kruskal MST', value: 'kruskal:A,B,C,D|A,B,4|A,C,2|B,D,3|C,B,1|C,D,5' },
    { label: 'Topo sort', value: 'toposort:{"A":["B","C"],"B":["D"],"C":["D"],"D":[]}' },
    { label: 'AI graph problem', value: 'Find the chromatic number of the Petersen graph' },
  ],
};

export default function QuickActions({ mode, onSelect }) {
  const actions = QUICK_ACTIONS[mode] || QUICK_ACTIONS.numerical;
  
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="text-xs text-muted-foreground self-center mr-1">Quick:</span>
      {actions.map((action, i) => (
        <Button
          key={i}
          variant="outline"
          size="sm"
          className="h-7 text-xs font-mono bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/30"
          onClick={() => onSelect(action.value)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}