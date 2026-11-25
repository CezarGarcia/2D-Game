/**
 * Contas que dão o mesmo resultado em qualquer navegador.
 *
 * O padrão do JavaScript deixa cada motor calcular `Math.sin`, `cos`, `atan2`, `exp`, `log` e `pow`
 * do seu jeito, e uma diferença na última casa decimal cresce ao longo de milhares de quadros.
 * Para o servidor poder refazer uma partida jogada no Firefox ou no Safari e chegar ao mesmo resultado,
 * a simulação, os números do herói e a geração das fases usam estas funções, feitas só com soma,
 * subtração, multiplicação, divisão e raiz quadrada, que o IEEE 754 exige exatas em todo lugar.
 *
 * Os polinômios são os da fdlibm (a mesma base das bibliotecas matemáticas de C), com erro abaixo de
 * 1 unidade na última casa. Valores fora do que o jogo usa (infinitos, números enormes) só precisam
 * dar sempre a mesma resposta, não a mais precisa.
 */

const PIO2_HI = 1.57079632673412561417e+00;
const PIO2_LO = 6.07710050650619224932e-11;
const INV_PIO2 = 6.36619772367581382433e-01;

const S1 = -1.66666666666666324348e-01, S2 = 8.33333333332248946124e-03, S3 = -1.98412698298579493134e-04;
const S4 = 2.75573137070700676789e-06, S5 = -2.50507602534068634195e-08, S6 = 1.58969099521155010221e-10;
const C1 = 4.16666666666666019037e-02, C2 = -1.38888888888741095749e-03, C3 = 2.48015872894767294178e-05;
const C4 = -2.75573143513906633035e-07, C5 = 2.08757232129817482790e-09, C6 = -1.13596475577881948265e-11;

function kSin(x: number): number {
  const z = x * x;
  return x + x * z * (S1 + z * (S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)))));
}

function kCos(x: number): number {
  const z = x * x, hz = 0.5 * z, w = 1 - hz;
  return w + (((1 - w) - hz) + z * z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6))))));
}

/** Reduz `x` a `r` em [-π/4, π/4] e devolve o quadrante (n mod 4). */
function reduce(x: number): [number, number] {
  const n = Math.round(x * INV_PIO2);
  const r = (x - n * PIO2_HI) - n * PIO2_LO;
  return [r, ((n % 4) + 4) % 4];
}

export function fsin(x: number): number {
  if (!Number.isFinite(x)) return NaN;
  if (x > -0.7853981633974483 && x < 0.7853981633974483) return kSin(x);
  const [r, q] = reduce(x);
  return q === 0 ? kSin(r) : q === 1 ? kCos(r) : q === 2 ? -kSin(r) : -kCos(r);
}

export function fcos(x: number): number {
  if (!Number.isFinite(x)) return NaN;
  if (x > -0.7853981633974483 && x < 0.7853981633974483) return kCos(x);
  const [r, q] = reduce(x);
  return q === 0 ? kCos(r) : q === 1 ? -kSin(r) : q === 2 ? -kCos(r) : kSin(r);
}

const ATANHI = [4.63647609000806093515e-01, 7.85398163397448278999e-01, 9.82793723247329054082e-01, 1.57079632679489655800e+00];
const ATANLO = [2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17];
const AT = [
  3.33333333333329318027e-01, -1.99999999998764832476e-01, 1.42857142725034663711e-01, -1.11111104054623557880e-01,
  9.09088713343650656196e-02, -7.69187620504482999495e-02, 6.66107313738753120669e-02, -5.83357013379057348645e-02,
  4.97687799461593236017e-02, -3.65315727442169155270e-02, 1.62858201153657823623e-02,
];

export function fatan(x0: number): number {
  if (Number.isNaN(x0)) return NaN;
  const neg = x0 < 0;
  let x = neg ? -x0 : x0, id = -1;
  if (x >= 7.378697629483821e19) return neg ? -ATANHI[3] - ATANLO[3] : ATANHI[3] + ATANLO[3];
  if (x < 0.4375) {
    if (x < 7.450580596923828e-9) return x0;
  } else if (x < 1.1875) {
    if (x < 0.6875) { id = 0; x = (2 * x - 1) / (2 + x); } else { id = 1; x = (x - 1) / (x + 1); }
  } else if (x < 2.4375) { id = 2; x = (x - 1.5) / (1 + 1.5 * x); } else { id = 3; x = -1 / x; }
  const z = x * x, w = z * z;
  const s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))));
  const s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))));
  if (id < 0) return neg ? -(x - x * (s1 + s2)) : x - x * (s1 + s2);
  const r = ATANHI[id] - ((x * (s1 + s2) - ATANLO[id]) - x);
  return neg ? -r : r;
}

