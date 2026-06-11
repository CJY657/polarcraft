/**
 * Fresnel Equations Physics Module
 *
 * Amplitude and intensity coefficients for reflection/refraction at a
 * dielectric interface, for s- (perpendicular) and p- (parallel) polarization.
 *
 * Conventions:
 * - Angles in degrees at the public API, internally radians.
 * - n1: refractive index of the incident medium, n2: of the transmitting medium.
 * - Beyond the critical angle (n1 > n2), total internal reflection occurs:
 *   Rs = Rp = 1 and Ts = Tp = 0.
 */

export interface FresnelResult {
  /** Amplitude reflection coefficient, s-polarization (can be negative = phase flip) */
  rs: number;
  /** Amplitude reflection coefficient, p-polarization */
  rp: number;
  /** Intensity reflectance, s-polarization (0..1) */
  Rs: number;
  /** Intensity reflectance, p-polarization (0..1) */
  Rp: number;
  /** Intensity transmittance, s-polarization (0..1) */
  Ts: number;
  /** Intensity transmittance, p-polarization (0..1) */
  Tp: number;
  /** Refraction angle in degrees (NaN under total internal reflection) */
  refractionAngleDeg: number;
  /** Whether total internal reflection occurs */
  totalInternalReflection: boolean;
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * Compute the full set of Fresnel coefficients for a dielectric interface.
 *
 * @param n1 - Refractive index of the incident medium (> 0)
 * @param n2 - Refractive index of the transmitting medium (> 0)
 * @param incidentAngleDeg - Angle of incidence from the normal, in degrees [0, 90)
 */
export function fresnelCoefficients(
  n1: number,
  n2: number,
  incidentAngleDeg: number,
): FresnelResult {
  const thetaI = Math.min(89.999, Math.max(0, incidentAngleDeg)) * DEG2RAD;
  const cosI = Math.cos(thetaI);
  const sinI = Math.sin(thetaI);

  const sinT = (n1 / n2) * sinI;

  if (sinT > 1) {
    // Total internal reflection: all energy reflected for both polarizations
    return {
      rs: 1,
      rp: 1,
      Rs: 1,
      Rp: 1,
      Ts: 0,
      Tp: 0,
      refractionAngleDeg: NaN,
      totalInternalReflection: true,
    };
  }

  const cosT = Math.sqrt(1 - sinT * sinT);

  // Amplitude coefficients (Hecht, Optics, 4th ed., eqs. 4.34-4.37)
  const rs = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT);
  const rp = (n2 * cosI - n1 * cosT) / (n2 * cosI + n1 * cosT);
  const ts = (2 * n1 * cosI) / (n1 * cosI + n2 * cosT);
  const tp = (2 * n1 * cosI) / (n2 * cosI + n1 * cosT);

  const Rs = rs * rs;
  const Rp = rp * rp;

  // Transmittance includes the beam-area / impedance factor
  const beamFactor = (n2 * cosT) / (n1 * cosI);
  const Ts = beamFactor * ts * ts;
  const Tp = beamFactor * tp * tp;

  return {
    rs,
    rp,
    Rs,
    Rp,
    Ts,
    Tp,
    refractionAngleDeg: Math.asin(sinT) * RAD2DEG,
    totalInternalReflection: false,
  };
}

/**
 * Reflectance of unpolarized light: average of the two polarizations.
 */
export function unpolarizedReflectance(result: FresnelResult): number {
  return (result.Rs + result.Rp) / 2;
}

/**
 * Degree of polarization of the reflected beam for unpolarized incident light.
 * 0 = unpolarized, 1 = fully polarized (at Brewster's angle).
 */
export function reflectedDegreeOfPolarization(result: FresnelResult): number {
  const total = result.Rs + result.Rp;
  if (total <= 0) return 0;
  return Math.abs(result.Rs - result.Rp) / total;
}

/**
 * Brewster's angle in degrees: tan(θ_B) = n2 / n1.
 */
export function brewsterAngleDeg(n1: number, n2: number): number {
  return Math.atan2(n2, n1) * RAD2DEG;
}

/**
 * Critical angle for total internal reflection in degrees,
 * or null when n1 <= n2 (no TIR possible).
 */
export function criticalAngleDeg(n1: number, n2: number): number | null {
  if (n1 <= n2) return null;
  return Math.asin(n2 / n1) * RAD2DEG;
}

/**
 * Sample Rs/Rp across [0°, 90°) for plotting reflectance curves.
 */
export function sampleReflectanceCurve(
  n1: number,
  n2: number,
  samples: number = 91,
): Array<{ angleDeg: number; Rs: number; Rp: number }> {
  const points: Array<{ angleDeg: number; Rs: number; Rp: number }> = [];
  for (let i = 0; i < samples; i++) {
    const angleDeg = (i / (samples - 1)) * 89.9;
    const { Rs, Rp } = fresnelCoefficients(n1, n2, angleDeg);
    points.push({ angleDeg, Rs, Rp });
  }
  return points;
}
