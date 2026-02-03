/**
 * 3D Vector class for spatial ray tracing and polarization basis calculations.
 * 
 * 三维向量类，用于空间光线追踪和偏振基矢计算。
 * 用于光线方向向量、表面法线、偏振基矢（垂直s分量和平行p分量）和位置坐标。
 * 
 * Used for:
 * - Light ray direction vectors (k̂)
 * - Surface normals (n̂)
 * - Polarization basis vectors (ŝ, p̂)
 * - Position coordinates
 *
 * All operations preserve immutability.
 * 所有操作均保持不可变性。
 *
 * Performance considerations:
 * - Methods return new instances to avoid side effects
 * - Inline math operations where possible
 */

// Numerical tolerance for comparisons
const EPSILON = 1e-10;

export class Vector3 {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number
  ) {}

  // ========== Static Factories ==========

  /** Zero vector */
  static readonly ZERO = new Vector3(0, 0, 0);

  /** Unit vectors along axes */
  static readonly X = new Vector3(1, 0, 0);
  static readonly Y = new Vector3(0, 1, 0);
  static readonly Z = new Vector3(0, 0, 1);

  /** Negative unit vectors */
  static readonly NEG_X = new Vector3(-1, 0, 0);
  static readonly NEG_Y = new Vector3(0, -1, 0);
  static readonly NEG_Z = new Vector3(0, 0, -1);

  /** Create from array */
  static fromArray(arr: [number, number, number]): Vector3 {
    return new Vector3(arr[0], arr[1], arr[2]);
  }

  /**
   * Create unit vector from spherical coordinates
   * @param theta Azimuthal angle (0 to 2π)
   * @param phi Polar angle from z-axis (0 to π)
   */
  static fromSpherical(theta: number, phi: number): Vector3 {
    const sinPhi = Math.sin(phi);
    return new Vector3(
      sinPhi * Math.cos(theta),
      sinPhi * Math.sin(theta),
      Math.cos(phi)
    );
  }

  // ========== Properties ==========

  /** Vector magnitude (length) */
  get length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /** Squared magnitude (faster, no sqrt) */
  get lengthSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  // ========== Arithmetic Operations ==========

  /** Vector addition */
  add(other: Vector3): Vector3 {
    return new Vector3(
      this.x + other.x,
      this.y + other.y,
      this.z + other.z
    );
  }

  /** Vector subtraction */
  sub(other: Vector3): Vector3 {
    return new Vector3(
      this.x - other.x,
      this.y - other.y,
      this.z - other.z
    );
  }

  /** Scalar multiplication */
  scale(k: number): Vector3 {
    return new Vector3(this.x * k, this.y * k, this.z * k);
  }

  /** Negation */
  negate(): Vector3 {
    return new Vector3(-this.x, -this.y, -this.z);
  }

  /** Dot product: a · b = ax×bx + ay×by + az×bz */
  dot(other: Vector3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  /**
   * Cross product: a × b
   * Produces vector perpendicular to both a and b
   */
  cross(other: Vector3): Vector3 {
    return new Vector3(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x
    );
  }

  // ========== Normalization ==========

  /**
   * Returns normalized (unit) vector: v̂ = v / |v|
   * Returns zero vector if this vector has zero length
   */
  normalize(): Vector3 {
    const len = this.length;
    if (len < EPSILON) {
      // === MATHEMATICAL NOTE: Zero Vector Normalization ===
      // In pure mathematics: normalizing a zero vector is undefined
      //   - ||0|| = 0, so 0/0 is indeterminate
      // Design choices:
      //   1. Return ZERO (current): Safe default, propagates as "no direction"
      //   2. Throw error: Strict mathematical correctness
      //   3. Return random unit vector: For Monte Carlo/integration
      // Physics context: Zero vector often means "no quantity", so ZERO is appropriate
      return Vector3.ZERO;
    }
    return new Vector3(this.x / len, this.y / len, this.z / len);
  }

  /**
   * Safe normalization with fallback
   * @param fallback Vector to return if this vector has zero length
   */
  normalizeOr(fallback: Vector3): Vector3 {
    const len = this.length;
    if (len < EPSILON) {
      return fallback;
    }
    return new Vector3(this.x / len, this.y / len, this.z / len);
  }

  // ========== Geometric Operations ==========

  /**
   * Reflect this vector around a normal
   * Returns: v - 2(v·n)n
   */
  reflect(normal: Vector3): Vector3 {
    const dotProduct = this.dot(normal);
    return this.sub(normal.scale(2 * dotProduct));
  }

  /**
   * Refract this vector through a surface
   * @param normal Surface normal (pointing away from incident side)
   * @param eta Ratio of refractive indices n1/n2
   * @returns Refracted ray direction, or null for total internal reflection
   */
  refract(normal: Vector3, eta: number): Vector3 | null {
    const cosThetaI = -this.dot(normal);
    const sin2ThetaI = 1 - cosThetaI * cosThetaI;
    const sin2ThetaT = eta * eta * sin2ThetaI;

    // Total internal reflection
    if (sin2ThetaT > 1) {
      return null;
    }

    const cosThetaT = Math.sqrt(1 - sin2ThetaT);
    return this.scale(eta).add(normal.scale(eta * cosThetaI - cosThetaT));
  }

  /**
   * Project this vector onto another vector
   * Returns: (a·b/|b|²) × b
   */
  projectOnto(other: Vector3): Vector3 {
    const otherLenSq = other.lengthSquared;
    if (otherLenSq < EPSILON) {
      return Vector3.ZERO;
    }
    return other.scale(this.dot(other) / otherLenSq);
  }

  /**
   * Component perpendicular to another vector
   * Returns: a - proj_b(a)
   */
  perpendicular(other: Vector3): Vector3 {
    return this.sub(this.projectOnto(other));
  }

  /**
   * Angle between two vectors (radians)
   * Uses: cos(θ) = (a·b) / (|a||b|)
   */
  angleTo(other: Vector3): number {
    const lenProduct = this.length * other.length;
    if (lenProduct < EPSILON) {
      // === MATHEMATICAL NOTE: Zero Vector Angle ===
      // Using formula: cos(θ) = (a·b) / (|a||b|)
      // If either vector is zero: denominator = 0, angle is undefined
      // Current: Return 0 as conventional default
      // Strict math: Should return NaN (angle is undefined for directionless vectors)
      return 0;
    }
    // Clamp to avoid NaN from floating point errors
    // Due to numerical precision, cosAngle may slightly exceed [-1, 1]
    const cosAngle = Math.max(-1, Math.min(1, this.dot(other) / lenProduct));
    return Math.acos(cosAngle);
  }

  // ========== Comparison Operations ==========

  /** Check if two vectors are approximately parallel (same or opposite direction) */
  isParallel(other: Vector3, tolerance: number = EPSILON): boolean {
    const crossProd = this.cross(other);
    return crossProd.lengthSquared < tolerance * tolerance;
  }

  /** Check if two vectors are approximately perpendicular */
  isPerpendicular(other: Vector3, tolerance: number = EPSILON): boolean {
    return Math.abs(this.dot(other)) < tolerance;
  }

  /** Check if vectors are approximately equal */
  equals(other: Vector3, tolerance: number = EPSILON): boolean {
    return (
      Math.abs(this.x - other.x) < tolerance &&
      Math.abs(this.y - other.y) < tolerance &&
      Math.abs(this.z - other.z) < tolerance
    );
  }

  /** Check if this is the zero vector */
  isZero(tolerance: number = EPSILON): boolean {
    return this.lengthSquared < tolerance * tolerance;
  }

  /** Check if this is a unit vector */
  isNormalized(tolerance: number = EPSILON): boolean {
    return Math.abs(this.lengthSquared - 1) < tolerance;
  }

  // ========== Utility ==========

  /** Create a copy */
  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  /** Convert to array */
  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  /** String representation */
  toString(precision: number = 4): string {
    return `(${this.x.toFixed(precision)}, ${this.y.toFixed(precision)}, ${this.z.toFixed(precision)})`;
  }

  /**
   * Linear interpolation between this vector and another
   * @param other Target vector
   * @param t Interpolation parameter (0 = this, 1 = other)
   */
  lerp(other: Vector3, t: number): Vector3 {
    return new Vector3(
      this.x + (other.x - this.x) * t,
      this.y + (other.y - this.y) * t,
      this.z + (other.z - this.z) * t
    );
  }

  /**
   * Spherical linear interpolation (for unit vectors)
   * Maintains constant angular velocity along the arc
   */
  slerp(other: Vector3, t: number): Vector3 {
    const dot = Math.max(-1, Math.min(1, this.dot(other)));
    const theta = Math.acos(dot);

    if (theta < EPSILON) {
      return this.clone();
    }

    const sinTheta = Math.sin(theta);
    const a = Math.sin((1 - t) * theta) / sinTheta;
    const b = Math.sin(t * theta) / sinTheta;

    return this.scale(a).add(other.scale(b));
  }

  // ========== Numerical Stability Methods ==========

  /**
   * Check if vector is numerically stable for geometric operations
   * Vectors with very small magnitude may cause division issues
   * @param threshold - Minimum acceptable magnitude (default: EPSILON)
   */
  isStable(threshold: number = EPSILON): boolean {
    return this.length > threshold;
  }

  /**
   * Strict angle calculation with explicit NaN for undefined cases
   * Use this when you need to distinguish between zero angle and undefined angle
   * @param other - Vector to calculate angle with
   * @returns Angle in radians, or NaN if either vector is zero
   */
  angleToStrict(other: Vector3): number {
    const lenProduct = this.length * other.length;
    if (lenProduct < EPSILON) {
      return NaN; // Explicitly undefined for zero vectors
    }
    const cosAngle = Math.max(-1, Math.min(1, this.dot(other) / lenProduct));
    return Math.acos(cosAngle);
  }
}

