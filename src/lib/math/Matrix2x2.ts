/**
 * 2×2 Complex Matrix class for Jones calculus and Coherency matrices.
 *
 * 用于琼斯矩阵和相干矩阵的2×2复矩阵类。
 * 
 * Matrix layout:
 *   ┌         ┐
 *   │ a00 a01 │
 *   │ a10 a11 │
 *   └         ┘
 *
 * 关键操作
 * - adjoint()（共轭转置）：用于相干矩阵变换
 * - trace(): Tr(M) 用于总强度计算
 * - determinant(): det(M) 用于偏振度计算
 * 
 */

import { Complex } from './Complex';

// Numerical tolerance
const EPSILON = 1e-12;

export class Matrix2x2 {
  constructor(
    public readonly a00: Complex,
    public readonly a01: Complex,
    public readonly a10: Complex,
    public readonly a11: Complex
  ) {}

  // ========== Static Factories ==========

  /** Zero matrix */
  static readonly ZERO = new Matrix2x2(
    Complex.ZERO, Complex.ZERO,
    Complex.ZERO, Complex.ZERO
  );

  /** Identity matrix */
  static readonly IDENTITY = new Matrix2x2(
    Complex.ONE, Complex.ZERO,
    Complex.ZERO, Complex.ONE
  );

  /** Create from real numbers (for convenience) */
  static fromReal(
    a00: number, a01: number,
    a10: number, a11: number
  ): Matrix2x2 {
    return new Matrix2x2(
      new Complex(a00), new Complex(a01),
      new Complex(a10), new Complex(a11)
    );
  }

  /** Create diagonal matrix */
  static diagonal(d0: Complex, d1: Complex): Matrix2x2 {
    return new Matrix2x2(d0, Complex.ZERO, Complex.ZERO, d1);
  }

  /** Create scaled identity matrix */
  static scaledIdentity(s: Complex): Matrix2x2 {
    return new Matrix2x2(s, Complex.ZERO, Complex.ZERO, s);
  }

  /**
   * Create Hermitian matrix from upper triangle
   * For Coherency matrices: J = J†
   */
  static hermitian(
    j00: number,      // Real: |Ex|²
    j01: Complex,     // Complex: Ex × Ey*
    j11: number       // Real: |Ey|²
  ): Matrix2x2 {
    return new Matrix2x2(
      new Complex(j00),
      j01,
      j01.conjugate(), // j10 = j01*
      new Complex(j11)
    );
  }

  // ========== Element Access ==========

  /** Get element by index (0-based) */
  get(row: number, col: number): Complex {
    if (row === 0) {
      return col === 0 ? this.a00 : this.a01;
    } else {
      return col === 0 ? this.a10 : this.a11;
    }
  }

  /** Convert to 2D array */
  toArray(): [[Complex, Complex], [Complex, Complex]] {
    return [
      [this.a00, this.a01],
      [this.a10, this.a11]
    ];
  }

  // ========== Arithmetic Operations ==========

  /** Matrix addition: A + B */
  add(other: Matrix2x2): Matrix2x2 {
    return new Matrix2x2(
      this.a00.add(other.a00),
      this.a01.add(other.a01),
      this.a10.add(other.a10),
      this.a11.add(other.a11)
    );
  }

  /** Matrix subtraction: A - B */
  sub(other: Matrix2x2): Matrix2x2 {
    return new Matrix2x2(
      this.a00.sub(other.a00),
      this.a01.sub(other.a01),
      this.a10.sub(other.a10),
      this.a11.sub(other.a11)
    );
  }

  /** Scalar multiplication: k × A */
  scale(k: number): Matrix2x2 {
    return new Matrix2x2(
      this.a00.scale(k),
      this.a01.scale(k),
      this.a10.scale(k),
      this.a11.scale(k)
    );
  }

  /** Complex scalar multiplication: z × A */
  scaleComplex(z: Complex): Matrix2x2 {
    return new Matrix2x2(
      this.a00.mul(z),
      this.a01.mul(z),
      this.a10.mul(z),
      this.a11.mul(z)
    );
  }

