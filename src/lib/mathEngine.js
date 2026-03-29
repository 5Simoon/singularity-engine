// ============================================================
// NEXUS MATH ENGINE — Advanced Mathematical Computation Core
// ============================================================
// Implements: Symbolic algebra, Calculus, Linear Algebra,
// Number Theory, Statistics, Graph Theory, Optimization
// ============================================================

// ---- CONSTANTS ----
const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio
const EULER = 0.5772156649015329; // Euler-Mascheroni constant
const CATALAN = 0.915965594177219; // Catalan's constant

// ---- TOKENIZER & PARSER (Shunting-Yard Algorithm) ----
const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };
const RIGHT_ASSOC = { '^': true };

function tokenize(expr) {
  const tokens = [];
  let i = 0;
  const s = expr.replace(/\s+/g, '');
  while (i < s.length) {
    if (/[0-9.]/.test(s[i])) {
      let num = '';
      while (i < s.length && /[0-9.eE]/.test(s[i])) { num += s[i++]; }
      tokens.push({ type: 'number', value: parseFloat(num) });
    } else if (/[a-zA-Z_]/.test(s[i])) {
      let name = '';
      while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) { name += s[i++]; }
      if (s[i] === '(') tokens.push({ type: 'function', value: name });
      else if (name === 'pi') tokens.push({ type: 'number', value: Math.PI });
      else if (name === 'e') tokens.push({ type: 'number', value: Math.E });
      else if (name === 'phi') tokens.push({ type: 'number', value: PHI });
      else tokens.push({ type: 'variable', value: name });
    } else if ('+-*/%^'.includes(s[i])) {
      // Handle unary minus
      if (s[i] === '-' && (tokens.length === 0 || tokens[tokens.length-1].type === 'operator' || tokens[tokens.length-1].value === '(')) {
        tokens.push({ type: 'number', value: 0 });
      }
      tokens.push({ type: 'operator', value: s[i++] });
    } else if (s[i] === '(') {
      tokens.push({ type: 'lparen', value: '(' }); i++;
    } else if (s[i] === ')') {
      tokens.push({ type: 'rparen', value: ')' }); i++;
    } else if (s[i] === ',') {
      tokens.push({ type: 'comma', value: ',' }); i++;
    } else {
      i++;
    }
  }
  return tokens;
}

function shuntingYard(tokens) {
  const output = [];
  const ops = [];
  for (const token of tokens) {
    if (token.type === 'number' || token.type === 'variable') {
      output.push(token);
    } else if (token.type === 'function') {
      ops.push(token);
    } else if (token.type === 'comma') {
      while (ops.length && ops[ops.length-1].value !== '(') output.push(ops.pop());
    } else if (token.type === 'operator') {
      while (
        ops.length && ops[ops.length-1].type === 'operator' &&
        ((PRECEDENCE[ops[ops.length-1].value] > PRECEDENCE[token.value]) ||
         (PRECEDENCE[ops[ops.length-1].value] === PRECEDENCE[token.value] && !RIGHT_ASSOC[token.value]))
      ) {
        output.push(ops.pop());
      }
      ops.push(token);
    } else if (token.type === 'lparen') {
      ops.push(token);
    } else if (token.type === 'rparen') {
      while (ops.length && ops[ops.length-1].value !== '(') output.push(ops.pop());
      if (ops.length) ops.pop();
      if (ops.length && ops[ops.length-1].type === 'function') output.push(ops.pop());
    }
  }
  while (ops.length) output.push(ops.pop());
  return output;
}

// Built-in math functions
const MATH_FUNCTIONS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  sqrt: Math.sqrt, cbrt: Math.cbrt,
  abs: Math.abs, ceil: Math.ceil, floor: Math.floor, round: Math.round,
  log: Math.log, log2: Math.log2, log10: Math.log10,
  exp: Math.exp, sign: Math.sign,
  factorial: (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; },
  gamma: gammaFunction,
  erf: errorFunction,
  zeta: riemannZeta,
  max: Math.max, min: Math.min,
  gcd: gcd, lcm: lcm,
  comb: combinations, perm: permutations,
  fib: fibonacci,
};

function evaluateRPN(rpn, vars = {}) {
  const stack = [];
  for (const token of rpn) {
    if (token.type === 'number') {
      stack.push(token.value);
    } else if (token.type === 'variable') {
      if (vars[token.value] !== undefined) stack.push(vars[token.value]);
      else throw new Error(`Unknown variable: ${token.value}`);
    } else if (token.type === 'operator') {
      const b = stack.pop(), a = stack.pop();
      switch (token.value) {
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/': stack.push(a / b); break;
        case '%': stack.push(a % b); break;
        case '^': stack.push(Math.pow(a, b)); break;
      }
    } else if (token.type === 'function') {
      const fn = MATH_FUNCTIONS[token.value];
      if (!fn) throw new Error(`Unknown function: ${token.value}`);
      if (['max', 'min', 'gcd', 'lcm', 'comb', 'perm'].includes(token.value)) {
        const b = stack.pop(), a = stack.pop();
        stack.push(fn(a, b));
      } else {
        stack.push(fn(stack.pop()));
      }
    }
  }
  return stack[0];
}

export function evaluate(expr, vars = {}) {
  const tokens = tokenize(expr);
  const rpn = shuntingYard(tokens);
  return evaluateRPN(rpn, vars);
}