const PI = 3.141592653589793;

export function fatan2(y: number, x: number): number {
  if (Number.isNaN(x) || Number.isNaN(y)) return NaN;
  if (x === 0) return y > 0 ? PI / 2 : y < 0 ? -PI / 2 : (Object.is(x, -0) ? (Object.is(y, -0) ? -PI : PI) : y);
  if (y === 0) return x > 0 ? y : Object.is(y, -0) ? -PI : PI;
  const a = fatan(y / x);
  if (x > 0) return a;
  return y >= 0 ? a + PI : a - PI;
}

/** `sqrt(x² + y²)`. A raiz quadrada é exata em todo lugar; `Math.hypot` não é. */
export function fhypot(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

/* ---------- exp, log e pow ---------- */

const LN2_HI = 6.93147180369123816490e-01, LN2_LO = 1.90821492927058770002e-10, INV_LN2 = 1.44269504088896338700e+00;
const P1 = 1.66666666666666019037e-01, P2 = -2.77777777770155933842e-03, P3 = 6.61375632143793436117e-05;
const P4 = -1.65339022054652515390e-06, P5 = 4.13813679705723846039e-08;

const buf = new DataView(new ArrayBuffer(8));

/** 2 elevado a um inteiro, montado direto nos bits (exato). */
function pow2(k: number): number {
  if (k > 1023) return Infinity;
  if (k < -1074) return 0;
  if (k < -1022) return pow2(k + 60) * 8.673617379884035e-19; // 2^-60
  buf.setUint32(0, (k + 1023) << 20); buf.setUint32(4, 0);
  return buf.getFloat64(0);
}

export function fexp(x: number): number {
  if (Number.isNaN(x)) return NaN;
  if (x > 709.782712893384) return Infinity;
  if (x < -745.1332191019411) return 0;
  const k = Math.round(x * INV_LN2), hi = x - k * LN2_HI, lo = k * LN2_LO, r = hi - lo;
  const t = r * r, c = r - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
  const y = 1 - ((lo - (r * c) / (2 - c)) - hi);
  // dividir a escala em duas evita estourar quando k é grande
  const k1 = Math.trunc(k / 2);
  return y * pow2(k1) * pow2(k - k1);
}

const LG1 = 6.666666666666735130e-01, LG2 = 3.999999999940941908e-01, LG3 = 2.857142874366239149e-01, LG4 = 2.222219843214978396e-01;
const LG5 = 1.818357216161805012e-01, LG6 = 1.531383769920937332e-01, LG7 = 1.479819860511658591e-01;
const SQRT2 = 1.4142135623730951;

export function flog(x: number): number {
  if (Number.isNaN(x) || x < 0) return NaN;
  if (x === 0) return -Infinity;
  if (x === Infinity) return Infinity;
  // separa x = m · 2^k, com m em [√2/2, √2)
  let m = x, k = 0;
  if (m < 2.2250738585072014e-308) { m *= 18014398509481984; k -= 54; } // subnormal: 2^54
  buf.setFloat64(0, m);
  const hiw = buf.getUint32(0);
  k += ((hiw >>> 20) & 0x7ff) - 1023;
  buf.setUint32(0, (hiw & 0x000fffff) | 0x3ff00000);
  m = buf.getFloat64(0);
  if (m >= SQRT2) { m /= 2; k += 1; }
  const f = m - 1, s = f / (2 + f), z = s * s, w = z * z;
  const t1 = w * (LG2 + w * (LG4 + w * LG6)), t2 = z * (LG1 + w * (LG3 + w * (LG5 + w * LG7))), R = t2 + t1, hfsq = 0.5 * f * f;
  return k * LN2_HI - ((hfsq - (s * (hfsq + R) + k * LN2_LO)) - f);
}

/** Potência. Expoente inteiro pequeno sai por multiplicação; o resto por exp(y·log x). */
export function fpow(x: number, y: number): number {
  if (y === 0) return 1;
  if (Number.isInteger(y) && Math.abs(y) <= 64) {
    let n = Math.abs(y), b = x, r = 1;
    while (n > 0) { if (n & 1) r *= b; b *= b; n >>= 1; }
    return y < 0 ? 1 / r : r;
  }
  if (x === 0) return y > 0 ? 0 : Infinity;
  if (x < 0) return NaN;
  return fexp(y * flog(x));
}
