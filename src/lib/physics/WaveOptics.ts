// 波动光学工具

/**
 * @fileoverview Wave Optics Module - Jones Calculus Implementation
 *
 * STATUS: Active - This module is used by the game engine (World.ts, LightPhysics.ts)
 *
 * Migration Notes:
 * - The unified physics module (src/lib/physics/unified/) provides CoherencyMatrix
 * - CoherencyMatrix is intended for partial polarization representation
 * - Current game implementation uses JonesVector/WaveLight for full polarization simulation
 *
 * Future: Consider migrating to CoherencyMatrix when partial polarization support is needed
 *
 * @see src/lib/physics/unified/CoherencyMatrix.ts
 * @see src/lib/physics/LightPhysics.ts (uses this module)
 * @see src/lib/World.ts (uses WaveLight type)
 */

/**
 * PolarCraft - Wave Optics Engine
 * Jones Calculus implementation for accurate polarization simulation
 *
 * This module provides:
 * - Complex number arithmetic
 * - Jones Vector representation for polarized light
 * - Jones Matrix operations for optical elements
 * - Wavelength-dependent dispersion modeling
 * - Non-ideal device parameters (extinction ratio, phase errors)
 * - Stokes vector representation for partially polarized light
 */

// ============== Physical Constants ==============

/** Speed of light in vacuum (m/s) */
export const SPEED_OF_LIGHT = 299792458;

/** Visible spectrum range (nm) */
export const VISIBLE_SPECTRUM = {
  min: 380,
  max: 780,
  red: 700,
  green: 550,
  blue: 450,
};

// ============== Dispersion Models ==============

/**
 * Sellmeier coefficients for common optical materials
 * n²(λ) = 1 + Σ (Bᵢ × λ²) / (λ² - Cᵢ)
 * λ in micrometers
 */
export const SELLMEIER_COEFFICIENTS: Record<string, { B: number[]; C: number[] }> = {
  // BK7 玻璃 (Schott borosilicate crown glass)
  BK7: {
    B: [1.03961212, 0.231792344, 1.01046945],
    C: [0.00600069867, 0.0200179144, 103.560653],
  },
  // 熔融石英 (Fused silica)
  fusedSilica: {
    B: [0.6961663, 0.4079426, 0.8974794],
    C: [0.0046791, 0.0135121, 97.93400],
  },
  // 水 (Water at 20°C)
  water: {
    B: [0.5684027565, 0.1726177391, 0.02086189578],
    C: [0.005101829712, 0.01821153936, 0.02620722293],
  },
  // 金刚石 (Diamond)
  diamond: {
    B: [4.3356, 0.3306],
    C: [0.0, 0.0175],
  },
  // 蓝宝石 (Sapphire, ordinary ray)
  sapphire: {
    B: [1.4313493, 0.65054713, 5.3414021],
    C: [0.0052799261, 0.0142382647, 325.01783],
  },
  // 方解石 (Calcite, ordinary ray)
  calciteO: {
    B: [0.73358749, 0.96464345, 1.82831454],
    C: [0.00420279, 0.01064553, 110.800],
  },
  // 方解石 (Calcite, extraordinary ray)
  calciteE: {
    B: [0.35859695, 0.61455326, 1.66245509],
    C: [0.00342224, 0.00867756, 80.653],
  },
};

/**
 * Calculate refractive index using Sellmeier equation
 * @param wavelengthNm Wavelength in nanometers
 * @param material Material name (key in SELLMEIER_COEFFICIENTS)
 * @returns Refractive index n(λ)
 */
export function sellmeierIndex(wavelengthNm: number, material: string): number {
  const coeffs = SELLMEIER_COEFFICIENTS[material];
  if (!coeffs) {
    // Fallback to simple Cauchy approximation for unknown materials
    return 1.5 + 0.004 / (wavelengthNm / 1000) ** 2;
  }

  const lambdaMicron = wavelengthNm / 1000;
  const lambda2 = lambdaMicron * lambdaMicron;

  let n2 = 1;
  for (let i = 0; i < coeffs.B.length; i++) {
    n2 += (coeffs.B[i] * lambda2) / (lambda2 - coeffs.C[i]);
  }

  return Math.sqrt(Math.max(1, n2));
}

/**
 * Simple Cauchy dispersion model: n(λ) = A + B/λ²
 * @param wavelengthNm Wavelength in nanometers
 * @param A Base refractive index (typically 1.4-1.7)
 * @param B Dispersion coefficient (typically 0.003-0.01 μm²)
 * @returns Refractive index
 */
export function cauchyIndex(wavelengthNm: number, A: number, B: number): number {
  const lambdaMicron = wavelengthNm / 1000;
  return A + B / (lambdaMicron * lambdaMicron);
}

/**
 * Get birefringence (Δn = ne - no) for calcite at given wavelength
 * @param wavelengthNm Wavelength in nanometers
 * @returns Birefringence Δn
 */
export function calciteBirefringence(wavelengthNm: number): number {
  const no = sellmeierIndex(wavelengthNm, 'calciteO');
  const ne = sellmeierIndex(wavelengthNm, 'calciteE');
  return ne - no; // Negative birefringence for calcite
}

/**
 * Convert wavelength to approximate RGB color
 * @param wavelengthNm Wavelength in nanometers (380-780)
 * @returns RGB object { r, g, b } with values 0-255
 */
export function wavelengthToRGB(wavelengthNm: number): { r: number; g: number; b: number } {
  let r = 0, g = 0, b = 0;
  const wavelength = Math.max(380, Math.min(780, wavelengthNm));

  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0;
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1;
    g = 0;
    b = 0;
  }

  // Intensity correction at spectrum edges
  let factor = 1.0;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else if (wavelength >= 700 && wavelength <= 780) {
    factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
  }

  return {
    r: Math.round(255 * r * factor),
    g: Math.round(255 * g * factor),
    b: Math.round(255 * b * factor),
  };
}