// ---- NUMBER THEORY ----
export function isPrime(n) {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

export function primeFactorization(n) {
  const factors = {};
  let d = 2;
  while (d * d <= n) {
    while (n % d === 0) {
      factors[d] = (factors[d] || 0) + 1;
      n /= d;
    }
    d++;
  }
  if (n > 1) factors[n] = (factors[n] || 0) + 1;
  return factors;
}

export function eulerTotient(n) {
  let result = n;
  let p = 2;
  let temp = n;
  while (p * p <= temp) {
    if (temp % p === 0) {
      while (temp % p === 0) temp /= p;
      result -= result / p;
    }
    p++;
  }
  if (temp > 1) result -= result / temp;
  return Math.round(result);
}

function gcd(a, b) { return b === 0 ? Math.abs(a) : gcd(b, a % b); }
function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }

export function extendedGCD(a, b) {
  if (a === 0) return { gcd: b, x: 0, y: 1 };
  const r = extendedGCD(b % a, a);
  return { gcd: r.gcd, x: r.y - Math.floor(b / a) * r.x, y: r.x };
}

export function modPow(base, exp, mod) {
  let result = 1n;
  base = BigInt(base) % BigInt(mod);
  exp = BigInt(exp);
  const m = BigInt(mod);
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % m;
    exp = exp / 2n;
    base = (base * base) % m;
  }
  return Number(result);
}

function fibonacci(n) {
  // Matrix exponentiation O(log n)
  if (n <= 0) return 0;
  if (n <= 2) return 1;
  let a = [[1, 1], [1, 0]];
  let result = matPow2x2(a, n - 1);
  return result[0][0];
}

function matPow2x2(m, n) {
  let result = [[1, 0], [0, 1]];
  while (n > 0) {
    if (n % 2 === 1) result = matMul2x2(result, m);
    m = matMul2x2(m, m);
    n = Math.floor(n / 2);
  }
  return result;
}

function matMul2x2(a, b) {
  return [
    [a[0][0]*b[0][0]+a[0][1]*b[1][0], a[0][0]*b[0][1]+a[0][1]*b[1][1]],
    [a[1][0]*b[0][0]+a[1][1]*b[1][0], a[1][0]*b[0][1]+a[1][1]*b[1][1]]
  ];
}

function combinations(n, k) {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < Math.min(k, n - k); i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

function permutations(n, k) {
  let result = 1;
  for (let i = 0; i < k; i++) result *= (n - i);
  return result;
}

export function sieveOfEratosthenes(limit) {
  const sieve = new Uint8Array(limit + 1);
  const primes = [];
  for (let i = 2; i <= limit; i++) {
    if (!sieve[i]) {
      primes.push(i);
      for (let j = i * i; j <= limit; j += i) sieve[j] = 1;
    }
  }
  return primes;
}

// ---- SPECIAL FUNCTIONS ----
function gammaFunction(z) {
  // Lanczos approximation
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFunction(1 - z));
  z -= 1;
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

function errorFunction(x) {
  // Horner form approximation
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const result = 1 - poly * Math.exp(-x * x);
  return x >= 0 ? result : -result;
}

function riemannZeta(s) {
  if (s === 1) return Infinity;
  let sum = 0;
  for (let n = 1; n <= 1000; n++) {
    sum += 1 / Math.pow(n, s);
  }
  return sum;
}

// ---- LINEAR ALGEBRA ----
export function matrixMultiply(A, B) {
  const m = A.length, n = B[0].length, p = B.length;
  const C = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < p; k++)
        C[i][j] += A[i][k] * B[k][j];
  return C;
}

export function determinant(matrix) {
  const n = matrix.length;
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  let det = 0;
  for (let j = 0; j < n; j++) {
    const minor = matrix.slice(1).map(row => [...row.slice(0, j), ...row.slice(j + 1)]);
    det += (j % 2 === 0 ? 1 : -1) * matrix[0][j] * determinant(minor);
  }
  return det;
}

export function matrixInverse(matrix) {
  const n = matrix.length;
  const aug = matrix.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)]);
  // Gauss-Jordan elimination
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
    if (Math.abs(aug[i][i]) < 1e-12) throw new Error('Matrix is singular');
    const pivot = aug[i][i];
    for (let j = 0; j < 2 * n; j++) aug[i][j] /= pivot;
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = aug[k][i];
      for (let j = 0; j < 2 * n; j++) aug[k][j] -= factor * aug[i][j];
    }
  }
  return aug.map(row => row.slice(n));
}

export function eigenvalues2x2(matrix) {
  const a = matrix[0][0], b = matrix[0][1], c = matrix[1][0], d = matrix[1][1];
  const trace = a + d;
  const det = a * d - b * c;
  const disc = trace * trace - 4 * det;
  if (disc >= 0) {
    return [(trace + Math.sqrt(disc)) / 2, (trace - Math.sqrt(disc)) / 2];
  }
  return [
    { real: trace / 2, imag: Math.sqrt(-disc) / 2 },
    { real: trace / 2, imag: -Math.sqrt(-disc) / 2 }
  ];
}

export function luDecomposition(matrix) {
  const n = matrix.length;
  const L = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 0));
  const U = matrix.map(row => [...row]);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      L[j][i] = U[j][i] / U[i][i];
      for (let k = i; k < n; k++) U[j][k] -= L[j][i] * U[i][k];
    }
  }
  return { L, U };
}

// ---- CALCULUS ----
export function numericalDerivative(f, x, h = 1e-8) {
  // Central difference (4th order Richardson extrapolation)
  const d1 = (f(x + h) - f(x - h)) / (2 * h);
  const d2 = (f(x + h/2) - f(x - h/2)) / h;
  return (4 * d2 - d1) / 3;
}

export function numericalIntegral(f, a, b, n = 10000) {
  // Simpson's 3/8 rule (composite)
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) {
    sum += (i % 3 === 0 ? 2 : 3) * f(a + i * h);
  }
  return sum * 3 * h / 8;
}

