/**
 * High-precision Complex Number class for optical physics calculations.
 *
 * 高精准度复数类，用于光学物理计算。
 * 用于复振幅、相位因子、菲涅尔系数、琼斯矩阵、穆勒矩阵计算。
 * 
 * 
 * Designed for:
 * - Phase factor calculations: e^(iφ)
 * - Fresnel coefficient computations (including TIR with imaginary angles)
 * - Jones/Mueller matrix operations
 *
 * Performance considerations:
 * - Methods return new instances (immutability for correctness)
 * - Static methods for common operations to reduce object creation
 * - Inline math operations where possible
 */

// Numerical tolerance for zero comparisons 数值容差
const EPSILON = 1e-12;
const SQRT_EPSILON = 1e-6;

export class Complex {
  constructor(
    public readonly real: number,
    public readonly imag: number = 0
  ) {}

  // ========== Static Factories ==========

  /** Create from polar form: r * e^(iθ) = r(cos θ + i sin θ) */
  static fromPolar(magnitude: number, phase: number): Complex {
    return new Complex(
      magnitude * Math.cos(phase),
      magnitude * Math.sin(phase)
    );
  }

  /** Create complex exponential: e^(iθ) */
  static exp(theta: number): Complex {
    return new Complex(Math.cos(theta), Math.sin(theta));
  }

  /** Zero complex number */
  static readonly ZERO = new Complex(0, 0);

  /** One (real unit) */
  static readonly ONE = new Complex(1, 0);

  /** Imaginary unit i */
  static readonly I = new Complex(0, 1);

  // ========== Properties ==========

  /** Magnitude |z| = √(x² + y²) */
  get magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  /** Magnitude squared |z|² = x² + y² (faster, no sqrt) */
  get magnitudeSquared(): number {
    return this.real * this.real + this.imag * this.imag;
  }

  /** Phase angle arg(z) = atan2(y, x), in radians */
  get phase(): number {
    return Math.atan2(this.imag, this.real);
  }

  // ========== Arithmetic Operations ==========