/**
 * Calculate phase retardation of a waveplate at specific wavelength
 * δ = 2π × Δn × d / λ
 * @param designWavelength Design wavelength (e.g., 550 nm for λ/4)
 * @param actualWavelength Actual wavelength being used
 * @param nominalRetardation Nominal retardation at design wavelength (e.g., π/2 for λ/4)
 * @param birefringenceRatio Ratio of birefringence at actual vs design wavelength (default 1)
 * @returns Actual phase retardation in radians
 */
export function waveplateRetardation(
  designWavelength: number,
  actualWavelength: number,
  nominalRetardation: number,
  birefringenceRatio: number = 1
): number {
  return nominalRetardation * (designWavelength / actualWavelength) * birefringenceRatio;
}

// ============== Non-Ideal Device Parameters ==============

/**
 * Parameters for non-ideal polarizer
 */
export interface NonIdealPolarizerParams {
  /** Extinction ratio (transmittance ratio for blocked vs passed polarization) */
  extinctionRatio: number; // e.g., 10000:1 → 10000
  /** Principal transmittance (max transmission for aligned polarization) */
  principalTransmittance: number; // 0-1, typically 0.85-0.95
  /** Angular acceptance (half-angle in degrees for near-ideal performance) */
  angularAcceptance?: number;
}

/**
 * Parameters for non-ideal waveplate
 */
export interface NonIdealWaveplateParams {
  /** Phase error from nominal retardation (radians) */
  phaseError: number; // e.g., ±0.02 rad
  /** Fast axis alignment error (degrees) */
  axisError: number; // e.g., ±0.5°
  /** Transmittance */
  transmittance: number; // 0-1, typically 0.95-0.99
  /** Design wavelength (nm) */
  designWavelength: number; // e.g., 550 nm
}

/**
 * Parameters for non-ideal beam splitter
 */
export interface NonIdealBeamSplitterParams {
  /** Splitting ratio deviation from 50:50 */
  splitRatioError: number; // e.g., 0.02 means 52:48 instead of 50:50
  /** Phase difference between s and p polarization on reflection */
  phaseDifference: number; // radians
  /** Absorption loss per surface */
  absorptionLoss: number; // 0-1
}

/**
 * Default ideal device parameters
 */
export const IDEAL_POLARIZER: NonIdealPolarizerParams = {
  extinctionRatio: Infinity,
  principalTransmittance: 1.0,
  angularAcceptance: 90,
};

export const IDEAL_WAVEPLATE: NonIdealWaveplateParams = {
  phaseError: 0,
  axisError: 0,
  transmittance: 1.0,
  designWavelength: 550,
};

export const IDEAL_BEAM_SPLITTER: NonIdealBeamSplitterParams = {
  splitRatioError: 0,
  phaseDifference: 0,
  absorptionLoss: 0,
};

/**
 * Typical real-world device parameters
 */
export const TYPICAL_POLARIZER: NonIdealPolarizerParams = {
  extinctionRatio: 10000, // 10000:1
  principalTransmittance: 0.88,
  angularAcceptance: 20,
};

export const TYPICAL_WAVEPLATE: NonIdealWaveplateParams = {
  phaseError: 0.02, // ~1° phase error
  axisError: 0.5, // ±0.5° axis alignment
  transmittance: 0.96,
  designWavelength: 550,
};

export const TYPICAL_BEAM_SPLITTER: NonIdealBeamSplitterParams = {
  splitRatioError: 0.02,
  phaseDifference: 0.05,
  absorptionLoss: 0.02,
};

// ============== Complex Number Class ==============

/**
 * Complex number representation for wave optics calculations
 * z = real + i * imag
 */
export class Complex {
  constructor(
    public readonly real: number,
    public readonly imag: number = 0
  ) {}

  // Factory methods
  static fromPolar(magnitude: number, phase: number): Complex {
    return new Complex(
      magnitude * Math.cos(phase),
      magnitude * Math.sin(phase)
    );
  }

  static readonly ZERO = new Complex(0, 0);
  static readonly ONE = new Complex(1, 0);
  static readonly I = new Complex(0, 1);