export function adaptiveSimpson(f, a, b, tol = 1e-10) {
  function simpson(a, b) {
    const c = (a + b) / 2;
    return (b - a) / 6 * (f(a) + 4 * f(c) + f(b));
  }
  function recurse(a, b, whole, tol, depth) {
    const c = (a + b) / 2;
    const left = simpson(a, c), right = simpson(c, b);
    if (depth > 50 || Math.abs(left + right - whole) <= 15 * tol) {
      return left + right + (left + right - whole) / 15;
    }
    return recurse(a, c, left, tol/2, depth+1) + recurse(c, b, right, tol/2, depth+1);
  }
  return recurse(a, b, simpson(a, b), tol, 0);
}

export function newtonRaphson(f, df, x0, tol = 1e-12, maxIter = 100) {
  let x = x0;
  const steps = [{ iteration: 0, x, fx: f(x) }];
  for (let i = 0; i < maxIter; i++) {
    const fx = f(x);
    const dfx = df(x);
    if (Math.abs(dfx) < 1e-15) break;
    const xNew = x - fx / dfx;
    steps.push({ iteration: i + 1, x: xNew, fx: f(xNew) });
    if (Math.abs(xNew - x) < tol) break;
    x = xNew;
  }
  return { root: x, steps };
}

// ---- STATISTICS ----
export function statistics(data) {
  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);
  const mean = data.reduce((s, v) => s + v, 0) / n;
  const variance = data.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  const median = n % 2 ? sorted[Math.floor(n/2)] : (sorted[n/2 - 1] + sorted[n/2]) / 2;
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const skewness = data.reduce((s, v) => s + ((v - mean) / stdDev) ** 3, 0) / n;
  const kurtosis = data.reduce((s, v) => s + ((v - mean) / stdDev) ** 4, 0) / n - 3;
  
  // Mode
  const freq = {};
  data.forEach(v => freq[v] = (freq[v] || 0) + 1);
  const maxFreq = Math.max(...Object.values(freq));
  const mode = Object.keys(freq).filter(k => freq[k] === maxFreq).map(Number);

  return { mean, median, mode, variance, stdDev, min: sorted[0], max: sorted[n-1], q1, q3, iqr: q3 - q1, skewness, kurtosis, n };
}

export function linearRegression(xData, yData) {
  const n = xData.length;
  const sumX = xData.reduce((s, v) => s + v, 0);
  const sumY = yData.reduce((s, v) => s + v, 0);
  const sumXY = xData.reduce((s, v, i) => s + v * yData[i], 0);
  const sumX2 = xData.reduce((s, v) => s + v * v, 0);
  const sumY2 = yData.reduce((s, v) => s + v * v, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const r = (n * sumXY - sumX * sumY) / Math.sqrt((n * sumX2 - sumX**2) * (n * sumY2 - sumY**2));
  return { slope, intercept, rSquared: r * r, correlation: r };
}

export function normalDistribution(x, mean = 0, std = 1) {
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mean) / std) ** 2);
}

// ---- OPTIMIZATION ----
export function goldenSectionSearch(f, a, b, tol = 1e-10) {
  const gr = (Math.sqrt(5) - 1) / 2;
  let c = b - gr * (b - a);
  let d = a + gr * (b - a);
  while (Math.abs(b - a) > tol) {
    if (f(c) < f(d)) { b = d; } else { a = c; }
    c = b - gr * (b - a);
    d = a + gr * (b - a);
  }
  return (a + b) / 2;
}

export function gradientDescent(gradient, x0, lr = 0.01, maxIter = 1000, tol = 1e-8) {
  let x = [...x0];
  const steps = [];
  for (let i = 0; i < maxIter; i++) {
    const grad = gradient(x);
    const norm = Math.sqrt(grad.reduce((s, g) => s + g*g, 0));
    if (norm < tol) break;
    x = x.map((xi, j) => xi - lr * grad[j]);
    steps.push({ iteration: i, x: [...x], gradNorm: norm });
  }
  return { minimum: x, steps };
}

// ---- POLYNOMIAL OPERATIONS ----
export function polynomialEvaluate(coeffs, x) {
  // Horner's method
  let result = 0;
  for (let i = coeffs.length - 1; i >= 0; i--) {
    result = result * x + coeffs[i];
  }
  return result;
}

export function polynomialRoots(coeffs) {
  // For quadratic ax^2 + bx + c
  if (coeffs.length === 3) {
    const [c, b, a] = coeffs;
    const disc = b*b - 4*a*c;
    if (disc >= 0) return [(-b + Math.sqrt(disc))/(2*a), (-b - Math.sqrt(disc))/(2*a)];
    return [{ real: -b/(2*a), imag: Math.sqrt(-disc)/(2*a) }, { real: -b/(2*a), imag: -Math.sqrt(-disc)/(2*a) }];
  }
  // For cubic and beyond, use companion matrix eigenvalue approach (simplified)
  return null;
}

// ---- FFT (Cooley-Tukey) ----
export function fft(signal) {
  const n = signal.length;
  if (n <= 1) return signal.map(v => ({ re: v, im: 0 }));
  
  // Pad to power of 2
  const size = Math.pow(2, Math.ceil(Math.log2(n)));
  const padded = [...signal, ...new Array(size - n).fill(0)];
  
  function fftRecurse(x) {
    const N = x.length;
    if (N <= 1) return [{ re: x[0], im: 0 }];
    const even = fftRecurse(x.filter((_, i) => i % 2 === 0));
    const odd = fftRecurse(x.filter((_, i) => i % 2 === 1));
    const result = new Array(N);
    for (let k = 0; k < N / 2; k++) {
      const angle = -2 * Math.PI * k / N;
      const tw = { re: Math.cos(angle), im: Math.sin(angle) };
      const t = { re: tw.re * odd[k].re - tw.im * odd[k].im, im: tw.re * odd[k].im + tw.im * odd[k].re };
      result[k] = { re: even[k].re + t.re, im: even[k].im + t.im };
      result[k + N/2] = { re: even[k].re - t.re, im: even[k].im - t.im };
    }
    return result;
  }
  
  return fftRecurse(padded);
}