  /** Addition: z₁ + z₂ */
  add(other: Complex): Complex {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  /** Subtraction: z₁ - z₂ */
  sub(other: Complex): Complex {
    return new Complex(this.real - other.real, this.imag - other.imag);
  }

  /** Multiplication: z₁ × z₂ = (a+bi)(c+di) = (ac-bd) + (ad+bc)i */
  mul(other: Complex): Complex {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  /** Division: z₁ / z₂ */
  div(other: Complex): Complex {
    const denom = other.magnitudeSquared;
    if (denom < EPSILON) {
      // === MATHEMATICAL NOTE: Zero Division ===
      // In pure mathematics: division by zero is undefined (should return NaN or throw)
      // In optical physics context:
      //   - Infinite impedance (transmission coefficient → 0)
      //   - Zero transmission through opaque medium
      // Design choice: Return ZERO for numerical stability
      // Alternative (strict math): return new Complex(NaN, NaN);
      return Complex.ZERO;
    }
    // Formula: (a+bi)/(c+di) = [(a+bi)(c-di)] / (c²+d²)
    //                     = [(ac+bd) + (bc-ad)i] / (c²+d²)
    return new Complex(
      (this.real * other.real + this.imag * other.imag) / denom,
      (this.imag * other.real - this.real * other.imag) / denom
    );
  }

  /** Scalar multiplication: z × k */
  scale(k: number): Complex {
    return new Complex(this.real * k, this.imag * k);
  }

  /** Complex conjugate: z* = x - iy */
  conjugate(): Complex {
    return new Complex(this.real, -this.imag);
  }

  /** Negation: -z */
  negate(): Complex {
    return new Complex(-this.real, -this.imag);
  }

  // ========== Advanced Operations ==========

  /**
   * Complex exponential: e^z = e^x × (cos y + i sin y)
   * Essential for phase factors and wave propagation
   */
  exp(): Complex {
    const expReal = Math.exp(this.real);
    return new Complex(
      expReal * Math.cos(this.imag),
      expReal * Math.sin(this.imag)
    );
  }

  /**
   * Principal square root: √z
   * Uses the formula: √z = √|z| × e^(i×arg(z)/2)
   *
   * Critical for Fresnel equations with TIR (imaginary angles)
   */
  sqrt(): Complex {
    const mag = this.magnitude;
    if (mag < SQRT_EPSILON) {
      return Complex.ZERO;
    }
    const halfPhase = this.phase / 2;
    const sqrtMag = Math.sqrt(mag);
    return new Complex(
      sqrtMag * Math.cos(halfPhase),
      sqrtMag * Math.sin(halfPhase)
    );
  }

  /**
   * Natural logarithm: ln(z) = ln|z| + i×arg(z)
   * Returns principal value with arg(z) ∈ (-π, π]
   */
  log(): Complex {
    const mag = this.magnitude;
    if (mag < EPSILON) {
      // ln(0) is undefined, return a large negative real number
      return new Complex(-1e10, 0);
    }
    return new Complex(Math.log(mag), this.phase);
  }

  /**
   * Power: z^n for real n
   * Uses: z^n = |z|^n × e^(i×n×arg(z))
   */
  pow(n: number): Complex {
    const mag = this.magnitude;
    if (mag < SQRT_EPSILON) {
      return n > 0 ? Complex.ZERO : new Complex(Infinity, 0);
    }
    const newMag = Math.pow(mag, n);
    // === PHASE MULTIPLICATION ===
    // For z^n = |z|^n × e^(i×n×arg(z)), the phase scales linearly
    // For integer n: phase is well-defined (branch cut doesn't matter)
    // For fractional n: we use principal branch (-π, π]
    // Note: n×arg(z) may exceed (-π, π]; cos/sin handle this correctly
    // Example: (-1)^(1/2) = exp(i×π/2) = i (correct principal value)
    const newPhase = this.phase * n;
    return new Complex(
      newMag * Math.cos(newPhase),
      newMag * Math.sin(newPhase)
    );
  }

  /**
   * Complex power: z₁^z₂
   * Uses: z₁^z₂ = e^(z₂ × ln(z₁))
   */
  powComplex(exponent: Complex): Complex {
    if (this.isZero()) {
      // === MATHEMATICAL NOTE: Zero Base Powers ===
      // 0^z is defined only for Re(z) > 0, returning 0
      // Special cases:
      //   - 0^0 : undefined (indeterminate form)
      //   - 0^positive_real : 0
      //   - 0^negative_real : undefined (approaches infinity)
      // Current: Return ZERO for all cases (stable default)
      // Alternative (strict math): Handle explicitly:
      //   if (exponent.isZero()) return new Complex(NaN, NaN);      // 0^0
      //   if (exponent.real < 0) return new Complex(Infinity, 0);  // 0^negative
      return Complex.ZERO;
    }
    const logThis = this.log();
    const product = exponent.mul(logThis);
    return product.exp();
  }

  // ========== Comparison Operations ==========

  /**
   * Check if complex number is approximately zero
   * @param tolerance - Absolute tolerance for comparison (default: 1e-12)
   */
  isZero(tolerance: number = EPSILON): boolean {
    return Math.abs(this.real) < tolerance && Math.abs(this.imag) < tolerance;
  }

  /**
   * Check if approximately equal to another complex number
   * @param other - Complex number to compare with
   * @param tolerance - Absolute tolerance (default: 1e-12)
   */
  equals(other: Complex, tolerance: number = EPSILON): boolean {
    return (
      Math.abs(this.real - other.real) < tolerance &&
      Math.abs(this.imag - other.imag) < tolerance
    );
  }

  /**
   * Check if this is approximately a real number (no imaginary part)
   */
  isReal(tolerance: number = EPSILON): boolean {
    return Math.abs(this.imag) < tolerance;
  }

  /**
   * Check if this is approximately purely imaginary (no real part)
   */
  isImaginary(tolerance: number = EPSILON): boolean {
    return Math.abs(this.real) < tolerance;
  }

  // ========== Utility ==========

  /** Create a copy of this complex number */
  clone(): Complex {
    return new Complex(this.real, this.imag);
  }

  /** String representation for debugging */
  toString(precision: number = 4): string {
    const r = this.real.toFixed(precision);
    const i = Math.abs(this.imag).toFixed(precision);
    if (this.isZero()) return '0';
    if (this.isReal()) return r;
    if (this.isImaginary()) {
      return this.imag >= 0 ? `${i}i` : `-${i}i`;
    }
    return this.imag >= 0 ? `${r} + ${i}i` : `${r} - ${i}i`;
  }

  /** Convert to array [real, imag] for serialization */
  toArray(): [number, number] {
    return [this.real, this.imag];
  }

  /** Create from array [real, imag] */
  static fromArray(arr: [number, number]): Complex {
    return new Complex(arr[0], arr[1]);
  }

  // ========== Numerical Stability Methods ==========

  /**
   * Check if this complex number is finite (no Infinity or NaN components)
   * Useful for detecting numerical overflow in iterative algorithms
   * Example: Fresnel coefficients at grazing incidence may approach infinity
   */
  isFinite(): boolean {
    return Number.isFinite(this.real) && Number.isFinite(this.imag);
  }

  /**
   * Check if this complex number represents a valid physical quantity
   * In optics: amplitude must be finite and non-negative magnitude
   * Returns true if finite and magnitude ≥ 0
   */
  isValidPhysicalQuantity(): boolean {
    return this.isFinite() && this.magnitude >= 0;
  }
}

// ========== Utility Functions (for performance-critical paths) ==========

/**
 * Fast complex multiplication without object creation
 * Returns [real, imag] tuple
 */
export function complexMul(
  r1: number, i1: number,
  r2: number, i2: number
): [number, number] {
  return [
    r1 * r2 - i1 * i2,
    r1 * i2 + i1 * r2
  ];
}

/**
 * Fast complex addition without object creation
 */
export function complexAdd(
  r1: number, i1: number,
  r2: number, i2: number
): [number, number] {
  return [r1 + r2, i1 + i2];
}

/**
 * Fast magnitude squared calculation
 */
export function complexMagSq(r: number, i: number): number {
  return r * r + i * i;
}