// ========== Utility Functions ==========

/**
 * Build an orthonormal basis from a single vector
 * Returns [tangent1, tangent2] such that input × tangent1 = tangent2
 */
export function buildOrthonormalBasis(normal: Vector3): [Vector3, Vector3] {
  const n = normal.normalize();

  // Choose a reference vector that's not parallel to normal
  // Use the axis most perpendicular to the normal
  let reference: Vector3;
  if (Math.abs(n.x) < Math.abs(n.y) && Math.abs(n.x) < Math.abs(n.z)) {
    reference = Vector3.X;
  } else if (Math.abs(n.y) < Math.abs(n.z)) {
    reference = Vector3.Y;
  } else {
    reference = Vector3.Z;
  }

  // Gram-Schmidt to get first tangent
  const tangent1 = reference.perpendicular(n).normalize();
  // Second tangent from cross product
  const tangent2 = n.cross(tangent1);

  return [tangent1, tangent2];
}

/**
 * Rotate a vector around an axis using Rodrigues' formula
 * @param v Vector to rotate
 * @param axis Rotation axis (unit vector)
 * @param angle Rotation angle (radians)
 */
export function rotateAroundAxis(v: Vector3, axis: Vector3, angle: number): Vector3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const k = axis.normalize();
  const vDotK = v.dot(k);
  const kCrossV = k.cross(v);

  // v' = v×cos(θ) + (k×v)×sin(θ) + k×(k·v)×(1-cos(θ))
  return v.scale(c).add(kCrossV.scale(s)).add(k.scale(vDotK * (1 - c)));
}

/**
 * Compute the signed angle from v1 to v2 around axis
 * Returns angle in radians, positive is counterclockwise when viewing along axis
 */
export function signedAngle(v1: Vector3, v2: Vector3, axis: Vector3): number {
  const cross = v1.cross(v2);
  const angle = Math.atan2(cross.length, v1.dot(v2));
  return cross.dot(axis) < 0 ? -angle : angle;
}