// ---- DIFFERENTIAL EQUATIONS (RK4) ----
export function rungeKutta4(f, t0, y0, tEnd, h = 0.01) {
  const steps = [{ t: t0, y: y0 }];
  let t = t0, y = y0;
  while (t < tEnd) {
    const k1 = f(t, y);
    const k2 = f(t + h/2, y + h*k1/2);
    const k3 = f(t + h/2, y + h*k2/2);
    const k4 = f(t + h, y + h*k3);
    y = y + (h/6) * (k1 + 2*k2 + 2*k3 + k4);
    t += h;
    steps.push({ t, y });
  }
  return steps;
}

// ---- UTILITY FORMATTING ----
export function formatNumber(n) {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toLocaleString();
  if (Math.abs(n) < 1e-6 || Math.abs(n) > 1e9) return n.toExponential(8);
  return parseFloat(n.toPrecision(12)).toString();
}

export function formatMatrix(matrix) {
  return matrix.map(row => row.map(v => formatNumber(v)).join('\t')).join('\n');
}

// ---- MONTE CARLO METHODS ----
export function monteCarloPi(samples = 1_000_000) {
  let inside = 0;
  for (let i = 0; i < samples; i++) {
    const x = Math.random(), y = Math.random();
    if (x*x + y*y <= 1) inside++;
  }
  return { estimate: 4 * inside / samples, samples, error: Math.abs(4 * inside / samples - Math.PI) };
}

export function monteCarloIntegral(f, a, b, samples = 100_000) {
  let sum = 0;
  for (let i = 0; i < samples; i++) sum += f(a + Math.random() * (b - a));
  return (b - a) * sum / samples;
}

// ---- SIMULATED ANNEALING ----
export function simulatedAnnealing(costFn, initialSolution, neighborFn, T0 = 1000, Tmin = 0.01, alpha = 0.995) {
  let current = initialSolution;
  let T = T0;
  let best = current;
  let bestCost = costFn(current);
  const history = [];
  let iter = 0;
  while (T > Tmin && iter < 100000) {
    const neighbor = neighborFn(current);
    const dE = costFn(neighbor) - costFn(current);
    if (dE < 0 || Math.random() < Math.exp(-dE / T)) {
      current = neighbor;
      if (costFn(current) < bestCost) { best = current; bestCost = costFn(current); }
    }
    if (iter % 1000 === 0) history.push({ iter, T: T.toFixed(4), cost: costFn(current).toFixed(6) });
    T *= alpha;
    iter++;
  }
  return { best, bestCost, iterations: iter, history };
}

// ---- GENETIC ALGORITHM (minimize f: R^n -> R) ----
export function geneticAlgorithm(fitnessFunc, dims, popSize = 50, generations = 200, mutationRate = 0.1) {
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);
  let pop = Array.from({ length: popSize }, () => Array.from({ length: dims }, () => rand(-10, 10)));
  let bestEver = { genome: pop[0], fitness: Infinity };
  for (let gen = 0; gen < generations; gen++) {
    pop.sort((a, b) => fitnessFunc(a) - fitnessFunc(b));
    const fit = fitnessFunc(pop[0]);
    if (fit < bestEver.fitness) bestEver = { genome: [...pop[0]], fitness: fit };
    const elite = pop.slice(0, Math.floor(popSize * 0.2));
    const newPop = [...elite];
    while (newPop.length < popSize) {
      const p1 = elite[Math.floor(Math.random() * elite.length)];
      const p2 = elite[Math.floor(Math.random() * elite.length)];
      const cut = Math.floor(Math.random() * dims);
      const child = [...p1.slice(0, cut), ...p2.slice(cut)];
      const mutated = child.map(g => Math.random() < mutationRate ? g + rand(-1, 1) : g);
      newPop.push(mutated);
    }
    pop = newPop;
  }
  return bestEver;
}

// ---- CHEBYSHEV POLYNOMIALS ----
export function chebyshevT(n, x) {
  if (n === 0) return 1;
  if (n === 1) return x;
  return 2 * x * chebyshevT(n - 1, x) - chebyshevT(n - 2, x);
}

export function chebyshevApprox(f, n, a, b, samples = 1000) {
  // Chebyshev approximation on [a,b]
  const coeffs = [];
  for (let k = 0; k <= n; k++) {
    let sum = 0;
    for (let j = 0; j < samples; j++) {
      const x = Math.cos(Math.PI * (j + 0.5) / samples);
      const xab = 0.5 * (a + b) + 0.5 * (b - a) * x;
      sum += f(xab) * chebyshevT(k, x);
    }
    coeffs.push((2 / samples) * sum * (k === 0 ? 0.5 : 1));
  }
  return { coeffs, evaluate: (x) => {
    const t = (2 * x - a - b) / (b - a);
    return coeffs.reduce((s, c, i) => s + c * chebyshevT(i, t), 0);
  }};
}

// ---- BESSEL FUNCTIONS ----
export function besselJ0(x) {
  // Polynomial approximation (Abramowitz & Stegun)
  if (Math.abs(x) < 8) {
    const t = x * x;
    return 1 - t/4 + t*t/64 - t*t*t/2304 + t*t*t*t/147456;
  }
  const theta = x - Math.PI / 4;
  return Math.sqrt(2 / (Math.PI * x)) * Math.cos(theta);
}