  /**
   * Matrix multiplication: A × B
   * ┌     ┐   ┌     ┐   ┌                     ┐
   * │ a b │ × │ e f │ = │ ae+bg   af+bh       │
   * │ c d │   │ g h │   │ ce+dg   cf+dh       │
   * └     ┘   └     ┘   └                     ┘
   */
  mul(other: Matrix2x2): Matrix2x2 {
    return new Matrix2x2(
      this.a00.mul(other.a00).add(this.a01.mul(other.a10)),
      this.a00.mul(other.a01).add(this.a01.mul(other.a11)),
      this.a10.mul(other.a00).add(this.a11.mul(other.a10)),
      this.a10.mul(other.a01).add(this.a11.mul(other.a11))
    );
  }

  /**
   * Apply matrix to column vector [v0, v1]ᵀ
   * Returns: M × v
   */
  apply(v0: Complex, v1: Complex): [Complex, Complex] {
    return [
      this.a00.mul(v0).add(this.a01.mul(v1)),
      this.a10.mul(v0).add(this.a11.mul(v1))
    ];
  }

  // ========== Matrix Properties ==========

  /**
   * Trace: Tr(M) = a00 + a11
   * For Coherency matrix: Tr(J) = total intensity
   */
  trace(): Complex {
    return this.a00.add(this.a11);
  }

  /**
   * Determinant: det(M) = a00 × a11 - a01 × a10
   * For Coherency matrix: det(J) = |Ex|²|Ey|² - |ExEy*|²
   */
  determinant(): Complex {
    return this.a00.mul(this.a11).sub(this.a01.mul(this.a10));
  }

  /**
   * Conjugate transpose (adjoint): M†
   * Essential for Coherency matrix transformation: J' = M J M†
   */
  adjoint(): Matrix2x2 {
    return new Matrix2x2(
      this.a00.conjugate(),
      this.a10.conjugate(),
      this.a01.conjugate(),
      this.a11.conjugate()
    );
  }

  /** Transpose: Mᵀ (without conjugation) */
  transpose(): Matrix2x2 {
    return new Matrix2x2(this.a00, this.a10, this.a01, this.a11);
  }

  /** Element-wise conjugate */
  conjugate(): Matrix2x2 {
    return new Matrix2x2(
      this.a00.conjugate(),
      this.a01.conjugate(),
      this.a10.conjugate(),
      this.a11.conjugate()
    );
  }

  /**
   * Matrix inverse: M⁻¹
   * Returns null if singular (det ≈ 0)
   */
  inverse(): Matrix2x2 | null {
    const det = this.determinant();
    if (det.isZero(EPSILON)) {
      return null;
    }
    // === NUMERICAL STABILITY: Condition Number ===
    // κ(A) = ||A|| × ||A⁻¹|| measures sensitivity to numerical errors
    // Large κ(A) means matrix is ill-conditioned:
    //   - κ < 10: well-conditioned (inverse is stable)
    //   - 10 < κ < 1000: moderately conditioned
    //   - κ > 1000: ill-conditioned (inverse may have large errors)
    // For 2x2: κ ≥ 1 always, with κ = 1 for unitary matrices
    // Future: Could add conditionNumber() method and threshold check here
    const invDet = Complex.ONE.div(det);
    // Formula for 2x2 inverse: [[a, b], [c, d]]^(-1) = (1/det) × [[d, -b], [-c, a]]
    return new Matrix2x2(
      this.a11.mul(invDet),
      this.a01.negate().mul(invDet),
      this.a10.negate().mul(invDet),
      this.a00.mul(invDet)
    );
  }

  // ========== Special Properties ==========

  /** Check if matrix is approximately Hermitian: M = M† */
  isHermitian(tolerance: number = EPSILON): boolean {
    return (
      this.a00.isReal(tolerance) &&
      this.a11.isReal(tolerance) &&
      this.a01.equals(this.a10.conjugate(), tolerance)
    );
  }

  /** Check if matrix is unitary: M M† = I */
  isUnitary(tolerance: number = EPSILON): boolean {
    const product = this.mul(this.adjoint());
    return (
      product.a00.sub(Complex.ONE).isZero(tolerance) &&
      product.a01.isZero(tolerance) &&
      product.a10.isZero(tolerance) &&
      product.a11.sub(Complex.ONE).isZero(tolerance)
    );
  }