  // Basic operations
  add(other: Complex): Complex {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  subtract(other: Complex): Complex {
    return new Complex(this.real - other.real, this.imag - other.imag);
  }

  multiply(other: Complex): Complex {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  scale(scalar: number): Complex {
    return new Complex(this.real * scalar, this.imag * scalar);
  }

  divide(other: Complex): Complex {
    const denominator = other.real * other.real + other.imag * other.imag;
    if (denominator === 0) {
      throw new Error('Division by zero in complex number');
    }
    return new Complex(
      (this.real * other.real + this.imag * other.imag) / denominator,
      (this.imag * other.real - this.real * other.imag) / denominator
    );
  }

  conjugate(): Complex {
    return new Complex(this.real, -this.imag);
  }

  // Properties
  get magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  get magnitudeSquared(): number {
    return this.real * this.real + this.imag * this.imag;
  }

  get phase(): number {
    return Math.atan2(this.imag, this.real);
  }

  // Utility
  isZero(tolerance: number = 1e-10): boolean {
    return this.magnitudeSquared < tolerance;
  }

  equals(other: Complex, tolerance: number = 1e-10): boolean {
    return Math.abs(this.real - other.real) < tolerance &&
           Math.abs(this.imag - other.imag) < tolerance;
  }

  toString(): string {
    if (this.imag >= 0) {
      return `${this.real.toFixed(4)} + ${this.imag.toFixed(4)}i`;
    }
    return `${this.real.toFixed(4)} - ${Math.abs(this.imag).toFixed(4)}i`;
  }
}

// ============== Jones Vector ==============

/**
 * Jones Vector representation for polarized light
 * E = [Ex, Ey]^T where Ex and Ey are complex amplitudes
 *
 * The Jones vector fully describes the polarization state:
 * - Linear polarization: phase difference = 0 or π
 * - Circular polarization: |Ex| = |Ey| and phase difference = ±π/2
 * - Elliptical: all other cases
 */
export class JonesVector {
  constructor(
    public readonly Ex: Complex,
    public readonly Ey: Complex
  ) {}

  // Factory methods for common polarization states

  /**
   * Linear polarization at angle θ (in radians)
   * E = [cos(θ), sin(θ)]^T
   */
  static linearPolarization(angleRadians: number, amplitude: number = 1): JonesVector {
    return new JonesVector(
      new Complex(amplitude * Math.cos(angleRadians)),
      new Complex(amplitude * Math.sin(angleRadians))
    );
  }

  /**
   * Linear polarization at angle θ (in degrees)
   */
  static linearPolarizationDegrees(angleDegrees: number, amplitude: number = 1): JonesVector {
    return JonesVector.linearPolarization(angleDegrees * Math.PI / 180, amplitude);
  }

  /**
   * Horizontal linear polarization (0°)
   */
  static horizontal(amplitude: number = 1): JonesVector {
    return new JonesVector(new Complex(amplitude), Complex.ZERO);
  }

  /**
   * Vertical linear polarization (90°)
   */
  static vertical(amplitude: number = 1): JonesVector {
    return new JonesVector(Complex.ZERO, new Complex(amplitude));
  }

  /**
   * 45° linear polarization
   */
  static diagonal(amplitude: number = 1): JonesVector {
    const component = amplitude / Math.SQRT2;
    return new JonesVector(new Complex(component), new Complex(component));
  }

  /**
   * 135° linear polarization (anti-diagonal)
   */
  static antiDiagonal(amplitude: number = 1): JonesVector {
    const component = amplitude / Math.SQRT2;
    return new JonesVector(new Complex(component), new Complex(-component));
  }

  /**
   * Right circular polarization
   * E = [1, -i]^T / √2
   */
  static rightCircular(amplitude: number = 1): JonesVector {
    const component = amplitude / Math.SQRT2;
    return new JonesVector(
      new Complex(component),
      new Complex(0, -component)
    );
  }

  /**
   * Left circular polarization
   * E = [1, i]^T / √2
   */
  static leftCircular(amplitude: number = 1): JonesVector {
    const component = amplitude / Math.SQRT2;
    return new JonesVector(
      new Complex(component),
      new Complex(0, component)
    );
  }

  /**
   * Unpolarized light cannot be represented by a single Jones vector.
   * For simulation purposes, we create a "pseudo-unpolarized" state
   * by averaging over many polarization states during propagation.
   * This factory creates a random linear polarization for stochastic simulation.
   */
  static randomLinear(amplitude: number = 1): JonesVector {
    const angle = Math.random() * Math.PI;
    return JonesVector.linearPolarization(angle, amplitude);
  }

  // Operations

  /**
   * Add two Jones vectors (superposition)
   */
  add(other: JonesVector): JonesVector {
    return new JonesVector(
      this.Ex.add(other.Ex),
      this.Ey.add(other.Ey)
    );
  }

  /**
   * Scale the Jones vector
   */
  scale(scalar: number): JonesVector {
    return new JonesVector(
      this.Ex.scale(scalar),
      this.Ey.scale(scalar)
    );
  }

  /**
   * Scale by complex number (for phase shifts)
   */
  scaleComplex(c: Complex): JonesVector {
    return new JonesVector(
      this.Ex.multiply(c),
      this.Ey.multiply(c)
    );
  }

  // Properties

  /**
   * Total intensity: I = |Ex|² + |Ey|²
   */
  get intensity(): number {
    return this.Ex.magnitudeSquared + this.Ey.magnitudeSquared;
  }

  /**
   * Convert intensity to game integer scale (0-15)
   * For linear polarization with amplitude A, intensity = A²
   * amplitude 1 → intensity 1 → maxIntensity
   */
  getIntensityScaled(maxIntensity: number = 15): number {
    // intensity = |Ex|² + |Ey|² = amplitude² for linear polarization
    // Scale: intensity 1 → maxIntensity, capped at maxIntensity
    return Math.min(maxIntensity, Math.round(this.intensity * maxIntensity));
  }

  /**
   * Get the primary polarization angle (for linear or near-linear polarization)
   * Returns angle in degrees (0-180)
   */
  getPolarizationAngle(): number {
    // For linear polarization, the angle is atan2(|Ey|, |Ex|)
    // But for elliptical, we need to find the major axis angle
    // Simplified: use the phase relationship
    const exMag = this.Ex.magnitude;
    const eyMag = this.Ey.magnitude;

    if (exMag < 1e-10 && eyMag < 1e-10) {
      return 0;
    }

    // Use the major axis of the polarization ellipse
    let angle = Math.atan2(eyMag, exMag) * 180 / Math.PI;

    // Normalize to 0-180 range
    while (angle < 0) angle += 180;
    while (angle >= 180) angle -= 180;

    return angle;
  }

  /**
   * Quantize polarization angle to discrete game values
   */
  getDiscretePolarization(): 0 | 45 | 90 | 135 {
    const angle = this.getPolarizationAngle();
    const validAngles: (0 | 45 | 90 | 135)[] = [0, 45, 90, 135];

    let closest = validAngles[0];
    let minDiff = Math.abs(angle - validAngles[0]);

    for (const valid of validAngles) {
      // Handle wrap-around at 180 -> 0
      let diff = Math.abs(angle - valid);
      if (diff > 90) diff = 180 - diff;

      if (diff < minDiff) {
        minDiff = diff;
        closest = valid;
      }
    }

    return closest;
  }

  /**
   * Get effective phase (1 or -1) based on the sign of the real part of Ex
   * This is a simplified model for game compatibility
   */
  getDiscretePhase(): 1 | -1 {
    // Use the phase of the dominant component
    if (this.Ex.magnitudeSquared >= this.Ey.magnitudeSquared) {
      return this.Ex.real >= 0 ? 1 : -1;
    }
    return this.Ey.real >= 0 ? 1 : -1;
  }

  /**
   * Check if intensity is above threshold
   */
  isAboveThreshold(threshold: number = 0.01): boolean {
    return this.intensity > threshold;
  }

  /**
   * Check if this is essentially zero (absorbed)
   */
  isZero(tolerance: number = 1e-10): boolean {
    return this.Ex.isZero(tolerance) && this.Ey.isZero(tolerance);
  }

  /**
   * Normalize to unit intensity
   */
  normalize(): JonesVector {
    const intensity = this.intensity;
    if (intensity < 1e-10) {
      return JonesVector.horizontal(0);
    }
    const scale = 1 / Math.sqrt(intensity);
    return this.scale(scale);
  }

  toString(): string {
    return `JonesVector([${this.Ex}], [${this.Ey}]) I=${this.intensity.toFixed(4)}`;
  }
}

// ============== Jones Matrix ==============

/**
 * 2x2 Jones Matrix for optical elements
 * [a b]   [Ex]   [Ex']
 * [c d] × [Ey] = [Ey']
 */
export class JonesMatrix {
  constructor(
    public readonly a: Complex,
    public readonly b: Complex,
    public readonly c: Complex,
    public readonly d: Complex
  ) {}

  // Factory methods for common optical elements

  /**
   * Identity matrix (no change)
   */
  static identity(): JonesMatrix {
    return new JonesMatrix(
      Complex.ONE, Complex.ZERO,
      Complex.ZERO, Complex.ONE
    );
  }

  /**
   * Linear polarizer at angle θ (in radians)
   * Projects onto the polarization axis
   */
  static linearPolarizer(angleRadians: number): JonesMatrix {
    const c = Math.cos(angleRadians);
    const s = Math.sin(angleRadians);
    return new JonesMatrix(
      new Complex(c * c), new Complex(c * s),
      new Complex(c * s), new Complex(s * s)
    );
  }

  /**
   * Linear polarizer at angle θ (in degrees)
   */
  static linearPolarizerDegrees(angleDegrees: number): JonesMatrix {
    return JonesMatrix.linearPolarizer(angleDegrees * Math.PI / 180);
  }

  /**
   * Horizontal polarizer (0°)
   */
  static horizontalPolarizer(): JonesMatrix {
    return new JonesMatrix(
      Complex.ONE, Complex.ZERO,
      Complex.ZERO, Complex.ZERO
    );
  }

  /**
   * Vertical polarizer (90°)
   */
  static verticalPolarizer(): JonesMatrix {
    return new JonesMatrix(
      Complex.ZERO, Complex.ZERO,
      Complex.ZERO, Complex.ONE
    );
  }

  /**
   * Wave plate (retarder) with given retardation and fast axis angle
   * @param retardation Phase retardation in radians (π/2 for quarter-wave, π for half-wave)
   * @param fastAxisAngle Angle of fast axis in radians
   */
  static waveplate(retardation: number, fastAxisAngle: number): JonesMatrix {
    const c = Math.cos(fastAxisAngle);
    const s = Math.sin(fastAxisAngle);
    const c2 = c * c;
    const s2 = s * s;
    const cs = c * s;

    const expPlus = Complex.fromPolar(1, retardation / 2);
    const expMinus = Complex.fromPolar(1, -retardation / 2);

    // Wave plate matrix in rotated coordinates:
    // R(-θ) × diag(e^{iδ/2}, e^{-iδ/2}) × R(θ)
    const a = new Complex(c2).multiply(expPlus).add(new Complex(s2).multiply(expMinus));
    const b = new Complex(cs).multiply(expPlus.subtract(expMinus));
    const cMat = new Complex(cs).multiply(expPlus.subtract(expMinus));
    const d = new Complex(s2).multiply(expPlus).add(new Complex(c2).multiply(expMinus));

    return new JonesMatrix(a, b, cMat, d);
  }

  /**
   * Quarter-wave plate (λ/4) with fast axis at given angle
   */
  static quarterWavePlate(fastAxisAngleRadians: number): JonesMatrix {
    return JonesMatrix.waveplate(Math.PI / 2, fastAxisAngleRadians);
  }

  /**
   * Quarter-wave plate with fast axis at given angle in degrees
   */
  static quarterWavePlateDegrees(fastAxisAngleDegrees: number): JonesMatrix {
    return JonesMatrix.quarterWavePlate(fastAxisAngleDegrees * Math.PI / 180);
  }

  /**
   * Half-wave plate (λ/2) with fast axis at given angle
   * Rotates polarization by 2θ
   */
  static halfWavePlate(fastAxisAngleRadians: number): JonesMatrix {
    return JonesMatrix.waveplate(Math.PI, fastAxisAngleRadians);
  }

  /**
   * Half-wave plate with fast axis at given angle in degrees
   */
  static halfWavePlateDegrees(fastAxisAngleDegrees: number): JonesMatrix {
    return JonesMatrix.halfWavePlate(fastAxisAngleDegrees * Math.PI / 180);
  }

  /**
   * Optical rotator (e.g., Faraday rotator, optically active medium)
   * Rotates polarization by angle θ
   */
  static rotator(angleRadians: number): JonesMatrix {
    const c = Math.cos(angleRadians);
    const s = Math.sin(angleRadians);
    return new JonesMatrix(
      new Complex(c), new Complex(-s),
      new Complex(s), new Complex(c)
    );
  }

  /**
   * Optical rotator with angle in degrees
   */
  static rotatorDegrees(angleDegrees: number): JonesMatrix {
    return JonesMatrix.rotator(angleDegrees * Math.PI / 180);
  }

  /**
   * Attenuator (reduces amplitude by factor)
   * @param transmittance Amplitude transmittance (0-1)
   */
  static attenuator(transmittance: number): JonesMatrix {
    const t = new Complex(Math.sqrt(Math.max(0, Math.min(1, transmittance))));
    return new JonesMatrix(t, Complex.ZERO, Complex.ZERO, t);
  }

  /**
   * Phase shifter (adds phase to both components)
   */
  static phaseShifter(phaseRadians: number): JonesMatrix {
    const phase = Complex.fromPolar(1, phaseRadians);
    return new JonesMatrix(phase, Complex.ZERO, Complex.ZERO, phase);
  }

  /**
   * Mirror reflection (flips one component)
   * Assumes mirror is aligned with x-axis
   */
  static mirror(): JonesMatrix {
    return new JonesMatrix(
      Complex.ONE, Complex.ZERO,
      Complex.ZERO, new Complex(-1)
    );
  }

  // Operations

  /**
   * Apply matrix to Jones vector: E' = M × E
   */
  apply(vector: JonesVector): JonesVector {
    const newEx = this.a.multiply(vector.Ex).add(this.b.multiply(vector.Ey));
    const newEy = this.c.multiply(vector.Ex).add(this.d.multiply(vector.Ey));
    return new JonesVector(newEx, newEy);
  }

  /**
   * Matrix multiplication: M1 × M2
   */
  multiply(other: JonesMatrix): JonesMatrix {
    return new JonesMatrix(
      this.a.multiply(other.a).add(this.b.multiply(other.c)),
      this.a.multiply(other.b).add(this.b.multiply(other.d)),
      this.c.multiply(other.a).add(this.d.multiply(other.c)),
      this.c.multiply(other.b).add(this.d.multiply(other.d))
    );
  }

  /**
   * Scale matrix by scalar
   */
  scale(scalar: number): JonesMatrix {
    return new JonesMatrix(
      this.a.scale(scalar),
      this.b.scale(scalar),
      this.c.scale(scalar),
      this.d.scale(scalar)
    );
  }

  toString(): string {
    return `JonesMatrix([[${this.a}, ${this.b}], [${this.c}, ${this.d}]])`;
  }

  // ============== Non-Ideal Device Methods ==============

  /**
   * Non-ideal linear polarizer with extinction ratio and transmittance
   * Models real-world polarizers where some blocked light leaks through
   * @param angleDegrees Transmission axis angle in degrees
   * @param params Non-ideal polarizer parameters
   */
  static nonIdealPolarizer(angleDegrees: number, params: NonIdealPolarizerParams): JonesMatrix {
    const angleRad = angleDegrees * Math.PI / 180;
    const c = Math.cos(angleRad);
    const s = Math.sin(angleRad);

    // Principal transmittance for the passed polarization
    const t1 = Math.sqrt(params.principalTransmittance);
    // Transmittance for the blocked polarization (leakage)
    const t2 = params.extinctionRatio === Infinity
      ? 0
      : t1 / Math.sqrt(params.extinctionRatio);

    // Build the matrix: R(-θ) × diag(t1, t2) × R(θ)
    const c2 = c * c;
    const s2 = s * s;
    const cs = c * s;

    return new JonesMatrix(
      new Complex(t1 * c2 + t2 * s2),
      new Complex((t1 - t2) * cs),
      new Complex((t1 - t2) * cs),
      new Complex(t1 * s2 + t2 * c2)
    );
  }

  /**
   * Non-ideal waveplate with phase error and axis misalignment
   * Models real-world wave plates with manufacturing tolerances
   * @param nominalRetardation Nominal retardation (π/2 for λ/4, π for λ/2)
   * @param fastAxisDegrees Fast axis angle in degrees
   * @param params Non-ideal waveplate parameters
   * @param wavelengthNm Optional: actual wavelength for chromatic correction
   */
  static nonIdealWaveplate(
    nominalRetardation: number,
    fastAxisDegrees: number,
    params: NonIdealWaveplateParams,
    wavelengthNm?: number
  ): JonesMatrix {
    // Apply axis error
    const effectiveAxisRad = (fastAxisDegrees + params.axisError) * Math.PI / 180;

    // Calculate actual retardation
    let actualRetardation = nominalRetardation + params.phaseError;

    // Apply wavelength correction if provided
    if (wavelengthNm && params.designWavelength) {
      actualRetardation *= params.designWavelength / wavelengthNm;
    }

    // Build waveplate matrix with actual retardation
    const waveplateMatrix = JonesMatrix.waveplate(actualRetardation, effectiveAxisRad);

    // Apply transmittance
    if (params.transmittance < 1) {
      const attenuator = JonesMatrix.attenuator(params.transmittance);
      return attenuator.multiply(waveplateMatrix);
    }

    return waveplateMatrix;
  }

  /**
   * Non-ideal beam splitter with splitting ratio error and phase shifts
   * @param splitRatio Nominal splitting ratio (0-1, default 0.5)
   * @param params Non-ideal beam splitter parameters
   * @returns Object with transmitted and reflected matrices
   */
  static nonIdealBeamSplitter(
    splitRatio: number = 0.5,
    params: NonIdealBeamSplitterParams
  ): { transmitted: JonesMatrix; reflected: JonesMatrix } {
    const effectiveRatio = splitRatio + params.splitRatioError;
    const t = Math.sqrt(Math.max(0, Math.min(1, effectiveRatio)) * (1 - params.absorptionLoss));
    const r = Math.sqrt(Math.max(0, Math.min(1, 1 - effectiveRatio)) * (1 - params.absorptionLoss));

    // Transmitted beam (no phase change for s-polarization)
    const transmitted = new JonesMatrix(
      new Complex(t), Complex.ZERO,
      Complex.ZERO, new Complex(t)
    );

    // Reflected beam (with optional phase difference between s and p)
    const phaseFactor = Complex.fromPolar(1, params.phaseDifference);
    const reflected = new JonesMatrix(
      new Complex(r), Complex.ZERO,
      Complex.ZERO, new Complex(r).multiply(phaseFactor)
    );

    return { transmitted, reflected };
  }
}

// ============== Stokes Vector ==============

/**
 * Stokes Vector representation for polarization state
 * S = [S0, S1, S2, S3]^T where:
 * - S0: Total intensity
 * - S1: Horizontal vs Vertical linear polarization
 * - S2: +45° vs -45° linear polarization
 * - S3: Right vs Left circular polarization
 *
 * Unlike Jones vectors, Stokes vectors can represent:
 * - Unpolarized light
 * - Partially polarized light
 * - Mixed polarization states
 */
export class StokesVector {
  constructor(
    public readonly S0: number, // Total intensity
    public readonly S1: number, // I_H - I_V
    public readonly S2: number, // I_+45 - I_-45
    public readonly S3: number  // I_R - I_L
  ) {}

  // Factory methods for common polarization states

  /** Unpolarized light with given intensity */
  static unpolarized(intensity: number = 1): StokesVector {
    return new StokesVector(intensity, 0, 0, 0);
  }

  /** Horizontal linear polarization */
  static horizontal(intensity: number = 1): StokesVector {
    return new StokesVector(intensity, intensity, 0, 0);
  }

  /** Vertical linear polarization */
  static vertical(intensity: number = 1): StokesVector {
    return new StokesVector(intensity, -intensity, 0, 0);
  }

  /** +45° linear polarization */
  static diagonal(intensity: number = 1): StokesVector {
    return new StokesVector(intensity, 0, intensity, 0);
  }

  /** -45° linear polarization */
  static antiDiagonal(intensity: number = 1): StokesVector {
    return new StokesVector(intensity, 0, -intensity, 0);
  }

  /** Right circular polarization */
  static rightCircular(intensity: number = 1): StokesVector {
    return new StokesVector(intensity, 0, 0, intensity);
  }

  /** Left circular polarization */
  static leftCircular(intensity: number = 1): StokesVector {
    return new StokesVector(intensity, 0, 0, -intensity);
  }

  /** Linear polarization at arbitrary angle (in degrees) */
  static linearPolarizationDegrees(angleDegrees: number, intensity: number = 1): StokesVector {
    const angle = angleDegrees * 2 * Math.PI / 180; // 2θ for Stokes
    return new StokesVector(
      intensity,
      intensity * Math.cos(angle),
      intensity * Math.sin(angle),
      0
    );
  }

  /** Create from Jones vector */
  static fromJonesVector(jones: JonesVector): StokesVector {
    const Ex = jones.Ex;
    const Ey = jones.Ey;

    // S0 = |Ex|² + |Ey|²
    const S0 = Ex.magnitudeSquared + Ey.magnitudeSquared;
    // S1 = |Ex|² - |Ey|²
    const S1 = Ex.magnitudeSquared - Ey.magnitudeSquared;
    // S2 = 2·Re(Ex·Ey*)
    const S2 = 2 * (Ex.real * Ey.real + Ex.imag * Ey.imag);
    // S3 = 2·Im(Ex·Ey*)
    const S3 = 2 * (Ex.imag * Ey.real - Ex.real * Ey.imag);

    return new StokesVector(S0, S1, S2, S3);
  }

  // Properties

  /** Total intensity */
  get intensity(): number {
    return this.S0;
  }

  /** Degree of polarization (0 = unpolarized, 1 = fully polarized) */
  get degreeOfPolarization(): number {
    if (this.S0 === 0) return 0;
    const polarizedPart = Math.sqrt(this.S1 ** 2 + this.S2 ** 2 + this.S3 ** 2);
    return Math.min(1, polarizedPart / this.S0);
  }

  /** Polarization ellipse orientation angle (degrees) */
  get orientationAngle(): number {
    return Math.atan2(this.S2, this.S1) * 90 / Math.PI; // Result in degrees
  }

  /** Polarization ellipse ellipticity angle (degrees) */
  get ellipticityAngle(): number {
    const dop = this.degreeOfPolarization;
    if (dop === 0) return 0;
    const normalizedS3 = this.S3 / (this.S0 * dop);
    return Math.asin(Math.max(-1, Math.min(1, normalizedS3))) * 45 / Math.PI;
  }

  /** Check if light is essentially unpolarized */
  isUnpolarized(tolerance: number = 0.01): boolean {
    return this.degreeOfPolarization < tolerance;
  }

  /** Check if light is linearly polarized */
  isLinear(tolerance: number = 0.01): boolean {
    if (this.S0 === 0) return false;
    return Math.abs(this.S3 / this.S0) < tolerance && this.degreeOfPolarization > 1 - tolerance;
  }

  /** Check if light is circularly polarized */
  isCircular(tolerance: number = 0.01): boolean {
    if (this.S0 === 0) return false;
    const linearPart = Math.sqrt(this.S1 ** 2 + this.S2 ** 2);
    return linearPart / this.S0 < tolerance && Math.abs(this.S3 / this.S0) > 1 - tolerance;
  }

  // Operations

  /** Add two Stokes vectors (incoherent superposition) */
  add(other: StokesVector): StokesVector {
    return new StokesVector(
      this.S0 + other.S0,
      this.S1 + other.S1,
      this.S2 + other.S2,
      this.S3 + other.S3
    );
  }

  /** Scale by a factor */
  scale(factor: number): StokesVector {
    return new StokesVector(
      this.S0 * factor,
      this.S1 * factor,
      this.S2 * factor,
      this.S3 * factor
    );
  }

  /** Mix with unpolarized light */
  mixWithUnpolarized(unpolarizedIntensity: number): StokesVector {
    return new StokesVector(
      this.S0 + unpolarizedIntensity,
      this.S1,
      this.S2,
      this.S3
    );
  }

  /** Normalize to unit intensity */
  normalize(): StokesVector {
    if (this.S0 === 0) return StokesVector.unpolarized(0);
    const scale = 1 / this.S0;
    return new StokesVector(1, this.S1 * scale, this.S2 * scale, this.S3 * scale);
  }

  /** Convert to array */
  toArray(): [number, number, number, number] {
    return [this.S0, this.S1, this.S2, this.S3];
  }

  toString(): string {
    return `StokesVector([${this.S0.toFixed(4)}, ${this.S1.toFixed(4)}, ${this.S2.toFixed(4)}, ${this.S3.toFixed(4)}]) DOP=${(this.degreeOfPolarization * 100).toFixed(1)}%`;
  }
}

// ============== Mueller Matrix ==============

/**
 * 4x4 Mueller Matrix for optical element characterization
 * S' = M × S where S is a Stokes vector
 *
 * Mueller matrices can represent:
 * - Depolarizing elements
 * - Partial polarizers
 * - Any optical element acting on partially polarized light
 */
export class MuellerMatrix {
  /** Matrix elements as 4x4 array */
  public readonly elements: number[][];

  constructor(elements: number[][]) {
    if (elements.length !== 4 || elements.some(row => row.length !== 4)) {
      throw new Error('Mueller matrix must be 4x4');
    }
    this.elements = elements.map(row => [...row]);
  }

  // Factory methods for common optical elements

  /** Identity matrix (no change) */
  static identity(): MuellerMatrix {
    return new MuellerMatrix([
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ]);
  }

  /** Ideal linear polarizer at angle θ (degrees) */
  static linearPolarizer(angleDegrees: number): MuellerMatrix {
    const theta = angleDegrees * 2 * Math.PI / 180;
    const c2 = Math.cos(theta);
    const s2 = Math.sin(theta);

    return new MuellerMatrix([
      [0.5, 0.5 * c2, 0.5 * s2, 0],
      [0.5 * c2, 0.5 * c2 * c2, 0.5 * c2 * s2, 0],
      [0.5 * s2, 0.5 * c2 * s2, 0.5 * s2 * s2, 0],
      [0, 0, 0, 0]
    ]);
  }

  /** Horizontal polarizer */
  static horizontalPolarizer(): MuellerMatrix {
    return new MuellerMatrix([
      [0.5, 0.5, 0, 0],
      [0.5, 0.5, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
  }

  /** Vertical polarizer */
  static verticalPolarizer(): MuellerMatrix {
    return new MuellerMatrix([
      [0.5, -0.5, 0, 0],
      [-0.5, 0.5, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
  }

  /** Wave plate (retarder) with phase δ and fast axis at angle θ (degrees) */
  static waveplate(retardationRadians: number, fastAxisDegrees: number): MuellerMatrix {
    const theta = fastAxisDegrees * 2 * Math.PI / 180;
    const delta = retardationRadians;
    const c2 = Math.cos(theta);
    const s2 = Math.sin(theta);
    const cd = Math.cos(delta);
    const sd = Math.sin(delta);

    return new MuellerMatrix([
      [1, 0, 0, 0],
      [0, c2 * c2 + s2 * s2 * cd, c2 * s2 * (1 - cd), -s2 * sd],
      [0, c2 * s2 * (1 - cd), s2 * s2 + c2 * c2 * cd, c2 * sd],
      [0, s2 * sd, -c2 * sd, cd]
    ]);
  }

  /** Quarter-wave plate (λ/4) */
  static quarterWavePlate(fastAxisDegrees: number): MuellerMatrix {
    return MuellerMatrix.waveplate(Math.PI / 2, fastAxisDegrees);
  }

  /** Half-wave plate (λ/2) */
  static halfWavePlate(fastAxisDegrees: number): MuellerMatrix {
    return MuellerMatrix.waveplate(Math.PI, fastAxisDegrees);
  }

  /** Optical rotator (rotation of polarization plane by angle θ) */
  static rotator(angleDegrees: number): MuellerMatrix {
    const theta = angleDegrees * 2 * Math.PI / 180;
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    return new MuellerMatrix([
      [1, 0, 0, 0],
      [0, c, s, 0],
      [0, -s, c, 0],
      [0, 0, 0, 1]
    ]);
  }

  /** Depolarizer (partial or complete) */
  static depolarizer(depolarizationFactor: number): MuellerMatrix {
    const d = 1 - depolarizationFactor; // d=1 means no depolarization
    return new MuellerMatrix([
      [1, 0, 0, 0],
      [0, d, 0, 0],
      [0, 0, d, 0],
      [0, 0, 0, d]
    ]);
  }

  /** Attenuator (intensity reduction) */
  static attenuator(transmittance: number): MuellerMatrix {
    const t = Math.max(0, Math.min(1, transmittance));
    return new MuellerMatrix([
      [t, 0, 0, 0],
      [0, t, 0, 0],
      [0, 0, t, 0],
      [0, 0, 0, t]
    ]);
  }

  /** Convert from Jones matrix (only valid for non-depolarizing elements) */
  static fromJonesMatrix(jones: JonesMatrix): MuellerMatrix {
    const a = jones.a, b = jones.b, c = jones.c, d = jones.d;

    // Mueller matrix from Jones matrix using Kronecker product
    // M = A × conj(A) where A is the Jones matrix
    const aa = a.multiply(a.conjugate()).real;
    const ab = a.multiply(b.conjugate());
    const ac = a.multiply(c.conjugate());
    const ad = a.multiply(d.conjugate());
    const bb = b.multiply(b.conjugate()).real;
    const bc = b.multiply(c.conjugate());
    const bd = b.multiply(d.conjugate());
    const cc = c.multiply(c.conjugate()).real;
    const cd = c.multiply(d.conjugate());
    const dd = d.multiply(d.conjugate()).real;

    return new MuellerMatrix([
      [
        (aa + bb + cc + dd) / 2,
        (aa - bb + cc - dd) / 2,
        ab.real + cd.real,
        ab.imag - cd.imag
      ],
      [
        (aa + bb - cc - dd) / 2,
        (aa - bb - cc + dd) / 2,
        ab.real - cd.real,
        ab.imag + cd.imag
      ],
      [
        ac.real + bd.real,
        ac.real - bd.real,
        ad.real + bc.real,
        ad.imag - bc.imag
      ],
      [
        ac.imag + bd.imag,
        ac.imag - bd.imag,
        ad.imag + bc.imag,
        ad.real - bc.real
      ]
    ]);
  }

  // Operations

  /** Apply to Stokes vector: S' = M × S */
  apply(stokes: StokesVector): StokesVector {
    const s = stokes.toArray();
    const result = [0, 0, 0, 0];

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i] += this.elements[i][j] * s[j];
      }
    }

    return new StokesVector(result[0], result[1], result[2], result[3]);
  }

  /** Matrix multiplication: M1 × M2 */
  multiply(other: MuellerMatrix): MuellerMatrix {
    const result: number[][] = [];
    for (let i = 0; i < 4; i++) {
      result[i] = [];
      for (let j = 0; j < 4; j++) {
        result[i][j] = 0;
        for (let k = 0; k < 4; k++) {
          result[i][j] += this.elements[i][k] * other.elements[k][j];
        }
      }
    }
    return new MuellerMatrix(result);
  }

  /** Scale by a factor */
  scale(factor: number): MuellerMatrix {
    return new MuellerMatrix(
      this.elements.map(row => row.map(val => val * factor))
    );
  }

  /** Check if matrix is physically realizable */
  isPhysical(): boolean {
    // M00 must be non-negative and dominant
    if (this.elements[0][0] < 0) return false;

    // Check that DOP doesn't increase
    // (simplified check - full verification is more complex)
    const maxTransmittance = this.elements[0][0];
    for (let i = 1; i < 4; i++) {
      if (Math.abs(this.elements[0][i]) > maxTransmittance) return false;
      if (Math.abs(this.elements[i][0]) > maxTransmittance) return false;
    }

    return true;
  }

  toString(): string {
    return 'MuellerMatrix[\n' +
      this.elements.map(row => '  [' + row.map(v => v.toFixed(4)).join(', ') + ']').join('\n') +
      '\n]';
  }
}

// ============== Wave Optics Light State ==============

/**
 * Enhanced light representation for wave optics simulation
 * Combines Jones vector with propagation metadata
 */
export interface WaveLight {
  // Core wave optics state
  jones: JonesVector;

  // Propagation direction
  direction: 'north' | 'south' | 'east' | 'west' | 'up' | 'down';

  // Global phase for interference (accumulated phase from path length)
  globalPhase: number;

  // Source ID for coherence tracking (lights from same source can interfere)
  sourceId: string;

  // Path length traveled (in blocks)
  pathLength: number;
}

/**
 * Create a WaveLight from basic parameters
 */
export function createWaveLight(
  direction: WaveLight['direction'],
  polarizationAngleDegrees: number,
  amplitude: number = 1,
  sourceId: string = 'default'
): WaveLight {
  return {
    jones: JonesVector.linearPolarizationDegrees(polarizationAngleDegrees, amplitude),
    direction,
    globalPhase: 0,
    sourceId,
    pathLength: 0
  };
}

/**
 * Coherent superposition of multiple wave lights at same position
 * Only lights from the same source with same direction can interfere
 */
export function superposeLights(lights: WaveLight[]): WaveLight[] {
  if (lights.length === 0) return [];
  if (lights.length === 1) return lights;

  // Group by (sourceId, direction) for coherent superposition
  const groups = new Map<string, WaveLight[]>();

  for (const light of lights) {
    const key = `${light.sourceId}_${light.direction}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(light);
  }

  const result: WaveLight[] = [];

  for (const [, groupLights] of groups) {
    if (groupLights.length === 1) {
      result.push(groupLights[0]);
      continue;
    }

    // Coherent superposition: add Jones vectors with phase
    let superposedJones = new JonesVector(Complex.ZERO, Complex.ZERO);
    let totalPathLength = 0;

    for (const light of groupLights) {
      // Apply global phase before superposition
      const phaseShift = Complex.fromPolar(1, light.globalPhase);
      const phasedJones = light.jones.scaleComplex(phaseShift);
      superposedJones = superposedJones.add(phasedJones);
      totalPathLength += light.pathLength;
    }

    // Only include if intensity is above threshold
    if (superposedJones.intensity > 0.01) {
      result.push({
        jones: superposedJones,
        direction: groupLights[0].direction,
        globalPhase: 0, // Phase is now encoded in the Jones vector
        sourceId: groupLights[0].sourceId,
        pathLength: totalPathLength / groupLights.length
      });
    }
  }

  return result;
}

// ============== Conversion Functions ==============

import type { LightPacket, PolarizationAngle, Phase } from '@/lib/types';

/**
 * Convert legacy LightPacket to WaveLight
 */
export function lightPacketToWaveLight(packet: LightPacket, sourceId: string = 'legacy'): WaveLight {
  // Convert intensity 0-15 to amplitude 0-1
  const amplitude = Math.sqrt(packet.intensity / 15);

  // Convert discrete phase to global phase
  const globalPhase = packet.phase === -1 ? Math.PI : 0;

  return {
    jones: JonesVector.linearPolarizationDegrees(packet.polarization, amplitude),
    direction: packet.direction,
    globalPhase,
    sourceId,
    pathLength: 0
  };
}

/**
 * Convert WaveLight to legacy LightPacket for backward compatibility
 */
export function waveLightToLightPacket(light: WaveLight): LightPacket {
  return {
    direction: light.direction,
    intensity: Math.min(15, light.jones.getIntensityScaled()),
    polarization: light.jones.getDiscretePolarization() as PolarizationAngle,
    phase: light.jones.getDiscretePhase() as Phase
  };
}

/**
 * Convert multiple WaveLights to LightPackets
 */
export function waveLightsToLightPackets(lights: WaveLight[]): LightPacket[] {
  return lights
    .filter(l => l.jones.intensity > 0.01)
    .map(waveLightToLightPacket);
}