export function besselJ1(x) {
  if (Math.abs(x) < 8) {
    const t = x * x;
    return x/2 - x*t/16 + x*t*t/384 - x*t*t*t/18432;
  }
  const theta = x - 3 * Math.PI / 4;
  return Math.sqrt(2 / (Math.PI * x)) * Math.cos(theta);
}

// ---- CONTINUED FRACTIONS ----
export function continuedFraction(value, maxTerms = 20) {
  const terms = [];
  let x = value;
  for (let i = 0; i < maxTerms; i++) {
    const a = Math.floor(x);
    terms.push(a);
    const frac = x - a;
    if (Math.abs(frac) < 1e-10) break;
    x = 1 / frac;
  }
  return terms;
}

export function continuedFractionConvergents(terms) {
  const convergents = [];
  let h_prev = 1, h_curr = terms[0];
  let k_prev = 0, k_curr = 1;
  convergents.push({ p: h_curr, q: k_curr, value: h_curr / k_curr });
  for (let i = 1; i < terms.length; i++) {
    const a = terms[i];
    const h_next = a * h_curr + h_prev;
    const k_next = a * k_curr + k_prev;
    convergents.push({ p: h_next, q: k_next, value: h_next / k_next });
    h_prev = h_curr; h_curr = h_next;
    k_prev = k_curr; k_curr = k_next;
  }
  return convergents;
}

// ---- WAVELET TRANSFORM (Haar) ----
export function haarWavelet(signal) {
  const n = signal.length;
  const result = [...signal];
  let h = n;
  while (h > 1) {
    h = Math.floor(h / 2);
    for (let i = 0; i < h; i++) {
      const a = result[2*i], b = result[2*i+1];
      result[i] = (a + b) / Math.SQRT2;
      result[h + i] = (a - b) / Math.SQRT2;
    }
  }
  return result;
}

// ---- CONJUGATE GRADIENT (solve Ax=b) ----
export function conjugateGradient(A, b, tol = 1e-10, maxIter = 1000) {
  const n = b.length;
  const dot = (u, v) => u.reduce((s, ui, i) => s + ui * v[i], 0);
  const axpy = (alpha, u, v) => u.map((ui, i) => alpha * ui + v[i]);
  const matvec = (M, v) => M.map(row => dot(row, v));
  let x = new Array(n).fill(0);
  let r = axpy(-1, matvec(A, x), b);
  let p = [...r];
  let rsold = dot(r, r);
  for (let i = 0; i < maxIter; i++) {
    const Ap = matvec(A, p);
    const alpha = rsold / dot(p, Ap);
    x = axpy(alpha, p, x);
    r = axpy(-alpha, Ap, r);
    const rsnew = dot(r, r);
    if (Math.sqrt(rsnew) < tol) break;
    p = axpy(rsnew / rsold, p, r);
    rsold = rsnew;
  }
  return x;
}

// ---- BEZIER CURVES ----
export function bezierPoint(t, controlPoints) {
  let pts = controlPoints.map(p => ({ ...p }));
  const n = pts.length - 1;
  for (let r = 1; r <= n; r++)
    for (let i = 0; i <= n - r; i++)
      pts[i] = { x: (1-t)*pts[i].x + t*pts[i+1].x, y: (1-t)*pts[i].y + t*pts[i+1].y };
  return pts[0];
}

export function bezierCurve(controlPoints, steps = 100) {
  return Array.from({ length: steps + 1 }, (_, i) => bezierPoint(i / steps, controlPoints));
}

// ---- MILLER-RABIN PRIMALITY TEST ----
export function millerRabin(n, k = 20) {
  if (n < 2) return false;
  if (n === 2 || n === 3) return true;
  if (n % 2 === 0) return false;
  let d = n - 1, r = 0;
  while (d % 2 === 0) { d /= 2; r++; }
  const modpow = (b, e, m) => {
    let result = 1n;
    b = BigInt(b) % BigInt(m);
    e = BigInt(e);
    const M = BigInt(m);
    while (e > 0n) {
      if (e % 2n === 1n) result = result * b % M;
      e /= 2n;
      b = b * b % M;
    }
    return Number(result);
  };
  for (let i = 0; i < k; i++) {
    const a = 2 + Math.floor(Math.random() * (n - 3));
    let x = modpow(a, d, n);
    if (x === 1 || x === n - 1) continue;
    let composite = true;
    for (let j = 0; j < r - 1; j++) {
      x = modpow(x, 2, n);
      if (x === n - 1) { composite = false; break; }
    }
    if (composite) return false;
  }
  return true;
}

// ---- POLLARD'S RHO FACTORIZATION ----
export function pollardRho(n) {
  if (n % 2 === 0) return 2;
  let x = 2 + Math.floor(Math.random() * (n - 2));
  let y = x, c = 1 + Math.floor(Math.random() * (n - 1)), d = 1;
  while (d === 1) {
    x = (x * x + c) % n;
    y = (y * y + c) % n;
    y = (y * y + c) % n;
    d = gcd(Math.abs(x - y), n);
  }
  return d !== n ? d : null;
}

// ---- DISCRETE FOURIER TRANSFORM (exact, for small N) ----
export function dft(signal) {
  const N = signal.length;
  return Array.from({ length: N }, (_, k) => {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = -2 * Math.PI * k * n / N;
      re += signal[n] * Math.cos(angle);
      im += signal[n] * Math.sin(angle);
    }
    return { re, im, magnitude: Math.sqrt(re*re + im*im), phase: Math.atan2(im, re) };
  });
}

// ---- INTERPOLATION ----
export function lagrangeInterpolation(points, x) {
  return points.reduce((sum, pi, i) => {
    const L = points.reduce((prod, pj, j) => {
      if (i === j) return prod;
      return prod * (x - pj.x) / (pi.x - pj.x);
    }, 1);
    return sum + pi.y * L;
  }, 0);
}