  /** Check if all elements are approximately zero */
  isZero(tolerance: number = EPSILON): boolean {
    return (
      this.a00.isZero(tolerance) &&
      this.a01.isZero(tolerance) &&
      this.a10.isZero(tolerance) &&
      this.a11.isZero(tolerance)
    );
  }

  /**
   * Check if matrix is positive semi-definite
   * Required for valid Coherency matrices
   */
  isPositiveSemiDefinite(tolerance: number = EPSILON): boolean {
    // For 2×2 Hermitian: PSD iff trace ≥ 0 AND det ≥ 0
    if (!this.isHermitian(tolerance)) return false;
    const tr = this.trace().real;
    const det = this.determinant().real;
    return tr >= -tolerance && det >= -tolerance;
  }

  // ========== Utility ==========

  /** Create a copy */
  clone(): Matrix2x2 {
    return new Matrix2x2(this.a00, this.a01, this.a10, this.a11);
  }

  /** String representation for debugging */
  toString(precision: number = 4): string {
    return `┌ ${this.a00.toString(precision)}  ${this.a01.toString(precision)} ┐\n` +
           `└ ${this.a10.toString(precision)}  ${this.a11.toString(precision)} ┘`;
  }

  /** Frobenius norm: ||M||_F = √(Σ|aᵢⱼ|²) */
  frobeniusNorm(): number {
    return Math.sqrt(
      this.a00.magnitudeSquared +
      this.a01.magnitudeSquared +
      this.a10.magnitudeSquared +
      this.a11.magnitudeSquared
    );
  }

  // ========== Numerical Stability Methods ==========

  /**
   * Calculate condition number: κ(A) = ||A|| × ||A⁻¹||
   * Measures sensitivity of linear system Ax = b to perturbations
   *
   * Interpretation:
   *   - κ = 1: Perfectly conditioned (e.g., unitary matrices)
   *   - κ < 10: Well-conditioned (small errors in solution)
   *   - κ < 1000: Moderately conditioned
   *   - κ ≥ 1000: Ill-conditioned (large errors possible)
   *   - κ = ∞: Singular (no inverse exists)
   *
   * For Jones matrices: κ affects polarization state reconstruction accuracy
   */
  conditionNumber(): number {
    const inv = this.inverse();
    if (!inv) return Infinity;
    return this.frobeniusNorm() * inv.frobeniusNorm();
  }

  /**
   * Check if matrix is numerically safe to invert
   * @param threshold - Maximum acceptable condition number (default: 1000)
   */
  isSafeToInvert(threshold: number = 1000): boolean {
    const cond = this.conditionNumber();
    return cond < threshold;
  }
}

// ========== Jones Matrix Factories ==========
// These create common optical element matrices

/**
 * Create linear polarizer Jones matrix at angle θ
 * Transmission axis at angle θ from horizontal
 */
export function jonesLinearPolarizer(theta: number): Matrix2x2 {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return new Matrix2x2(
    new Complex(c * c),
    new Complex(c * s),
    new Complex(c * s),
    new Complex(s * s)
  );
}

/**
 * Create wave plate Jones matrix
 * @param retardance Phase retardation in radians (π/2 for QWP, π for HWP)
 * @param fastAxis Angle of fast axis from horizontal (radians)
 */
export function jonesWavePlate(retardance: number, fastAxis: number): Matrix2x2 {
  const c = Math.cos(fastAxis);
  const s = Math.sin(fastAxis);
  const c2 = c * c;
  const s2 = s * s;
  const cs = c * s;

  // Phase factor for slow axis
  const phaseFactor = Complex.exp(retardance);

  // M = R(-θ) × diag(1, e^(iδ)) × R(θ)
  return new Matrix2x2(
    new Complex(c2).add(phaseFactor.scale(s2)),
    new Complex(cs).sub(phaseFactor.scale(cs)),
    new Complex(cs).sub(phaseFactor.scale(cs)),
    new Complex(s2).add(phaseFactor.scale(c2))
  );
}

/**
 * Create rotation matrix (optical rotator / Faraday)
 * Rotates polarization by angle θ without loss
 */
export function jonesRotator(theta: number): Matrix2x2 {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return new Matrix2x2(
    new Complex(c),
    new Complex(-s),
    new Complex(s),
    new Complex(c)
  );
}
