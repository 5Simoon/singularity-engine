import { base44 } from "@/api/base44Client";
import * as MathEngine from "../../lib/mathEngine";

// AI solver — try multiple LLM personalities
async function aiSolve(prompt, mode = 'general') {
  const systemPrompts = {
    general: `You are NEXUS, an elite mathematical computation engine combining the rigor of Wolfram Alpha, the reasoning of Claude, and the breadth of SageMath. Solve with maximum precision.`,
    proof: `You are a mathematical proof assistant. Provide formal, rigorous proofs with every logical step justified.`,
    numerical: `You are a numerical analysis expert. Focus on algorithmic efficiency, error analysis, and computational methods.`,
  };

  const resp = await base44.integrations.Core.InvokeLLM({
    prompt: `${systemPrompts[mode] || systemPrompts.general}\n\nProblem: ${prompt}\n\nProvide:\n1. **Answer** — precise final result\n2. **Method** — which algorithm/theorem is used\n3. **Steps** — full step-by-step derivation\n4. **Verification** — check your answer\n5. **Complexity** — time/space complexity if applicable`,
    response_json_schema: {
      type: "object",
      properties: {
        solution: { type: "string" },
        method: { type: "string" },
        steps: { type: "string" },
        verification: { type: "string" },
        complexity: { type: "string" }
      }
    }
  });
  return resp;
}