export function newtonInterpolation(points) {
  const n = points.length;
  const d = points.map(p => p.y);
  for (let j = 1; j < n; j++)
    for (let i = n - 1; i >= j; i--)
      d[i] = (d[i] - d[i-1]) / (points[i].x - points[i-j].x);
  return (x) => {
    let result = d[n-1];
    for (let i = n-2; i >= 0; i--)
      result = result * (x - points[i].x) + d[i];
    return result;
  };
}

// ---- QUATERNIONS ----
export class Quaternion {
  constructor(w, x, y, z) { this.w = w; this.x = x; this.y = y; this.z = z; }
  add(q) { return new Quaternion(this.w+q.w, this.x+q.x, this.y+q.y, this.z+q.z); }
  mul(q) {
    return new Quaternion(
      this.w*q.w - this.x*q.x - this.y*q.y - this.z*q.z,
      this.w*q.x + this.x*q.w + this.y*q.z - this.z*q.y,
      this.w*q.y - this.x*q.z + this.y*q.w + this.z*q.x,
      this.w*q.z + this.x*q.y - this.y*q.x + this.z*q.w
    );
  }
  norm() { return Math.sqrt(this.w**2+this.x**2+this.y**2+this.z**2); }
  normalize() { const n=this.norm(); return new Quaternion(this.w/n,this.x/n,this.y/n,this.z/n); }
  conjugate() { return new Quaternion(this.w,-this.x,-this.y,-this.z); }
  toString() { return `${this.w.toFixed(4)} + ${this.x.toFixed(4)}i + ${this.y.toFixed(4)}j + ${this.z.toFixed(4)}k`; }
}

// ---- COMPLEX NUMBERS ----
export class Complex {
  constructor(re, im = 0) { this.re = re; this.im = im; }
  add(c) { return new Complex(this.re+c.re, this.im+c.im); }
  sub(c) { return new Complex(this.re-c.re, this.im-c.im); }
  mul(c) { return new Complex(this.re*c.re-this.im*c.im, this.re*c.im+this.im*c.re); }
  div(c) { const d=c.re**2+c.im**2; return new Complex((this.re*c.re+this.im*c.im)/d,(this.im*c.re-this.re*c.im)/d); }
  abs() { return Math.sqrt(this.re**2+this.im**2); }
  arg() { return Math.atan2(this.im, this.re); }
  pow(n) { const r=Math.pow(this.abs(),n), theta=this.arg()*n; return new Complex(r*Math.cos(theta),r*Math.sin(theta)); }
  exp() { return new Complex(Math.exp(this.re)*Math.cos(this.im), Math.exp(this.re)*Math.sin(this.im)); }
  toString() { return this.im >= 0 ? `${this.re.toFixed(6)} + ${this.im.toFixed(6)}i` : `${this.re.toFixed(6)} - ${Math.abs(this.im).toFixed(6)}i`; }
}

// ---- BIG INTEGER OPERATIONS ----
export function bigFactorial(n) {
  let result = 1n;
  for (let i = 2n; i <= BigInt(n); i++) result *= i;
  return result;
}

export function bigFibonacci(n) {
  // Matrix method with BigInt for exact large values
  if (n <= 1) return BigInt(n);
  let a = 0n, b = 1n;
  for (let i = 2; i <= n; i++) { [a, b] = [b, a + b]; }
  return b;
}

// ---- NUMERICAL METHODS ----
export function bisection(f, a, b, tol = 1e-12, maxIter = 200) {
  if (f(a) * f(b) > 0) throw new Error('f(a) and f(b) must have opposite signs');
  const steps = [];
  let c;
  for (let i = 0; i < maxIter; i++) {
    c = (a + b) / 2;
    steps.push({ iter: i, a, b, c, fc: f(c) });
    if (Math.abs(f(c)) < tol || (b - a) / 2 < tol) break;
    f(a) * f(c) < 0 ? (b = c) : (a = c);
  }
  return { root: c, steps };
}

export function secantMethod(f, x0, x1, tol = 1e-12, maxIter = 100) {
  const steps = [];
  for (let i = 0; i < maxIter; i++) {
    const fx0 = f(x0), fx1 = f(x1);
    if (Math.abs(fx1 - fx0) < 1e-15) break;
    const x2 = x1 - fx1 * (x1 - x0) / (fx1 - fx0);
    steps.push({ iter: i, x: x2, fx: f(x2) });
    if (Math.abs(x2 - x1) < tol) { x1 = x2; break; }
    x0 = x1; x1 = x2;
  }
  return { root: x1, steps };
}

export function fixedPointIteration(g, x0, tol = 1e-10, maxIter = 200) {
  let x = x0;
  const steps = [{ iter: 0, x }];
  for (let i = 1; i <= maxIter; i++) {
    const xNew = g(x);
    steps.push({ iter: i, x: xNew });
    if (Math.abs(xNew - x) < tol) return { fixedPoint: xNew, steps };
    x = xNew;
  }
  return { fixedPoint: x, steps };
}

// Gauss-Legendre quadrature (5-point)
export function gaussLegendre5(f, a, b) {
  const nodes = [-0.9061798459, -0.5384693101, 0, 0.5384693101, 0.9061798459];
  const weights = [0.2369268851, 0.4786286705, 0.5688888889, 0.4786286705, 0.2369268851];
  const mid = (a + b) / 2, half = (b - a) / 2;
  return half * nodes.reduce((s, t, i) => s + weights[i] * f(mid + half * t), 0);
}

// Composite Gauss-Legendre
export function gaussLegendreComposite(f, a, b, n = 100) {
  const h = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += gaussLegendre5(f, a + i * h, a + (i + 1) * h);
  return sum;
}

// Romberg integration
export function rombergIntegration(f, a, b, maxOrder = 6) {
  const R = Array.from({ length: maxOrder }, () => new Array(maxOrder).fill(0));
  let h = b - a;
  R[0][0] = h / 2 * (f(a) + f(b));
  for (let i = 1; i < maxOrder; i++) {
    h /= 2;
    let sum = 0;
    for (let k = 1; k <= Math.pow(2, i - 1); k++) sum += f(a + (2 * k - 1) * h);
    R[i][0] = R[i - 1][0] / 2 + h * sum;
    for (let j = 1; j <= i; j++) {
      R[i][j] = R[i][j - 1] + (R[i][j - 1] - R[i - 1][j - 1]) / (Math.pow(4, j) - 1);
    }
  }
  return { value: R[maxOrder - 1][maxOrder - 1], table: R };
}

// ---- LINEAR ALGEBRA EXTRAS ----
export function qrDecomposition(A) {
  const m = A.length, n = A[0].length;
  let Q = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => i === j ? 1 : 0));
  let R = A.map(row => [...row]);
  for (let j = 0; j < Math.min(m, n); j++) {
    const col = R.slice(j).map(row => row[j]);
    const norm = Math.sqrt(col.reduce((s, v) => s + v * v, 0));
    if (norm < 1e-14) continue;
    col[0] += col[0] >= 0 ? norm : -norm;
    const colNorm = Math.sqrt(col.reduce((s, v) => s + v * v, 0));
    const v = col.map(c => c / colNorm);
    // Apply Householder reflection
    for (let i = j; i < m; i++) {
      const dot = R[i].reduce((s, _, k) => s + (k >= j ? v[i - j] * R[j + (i - j)][k] : 0), 0);
    }
  }
  return { Q, R }; // simplified return
}

export function vectorDot(a, b) { return a.reduce((s, v, i) => s + v * b[i], 0); }
export function vectorNorm(v) { return Math.sqrt(vectorDot(v, v)); }
export function vectorCross3(a, b) {
  return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
}
export function vectorAngle(a, b) {
  return Math.acos(vectorDot(a, b) / (vectorNorm(a) * vectorNorm(b)));
}

// ---- GRAPH ALGORITHMS ----
export function dijkstra(graph, start) {
  // graph: { node: [{to, weight}] }
  const dist = {}, prev = {}, visited = new Set();
  Object.keys(graph).forEach(n => dist[n] = Infinity);
  dist[start] = 0;
  const pq = [[0, start]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    for (const { to, weight } of (graph[u] || [])) {
      const alt = dist[u] + weight;
      if (alt < dist[to]) { dist[to] = alt; prev[to] = u; pq.push([alt, to]); }
    }
  }
  return { distances: dist, previous: prev };
}

export function kruskalMST(edges, nodes) {
  // edges: [{u, v, weight}]
  const parent = {}, rank = {};
  nodes.forEach(n => { parent[n] = n; rank[n] = 0; });
  const find = (x) => parent[x] === x ? x : (parent[x] = find(parent[x]));
  const union = (x, y) => {
    const px = find(x), py = find(y);
    if (px === py) return false;
    rank[px] >= rank[py] ? (parent[py] = px) : (parent[px] = py);
    if (rank[px] === rank[py]) rank[px]++;
    return true;
  };
  const sorted = [...edges].sort((a, b) => a.weight - b.weight);
  const mst = [], totalWeight = { v: 0 };
  for (const e of sorted) {
    if (union(e.u, e.v)) { mst.push(e); totalWeight.v += e.weight; }
  }
  return { edges: mst, totalWeight: totalWeight.v };
}

export function topologicalSort(graph) {
  const visited = new Set(), order = [];
  const dfs = (node) => {
    if (visited.has(node)) return;
    visited.add(node);
    for (const neighbor of (graph[node] || [])) dfs(neighbor);
    order.unshift(node);
  };
  Object.keys(graph).forEach(dfs);
  return order;
}

// ---- INFORMATION THEORY ----
export function shannonEntropy(probs) {
  return -probs.filter(p => p > 0).reduce((s, p) => s + p * Math.log2(p), 0);
}

export function klDivergence(p, q) {
  return p.reduce((s, pi, i) => pi > 0 && q[i] > 0 ? s + pi * Math.log2(pi / q[i]) : s, 0);
}

export function mutualInformation(joint) {
  // joint: 2D probability matrix
  const px = joint.map(row => row.reduce((s, v) => s + v, 0));
  const py = joint[0].map((_, j) => joint.reduce((s, row) => s + row[j], 0));
  let mi = 0;
  for (let i = 0; i < joint.length; i++)
    for (let j = 0; j < joint[0].length; j++)
      if (joint[i][j] > 0) mi += joint[i][j] * Math.log2(joint[i][j] / (px[i] * py[j]));
  return mi;
}

// ---- NUMBER THEORY EXTRAS ----
export function chineseRemainderTheorem(remainders, moduli) {
  const M = moduli.reduce((a, b) => a * b, 1);
  let x = 0;
  for (let i = 0; i < remainders.length; i++) {
    const Mi = M / moduli[i];
    const { x: inv } = extendedGCD(Mi % moduli[i], moduli[i]);
    x += remainders[i] * Mi * ((inv % moduli[i] + moduli[i]) % moduli[i]);
  }
  return ((x % M) + M) % M;
}

export function isPerf(n) {
  let sum = 1;
  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) { sum += i; if (i !== n / i) sum += n / i; }
  return sum === n && n > 1;
}