export async function compute(expression, mode) {
  const t0 = performance.now();
  let result = '', steps = '';

  try {
    switch (mode) {

      case 'numerical': {
        // Try local engine first, fallback to AI for complex expressions
        if (expression.startsWith('montecarlo:pi')) {
          const samples = parseInt(expression.split(':')[2] || '1000000');
          const mc = MathEngine.monteCarloPi(Math.min(samples, 5_000_000));
          result = mc.estimate.toFixed(8);
          steps = `Monte Carlo π estimation\nSamples: ${mc.samples.toLocaleString()}\nEstimate: ${mc.estimate.toFixed(10)}\nActual π: ${Math.PI.toFixed(10)}\nError: ${mc.error.toExponential(4)}`;
        } else if (expression.startsWith('bessel:')) {
          const parts = expression.replace('bessel:', '').split(',');
          const order = parseInt(parts[0]), x = parseFloat(parts[1]);
          const val = order === 0 ? MathEngine.besselJ0(x) : MathEngine.besselJ1(x);
          result = MathEngine.formatNumber(val);
          steps = `Bessel function J${order}(${x}) = ${result}\nComputed via Abramowitz & Stegun polynomial approximation`;
        } else if (expression.startsWith('cf:')) {
          const val = parseFloat(expression.replace('cf:', ''));
          const terms = MathEngine.continuedFraction(val, 15);
          const convs = MathEngine.continuedFractionConvergents(terms);
          result = `[${terms.join('; ')}]`;
          steps = `Continued fraction of ${val}\n${result}\n\nConvergents:\n${convs.map(c => `${c.p}/${c.q} ≈ ${c.value.toFixed(8)}`).join('\n')}`;
        } else if (expression.startsWith('haar:')) {
          const signal = JSON.parse(expression.replace('haar:', ''));
          const wt = MathEngine.haarWavelet(signal);
          result = `[${wt.map(v => v.toFixed(4)).join(', ')}]`;
          steps = `Haar Wavelet Transform\nInput: [${signal.join(', ')}]\nOutput: ${result}`;
        } else {
          const val = MathEngine.evaluate(expression);
          result = MathEngine.formatNumber(val);
          steps = `Parsed using Shunting-Yard algorithm → RPN evaluation\nResult: ${result}`;
        }
        break;
      }

      case 'ai_solve': {
        const resp = await aiSolve(expression, 'general');
        result = resp.solution;
        steps = `**Method:** ${resp.method}\n\n## Step-by-Step\n${resp.steps}\n\n## Verification\n${resp.verification}\n\n## Complexity\n${resp.complexity}`;
        break;
      }

      case 'calculus': {
        if (expression.startsWith('derivative:')) {
          const parts = expression.replace('derivative:', '').split(',');
          const expr = parts[0].trim();
          const xVal = MathEngine.evaluate(parts[1]?.replace('x=', '').trim() || '0');
          const f = (x) => MathEngine.evaluate(expr, { x });
          const d = MathEngine.numericalDerivative(f, xVal);
          result = MathEngine.formatNumber(d);
          steps = `f(x) = ${expr}\nf'(${xVal}) via 4th-order Richardson extrapolation\nf'(${xVal}) = **${result}**`;
        } else if (expression.startsWith('integral:')) {
          const parts = expression.replace('integral:', '').split(',');
          const expr = parts[0].trim();
          const a = MathEngine.evaluate(parts[1].trim()), b = MathEngine.evaluate(parts[2].trim());
          const f = (x) => MathEngine.evaluate(expr, { x });
          const simp = MathEngine.adaptiveSimpson(f, a, b);
          const gauss = MathEngine.gaussLegendreComposite(f, a, b, 200);
          const romb = MathEngine.rombergIntegration(f, a, b, 8);
          result = MathEngine.formatNumber(simp);
          steps = `∫(${a} to ${b}) ${expr} dx\n\n**Adaptive Simpson:** ${MathEngine.formatNumber(simp)}\n**Gauss-Legendre (200):** ${MathEngine.formatNumber(gauss)}\n**Romberg (order 8):** ${MathEngine.formatNumber(romb.value)}\n**Consensus:** ${MathEngine.formatNumber((simp+gauss+romb.value)/3)}`;
        } else if (expression.startsWith('newton:')) {
          const parts = expression.replace('newton:', '').split(',');
          const expr = parts[0].trim(), x0 = parseFloat(parts[1]);
          const f = (x) => MathEngine.evaluate(expr, { x });
          const df = (x) => MathEngine.numericalDerivative(f, x);
          const { root, steps: iters } = MathEngine.newtonRaphson(f, df, x0);
          result = MathEngine.formatNumber(root);
          steps = `Newton-Raphson: f(x) = ${expr}, x₀ = ${x0}\n\n` +
            iters.map(s => `Iter ${s.iteration}: x = ${MathEngine.formatNumber(s.x)}, f(x) = ${MathEngine.formatNumber(s.fx)}`).join('\n') +
            `\n\n**Root: ${result}**`;
        } else if (expression.startsWith('bisect:')) {
          const parts = expression.replace('bisect:', '').split(',');
          const expr = parts[0].trim(), a = parseFloat(parts[1]), b = parseFloat(parts[2]);
          const f = (x) => MathEngine.evaluate(expr, { x });
          const { root, steps: iters } = MathEngine.bisection(f, a, b);
          result = MathEngine.formatNumber(root);
          steps = `Bisection: f(x) = ${expr} on [${a}, ${b}]\n\n` +
            iters.slice(0, 15).map(s => `Iter ${s.iter}: [${s.a.toFixed(6)}, ${s.b.toFixed(6)}] → c=${s.c.toFixed(8)}`).join('\n') +
            `\n\n**Root: ${result}**`;
        } else if (expression.startsWith('secant:')) {
          const parts = expression.replace('secant:', '').split(',');
          const expr = parts[0].trim(), x0 = parseFloat(parts[1]), x1 = parseFloat(parts[2]);
          const f = (x) => MathEngine.evaluate(expr, { x });
          const { root, steps: iters } = MathEngine.secantMethod(f, x0, x1);
          result = MathEngine.formatNumber(root);
          steps = `Secant Method: f(x) = ${expr}, x₀=${x0}, x₁=${x1}\n\n` +
            iters.map(s => `Iter ${s.iter}: x = ${MathEngine.formatNumber(s.x)}, f(x) = ${MathEngine.formatNumber(s.fx)}`).join('\n') +
            `\n\n**Root: ${result}**`;
        } else if (expression.startsWith('arclength:')) {
          const parts = expression.replace('arclength:', '').split(',');
          const expr = parts[0].trim(), a = parseFloat(parts[1]), b = parseFloat(parts[2]);
          const f = (x) => MathEngine.evaluate(expr, { x });
          const len = MathEngine.arcLength(f, a, b);
          const curv = MathEngine.curvature2D(f, (a+b)/2);
          result = MathEngine.formatNumber(len);
          steps = `Arc length of f(x) = ${expr} from ${a} to ${b}\n**Length:** ${result}\n**Curvature at midpoint:** ${MathEngine.formatNumber(curv)}`;
        } else if (expression.startsWith('ode:')) {
          const parts = expression.replace('ode:', '').split(',');
          const expr = parts[0].trim(), t0 = parseFloat(parts[1]), y0 = parseFloat(parts[2]), tEnd = parseFloat(parts[3] || 5);
          const f = (t, y) => MathEngine.evaluate(expr, { t, y, x: t });
          const traj = MathEngine.rungeKutta4(f, t0, y0, tEnd, 0.05);
          const last = traj[traj.length - 1];
          result = `y(${MathEngine.formatNumber(last.t)}) = ${MathEngine.formatNumber(last.y)}`;
          const sample = traj.filter((_, i) => i % Math.max(1, Math.floor(traj.length / 8)) === 0);
          steps = `RK4 — dy/dt = ${expr}, y(${t0}) = ${y0}\n\n` +
            sample.map(s => `t = ${MathEngine.formatNumber(s.t)}, y = ${MathEngine.formatNumber(s.y)}`).join('\n') +
            `\n\n**${result}**`;
        } else {
          const resp = await aiSolve(expression, 'numerical');
          result = resp.solution;
          steps = `**Method:** ${resp.method}\n\n${resp.steps}\n\n## Verification\n${resp.verification}`;
        }
        break;
      }

      case 'linear_algebra': {
        if (expression.startsWith('det:')) {
          const m = JSON.parse(expression.replace('det:', ''));
          const det = MathEngine.determinant(m);
          result = MathEngine.formatNumber(det);
          steps = `det(A) = ${result}\nComputed via cofactor expansion (recursive)\nMatrix: ${JSON.stringify(m)}`;
        } else if (expression.startsWith('inverse:')) {
          const m = JSON.parse(expression.replace('inverse:', ''));
          const inv = MathEngine.matrixInverse(m);
          result = MathEngine.formatMatrix(inv);
          steps = `A⁻¹ via Gauss-Jordan elimination\nOriginal: ${JSON.stringify(m)}\n\nInverse:\n${result}`;
        } else if (expression.startsWith('multiply:')) {
          const parts = expression.replace('multiply:', '').split('*');
          const A = JSON.parse(parts[0]), B = JSON.parse(parts[1]);
          const C = MathEngine.matrixMultiply(A, B);
          result = MathEngine.formatMatrix(C);
          steps = `A × B\nA = ${JSON.stringify(A)}\nB = ${JSON.stringify(B)}\nResult:\n${result}`;
        } else if (expression.startsWith('eigen:')) {
          const m = JSON.parse(expression.replace('eigen:', ''));
          const eigs = MathEngine.eigenvalues2x2(m);
          result = eigs.map(e => typeof e === 'object' ? `${e.real.toFixed(4)} ± ${e.imag.toFixed(4)}i` : MathEngine.formatNumber(e)).join(', ');
          steps = `Eigenvalues of ${JSON.stringify(m)}\nCharacteristic eq: det(A - λI) = 0\nλ = ${result}\nTrace = ${m[0][0]+m[1][1]}, Det = ${MathEngine.determinant(m)}`;
        } else if (expression.startsWith('lu:')) {
          const m = JSON.parse(expression.replace('lu:', ''));
          const { L, U } = MathEngine.luDecomposition(m);
          result = `L·U decomposition computed`;
          steps = `LU Decomposition of ${JSON.stringify(m)}\n\nL:\n${MathEngine.formatMatrix(L)}\n\nU:\n${MathEngine.formatMatrix(U)}`;
        } else if (expression.startsWith('cross:')) {
          const parts = expression.replace('cross:', '').split('],[');
          const a = JSON.parse(parts[0] + ']'), b = JSON.parse('[' + parts[1]);
          const c = MathEngine.vectorCross3(a, b);
          const dot = MathEngine.vectorDot(a, b);
          const angle = MathEngine.vectorAngle(a, b);
          result = `[${c.map(v => MathEngine.formatNumber(v)).join(', ')}]`;
          steps = `Cross product a × b\na = [${a}]\nb = [${b}]\na × b = ${result}\n|a × b| = ${MathEngine.formatNumber(MathEngine.vectorNorm(c))}\nDot a·b = ${MathEngine.formatNumber(dot)}\nAngle = ${MathEngine.formatNumber(angle * 180 / Math.PI)}°`;
        } else if (expression.startsWith('cg:')) {
          const parts = expression.replace('cg:', '').split('|');
          const A = JSON.parse(parts[0]), b = JSON.parse(parts[1]);
          const x = MathEngine.conjugateGradient(A, b);
          result = `[${x.map(v => MathEngine.formatNumber(v)).join(', ')}]`;
          steps = `Conjugate Gradient solver\nAx = b\nA = ${JSON.stringify(A)}\nb = ${JSON.stringify(b)}\nSolution x = ${result}`;
        } else {
          const resp = await aiSolve(expression, 'general');
          result = resp.solution;
          steps = `**Method:** ${resp.method}\n\n${resp.steps}`;
        }
        break;
      }

      case 'statistics': {
        if (expression.startsWith('stats:')) {
          const data = JSON.parse(expression.replace('stats:', ''));
          const s = MathEngine.statistics(data);
          result = `μ=${MathEngine.formatNumber(s.mean)}, σ=${MathEngine.formatNumber(s.stdDev)}, n=${s.n}`;
          steps = `## Descriptive Statistics (n=${s.n})\n\n**Central Tendency**\n- Mean: ${MathEngine.formatNumber(s.mean)}\n- Median: ${s.median}\n- Mode: ${s.mode.join(', ')}\n\n**Dispersion**\n- Variance: ${MathEngine.formatNumber(s.variance)}\n- Std Dev: ${MathEngine.formatNumber(s.stdDev)}\n- IQR: ${MathEngine.formatNumber(s.iqr)}\n- Range: ${s.min} – ${s.max}\n\n**Shape**\n- Skewness: ${MathEngine.formatNumber(s.skewness)} ${s.skewness > 0 ? '(right-skewed)' : '(left-skewed)'}\n- Excess Kurtosis: ${MathEngine.formatNumber(s.kurtosis)}\n\n**Quartiles**\n- Q1: ${s.q1}, Q3: ${s.q3}`;
        } else if (expression.startsWith('regression:')) {
          const parts = expression.replace('regression:', '').split('],[');
          const x = JSON.parse(parts[0] + ']'), y = JSON.parse('[' + parts[1]);
          const r = MathEngine.linearRegression(x, y);
          result = `y = ${MathEngine.formatNumber(r.slope)}x + ${MathEngine.formatNumber(r.intercept)}`;
          steps = `## OLS Linear Regression\n\n**Equation:** ${result}\n**R²:** ${MathEngine.formatNumber(r.rSquared)}\n**Pearson r:** ${MathEngine.formatNumber(r.correlation)}\n**Slope:** ${MathEngine.formatNumber(r.slope)}\n**Intercept:** ${MathEngine.formatNumber(r.intercept)}`;
        } else if (expression.startsWith('normal:')) {
          const parts = expression.replace('normal:', '').split(',').map(Number);
          const val = MathEngine.normalDistribution(parts[0], parts[1] || 0, parts[2] || 1);
          result = MathEngine.formatNumber(val);
          steps = `Normal PDF: N(${parts[0]}; μ=${parts[1]||0}, σ=${parts[2]||1})\nPDF = ${result}`;
        } else if (expression.startsWith('ttest:')) {
          const parts = expression.replace('ttest:', '').split('],[');
          const s1 = JSON.parse(parts[0] + ']'), s2 = JSON.parse('[' + parts[1]);
          const t = MathEngine.tTest(s1, s2);
          result = `t = ${MathEngine.formatNumber(t.t)}, df = ${t.df}`;
          steps = `## Welch's t-Test\n\n**t-statistic:** ${MathEngine.formatNumber(t.t)}\n**Degrees of freedom:** ${t.df}\n**Mean difference:** ${MathEngine.formatNumber(t.meanDiff)}\n**Standard error:** ${MathEngine.formatNumber(t.se)}\n\n**Interpretation:** ${Math.abs(t.t) > 2 ? 'Significant difference (|t| > 2)' : 'No significant difference'}`;
        } else if (expression.startsWith('entropy:')) {
          const probs = JSON.parse(expression.replace('entropy:', ''));
          const H = MathEngine.shannonEntropy(probs);
          result = `H = ${MathEngine.formatNumber(H)} bits`;
          steps = `Shannon Entropy\nH = -Σ pᵢ log₂(pᵢ) = ${MathEngine.formatNumber(H)} bits\nMax entropy: ${MathEngine.formatNumber(Math.log2(probs.length))} bits`;
        } else {
          const resp = await aiSolve(expression, 'general');
          result = resp.solution;
          steps = resp.steps;
        }
        break;
      }

      case 'number_theory': {
        if (expression.startsWith('crt:')) {
          const [remPart, modPart] = expression.replace('crt:', '').split('|');
          const rem = remPart.split(',').map(Number), mods = modPart.split(',').map(Number);
          const val = MathEngine.chineseRemainderTheorem(rem, mods);
          result = String(val);
          steps = `Chinese Remainder Theorem\nRemainders: [${rem}]\nModuli: [${mods}]\nSolution: x ≡ ${val} (mod ${mods.reduce((a,b)=>a*b,1)})`;
        } else if (expression.startsWith('collatz:')) {
          const n = parseInt(expression.replace('collatz:', ''));
          const { sequence, steps: s } = MathEngine.collatz(n);
          result = `${s} steps, max = ${Math.max(...sequence)}`;
          steps = `Collatz (3n+1) sequence for ${n}\nSteps: ${s}, Max: ${Math.max(...sequence)}\n\n${sequence.join(' → ')}`;
        } else if (expression.startsWith('bell:')) {
          const n = parseInt(expression.replace('bell:', ''));
          result = String(MathEngine.bellNumber(n));
          steps = `Bell number B(${n}) = ${result}\nCounts partitions of a set with ${n} elements`;
        } else if (expression.startsWith('catalan:')) {
          const n = parseInt(expression.replace('catalan:', ''));
          result = String(MathEngine.catalanNumber(n));
          steps = `Catalan number C(${n}) = C(2n,n)/(n+1) = ${result}\nCounts valid bracket sequences, BST structures, triangulations...`;
        } else if (expression.startsWith('stirling:')) {
          const parts = expression.replace('stirling:', '').split(',').map(Number);
          result = String(MathEngine.stirlingSecond(parts[0], parts[1]));
          steps = `Stirling number of the 2nd kind S(${parts[0]},${parts[1]}) = ${result}\nNumber of ways to partition ${parts[0]} elements into ${parts[1]} non-empty subsets`;
        } else if (expression.startsWith('partition:')) {
          const n = parseInt(expression.replace('partition:', ''));
          result = String(MathEngine.partitionCount(n));
          steps = `Integer partition p(${n}) = ${result}\nNumber of ways to write ${n} as an ordered sum`;
        } else if (expression.startsWith('mobius:')) {
          const n = parseInt(expression.replace('mobius:', ''));
          result = String(MathEngine.mobiusFunction(n));
          steps = `Möbius function μ(${n}) = ${result}\n${result === '0' ? 'Has repeated prime factor' : `${Object.keys(MathEngine.primeFactorization(n)).length} distinct prime factors`}`;
        } else if (expression.startsWith('bigfact:')) {
          const n = parseInt(expression.replace('bigfact:', ''));
          const val = MathEngine.bigFactorial(Math.min(n, 200));
          result = val.toString();
          steps = `${n}! = ${result}\n(${result.length} digits)`;
        } else if (expression.startsWith('isprime:')) {
          const n = parseInt(expression.replace('isprime:', ''));
          const basicPrime = MathEngine.isPrime(n);
          const mrPrime = MathEngine.millerRabin(n, 20);
          const prime = basicPrime && mrPrime;
          result = prime ? `${n} is PRIME ✓` : `${n} is COMPOSITE`;
          if (!prime) {
            const factors = MathEngine.primeFactorization(n);
            const pRho = MathEngine.pollardRho(n);
            steps = `**Trial Division:** COMPOSITE\n**Miller-Rabin (k=20):** COMPOSITE\n**Pollard's ρ factor:** ${pRho}\n\n**Prime factorization:** ${Object.entries(factors).map(([p, e]) => e > 1 ? `${p}^${e}` : p).join(' × ')}\n**Euler φ(${n}) = ${MathEngine.eulerTotient(n)}**\n**Möbius μ(${n}) = ${MathEngine.mobiusFunction(n)}**`;
          } else {
            steps = `**Trial division up to √${n} ≈ ${Math.floor(Math.sqrt(n))}:** PRIME\n**Miller-Rabin (k=20 witnesses):** PRIME\nProbability of error < 4⁻²⁰ ≈ ${(4**-20).toExponential(2)}`;
          }
        } else if (expression.startsWith('factor:')) {
          const n = parseInt(expression.replace('factor:', ''));
          const factors = MathEngine.primeFactorization(n);
          const pRho = MathEngine.pollardRho(n);
          result = Object.entries(factors).map(([p, e]) => e > 1 ? `${p}^${e}` : p).join(' × ');
          steps = `Factorization of ${n}\n**Result:** ${result}\n**Pollard's ρ factor:** ${pRho || 'N/A'}\n**φ(${n}) = ${MathEngine.eulerTotient(n)}**\n**μ(${n}) = ${MathEngine.mobiusFunction(n)}**\n**Perfect number?** ${MathEngine.isPerf(n)}\n**Divisors:** ${Object.entries(factors).reduce((s, [, e]) => s * (e+1), 1)}`;
        } else if (expression.startsWith('totient:')) {
          const n = parseInt(expression.replace('totient:', ''));
          result = String(MathEngine.eulerTotient(n));
          steps = `Euler's totient φ(${n}) = ${result}`;
        } else if (expression.startsWith('fibonacci:')) {
          const n = parseInt(expression.replace('fibonacci:', ''));
          const val = n <= 78 ? MathEngine.fibonacci(n) : MathEngine.bigFibonacci(n);
          result = val.toLocaleString();
          steps = `F(${n}) = ${result}\nAlgorithm: ${n <= 78 ? 'Matrix exponentiation O(log n)' : 'BigInt iteration'}\nφⁿ/√5 approximation`;
        } else if (expression.startsWith('sieve:')) {
          const n = parseInt(expression.replace('sieve:', ''));
          const primes = MathEngine.sieveOfEratosthenes(Math.min(n, 100000));
          result = `${primes.length} primes ≤ ${n}`;
          steps = `Sieve of Eratosthenes up to ${n}\nFound **${primes.length}** primes\n\n${primes.slice(0, 100).join(', ')}${primes.length > 100 ? `... (+${primes.length-100} more)` : ''}`;
        } else if (expression.startsWith('gcd:')) {
          const parts = expression.replace('gcd:', '').split(',').map(Number);
          const g = MathEngine.gcd(parts[0], parts[1]);
          const ext = MathEngine.extendedGCD(parts[0], parts[1]);
          result = `GCD = ${g}`;
          steps = `**Euclidean Algorithm:** GCD(${parts[0]}, ${parts[1]}) = ${g}\n**Extended GCD (Bézout):** ${ext.x}·${parts[0]} + ${ext.y}·${parts[1]} = ${g}\n**LCM:** ${MathEngine.lcm(parts[0], parts[1])}`;
        } else if (expression.startsWith('cf:')) {
          const val = parseFloat(expression.replace('cf:', ''));
          const terms = MathEngine.continuedFraction(val, 20);
          const convs = MathEngine.continuedFractionConvergents(terms);
          result = `[${terms.join('; ')}]`;
          steps = `Continued fraction expansion of ${val}\n${result}\n\n**Convergents:**\n${convs.map(c => `${c.p}/${c.q} = ${c.value.toFixed(10)}`).join('\n')}`;
        } else {
          const resp = await aiSolve(expression, 'general');
          result = resp.solution;
          steps = `**Method:** ${resp.method}\n\n${resp.steps}`;
        }
        break;
      }

      case 'symbolic': {
        if (expression.startsWith('complex:')) {
          // complex:re1,im1,op,re2,im2
          const parts = expression.replace('complex:', '').split(',');
          const a = new MathEngine.Complex(parseFloat(parts[0]), parseFloat(parts[1]));
          const op = parts[2];
          const b = new MathEngine.Complex(parseFloat(parts[3]), parseFloat(parts[4]));
          const ops = { '+': a.add(b), '-': a.sub(b), '*': a.mul(b), '/': a.div(b) };
          const res = ops[op] || a;
          result = res.toString();
          steps = `Complex arithmetic\n(${a}) ${op} (${b}) = ${result}\n|result| = ${MathEngine.formatNumber(res.abs())}\narg = ${MathEngine.formatNumber(res.arg())} rad = ${MathEngine.formatNumber(res.arg()*180/Math.PI)}°`;
        } else if (expression.startsWith('quat:')) {
          const parts = expression.replace('quat:', '').split('|').map(p => p.split(',').map(Number));
          const q1 = new MathEngine.Quaternion(...parts[0]);
          const q2 = new MathEngine.Quaternion(...parts[1]);
          result = q1.mul(q2).toString();
          steps = `Quaternion multiplication\nq1 = ${q1}\nq2 = ${q2}\nq1 × q2 = ${result}\n|q1| = ${MathEngine.formatNumber(q1.norm())}`;
        } else if (expression.startsWith('mandelbrot:')) {
          const [cx, cy] = expression.replace('mandelbrot:', '').split(',').map(Number);
          const iters = MathEngine.mandelbrotIterations(cx, cy, 1000);
          result = iters < 1000 ? `Escapes after ${iters} iterations` : `In Mandelbrot set (1000 iter)`;
          steps = `Mandelbrot set test for c = ${cx} + ${cy}i\nz_{n+1} = z_n² + c, z_0 = 0\nIterations: ${iters}\n${iters < 1000 ? `Escape radius exceeded at iter ${iters}` : 'Bounded — in the set'}`;
        } else if (expression.startsWith('entropy:')) {
          const probs = JSON.parse(expression.replace('entropy:', ''));
          const H = MathEngine.shannonEntropy(probs);
          result = `H = ${MathEngine.formatNumber(H)} bits`;
          steps = `Shannon entropy H = -Σ pᵢ log₂(pᵢ)\nProbabilities: [${probs}]\nH = ${MathEngine.formatNumber(H)} bits\nMax entropy (uniform): ${MathEngine.formatNumber(Math.log2(probs.length))} bits`;
        } else if (expression.startsWith('autocorr:')) {
          const parts = expression.replace('autocorr:', '').split('|');
          const data = JSON.parse(parts[0]), lag = parseInt(parts[1] || '1');
          const ac = MathEngine.autocorrelation(data, lag);
          result = MathEngine.formatNumber(ac);
          steps = `Autocorrelation at lag ${lag}\nData: [${data}]\nρ(${lag}) = ${result}`;
        } else if (expression.startsWith('ga:')) {
          // Genetic algorithm: minimize expression
          const expr = expression.replace('ga:', '');
          const fitness = ([x]) => { try { return MathEngine.evaluate(expr, { x }); } catch { return Infinity; } };
          const best = MathEngine.geneticAlgorithm(fitness, 1, 80, 300, 0.15);
          result = `x = ${best.genome[0].toFixed(6)}, f(x) = ${best.fitness.toFixed(6)}`;
          steps = `Genetic Algorithm minimization of f(x) = ${expr}\nPopulation: 80, Generations: 300, Mutation: 15%\n**Best: ${result}**`;
        } else {
          const resp = await aiSolve(expression, 'general');
          result = resp.solution;
          steps = `**Method:** ${resp.method}\n\n${resp.steps}\n\n## Verification\n${resp.verification}`;
        }
        break;
      }

      case 'graph_theory': {
        if (expression.startsWith('dijkstra:')) {
          const [graphStr, start] = expression.replace('dijkstra:', '').split('|');
          const graph = JSON.parse(graphStr);
          const { distances, previous } = MathEngine.dijkstra(graph, start);
          result = Object.entries(distances).map(([n, d]) => `${n}: ${d === Infinity ? '∞' : d}`).join(', ');
          steps = `Dijkstra's Algorithm from node "${start}"\n\n**Shortest distances:**\n${Object.entries(distances).map(([n,d]) => `  ${n}: ${d === Infinity ? '∞' : d}`).join('\n')}\n\n**Predecessor map:**\n${Object.entries(previous).map(([n,p]) => `  ${n} ← ${p}`).join('\n')}`;
        } else if (expression.startsWith('kruskal:')) {
          const parts = expression.replace('kruskal:', '').split('|');
          const nodes = parts[0].split(',');
          const edges = parts.slice(1).map(e => { const [u,v,w] = e.split(','); return { u, v, weight: parseFloat(w) }; });
          const { edges: mst, totalWeight } = MathEngine.kruskalMST(edges, nodes);
          result = `MST weight: ${totalWeight}, edges: ${mst.length}`;
          steps = `Kruskal's MST Algorithm\nNodes: [${nodes}]\n\n**MST edges:**\n${mst.map(e => `  ${e.u} — ${e.v} (${e.weight})`).join('\n')}\n\n**Total weight:** ${totalWeight}`;
        } else if (expression.startsWith('toposort:')) {
          const graph = JSON.parse(expression.replace('toposort:', ''));
          const order = MathEngine.topologicalSort(graph);
          result = order.join(' → ');
          steps = `Topological Sort (DFS-based)\nGraph: ${JSON.stringify(graph)}\n\nOrder: ${result}`;
        } else {
          const resp = await aiSolve(expression, 'general');
          result = resp.solution;
          steps = `**Method:** ${resp.method}\n\n## Solution\n${resp.steps}\n\n## Verification\n${resp.verification}\n\n## Complexity\n${resp.complexity}`;
        }
        break;
      }

      default: {
        const val = MathEngine.evaluate(expression);
        result = MathEngine.formatNumber(val);
      }
    }
  } catch (err) {
    // Fallback to AI
    const resp = await aiSolve(`${expression} (Error from local engine: ${err.message}. Please solve directly.)`, 'general');
    result = resp.solution;
    steps = `*Local engine error: ${err.message} — solved by AI*\n\n${resp.steps}`;
  }

  return { result, steps, executionTime: Math.round(performance.now() - t0), mode };
}