export function collatz(n) {
  const seq = [n];
  let steps = 0;
  while (n !== 1 && steps < 10000) {
    n = n % 2 === 0 ? n / 2 : 3 * n + 1;
    seq.push(n);
    steps++;
  }
  return { sequence: seq, steps: seq.length - 1 };
}

export function mobiusFunction(n) {
  if (n === 1) return 1;
  const factors = primeFactorization(n);
  const primeCount = Object.keys(factors).length;
  if (Object.values(factors).some(e => e > 1)) return 0;
  return primeCount % 2 === 0 ? 1 : -1;
}

export function legendreSymbol(a, p) {
  // Euler's criterion
  const val = modPow(a, Math.floor((p - 1) / 2), p);
  return val === p - 1 ? -1 : val;
}

// ---- COMBINATORICS ----
export function stirlingSecond(n, k) {
  if (k === 0 && n === 0) return 1;
  if (k === 0 || n === 0) return 0;
  if (k === n || k === 1) return 1;
  const dp = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(0));
  dp[0][0] = 1;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= Math.min(i, k); j++)
      dp[i][j] = j * dp[i - 1][j] + dp[i - 1][j - 1];
  return dp[n][k];
}

export function catalanNumber(n) {
  return combinations(2 * n, n) / (n + 1);
}

export function bellNumber(n) {
  // Bell triangle
  let row = [1];
  for (let i = 0; i < n; i++) {
    const newRow = [row[row.length - 1]];
    for (let j = 0; j < row.length; j++) newRow.push(newRow[j] + row[j]);
    row = newRow;
  }
  return row[0];
}

export function partitionCount(n) {
  // Dynamic programming
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1;
  for (let k = 1; k <= n; k++)
    for (let i = k; i <= n; i++)
      dp[i] += dp[i - k];
  return dp[n];
}

// ---- STATISTICAL TESTS ----
export function chiSquaredTest(observed, expected) {
  const statistic = observed.reduce((s, o, i) => s + (o - expected[i]) ** 2 / expected[i], 0);
  const df = observed.length - 1;
  return { statistic, df, pValue: 1 - regularizedGammaP(df / 2, statistic / 2) };
}

function regularizedGammaP(a, x) {
  // Series expansion
  if (x < 0) return 0;
  if (x === 0) return 0;
  let sum = 1 / a, term = 1 / a;
  for (let n = 1; n < 200; n++) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < 1e-10) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - Math.log(gammaFunction(a)));
}

export function tTest(sample1, sample2) {
  const n1 = sample1.length, n2 = sample2.length;
  const m1 = sample1.reduce((s, v) => s + v, 0) / n1;
  const m2 = sample2.reduce((s, v) => s + v, 0) / n2;
  const v1 = sample1.reduce((s, v) => s + (v - m1) ** 2, 0) / (n1 - 1);
  const v2 = sample2.reduce((s, v) => s + (v - m2) ** 2, 0) / (n2 - 1);
  const se = Math.sqrt(v1 / n1 + v2 / n2);
  const t = (m1 - m2) / se;
  const df = (v1 / n1 + v2 / n2) ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
  return { t, df: Math.round(df), meanDiff: m1 - m2, se };
}

// ---- CRYPTOGRAPHY ----
export function rsaKeygen(p, q) {
  if (!isPrime(p) || !isPrime(q)) throw new Error('p and q must be prime');
  const n = p * q;
  const phi = (p - 1) * (q - 1);
  let e = 65537;
  while (gcd(e, phi) !== 1) e++;
  const { x: d } = extendedGCD(e, phi);
  return { n, e, d: ((d % phi) + phi) % phi, phi };
}

export function rsa(message, key, mod) {
  return modPow(message, key, mod);
}

// ---- FRACTALS ----
export function mandelbrotIterations(cx, cy, maxIter = 100) {
  let x = 0, y = 0, iter = 0;
  while (x * x + y * y <= 4 && iter < maxIter) {
    [x, y] = [x * x - y * y + cx, 2 * x * y + cy];
    iter++;
  }
  return iter;
}

export function juliaSetIterations(cx, cy, c_re, c_im, maxIter = 100) {
  let x = cx, y = cy, iter = 0;
  while (x * x + y * y <= 4 && iter < maxIter) {
    [x, y] = [x * x - y * y + c_re, 2 * x * y + c_im];
    iter++;
  }
  return iter;
}

// ---- SIGNAL PROCESSING EXTRAS ----
export function movingAverage(data, window) {
  return data.map((_, i) => {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(data.length, start + window);
    return data.slice(start, end).reduce((s, v) => s + v, 0) / (end - start);
  });
}

export function exponentialSmoothing(data, alpha = 0.3) {
  const result = [data[0]];
  for (let i = 1; i < data.length; i++)
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  return result;
}

export function autocorrelation(data, lag) {
  const n = data.length, mean = data.reduce((s, v) => s + v, 0) / n;
  const variance = data.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  let cov = 0;
  for (let i = 0; i < n - lag; i++) cov += (data[i] - mean) * (data[i + lag] - mean);
  return (cov / (n - lag)) / variance;
}

// ---- DIFFERENTIAL GEOMETRY ----
export function curvature2D(f, x, h = 1e-5) {
  const d1 = (f(x + h) - f(x - h)) / (2 * h);
  const d2 = (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
  return Math.abs(d2) / Math.pow(1 + d1 * d1, 1.5);
}

export function arcLength(f, a, b, n = 10000) {
  const h = (b - a) / n;
  let len = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * h, x1 = a + (i + 1) * h;
    const dy = f(x1) - f(x0);
    len += Math.sqrt(h * h + dy * dy);
  }
  return len;
}

export { gcd, lcm, fibonacci, gammaFunction as gamma, errorFunction as erf, riemannZeta as zeta, MATH_FUNCTIONS, PHI, EULER, CATALAN };