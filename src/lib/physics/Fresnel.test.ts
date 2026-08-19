/**
 * Fresnel Equations Tests
 * Physical correctness checks:
 * - Normal incidence matches ((n1-n2)/(n1+n2))^2
 * - p-reflectance vanishes at Brewster's angle
 * - Energy conservation R + T = 1 for both polarizations
 * - Total internal reflection beyond the critical angle
 * - Grazing incidence approaches full reflection
 */

import { describe, expect, it } from 'vitest';
import {
  fresnelCoefficients,
  unpolarizedReflectance,
  reflectedDegreeOfPolarization,
  brewsterAngleDeg,
  criticalAngleDeg,
  sampleReflectanceCurve,
} from "./Fresnel";

describe("Fresnel", () => {
  describe("normal incidence", () => {
    it("matches the classic ((n1-n2)/(n1+n2))^2 formula for air-glass", () => {
      const { Rs, Rp } = fresnelCoefficients(1.0, 1.5, 0);
      const expected = Math.pow((1.0 - 1.5) / (1.0 + 1.5), 2); // 0.04
      expect(Rs).toBeCloseTo(expected, 10);
      expect(Rp).toBeCloseTo(expected, 10);
    });

    it("reflects nothing when both media have the same index", () => {
      const { Rs, Rp, Ts, Tp } = fresnelCoefficients(1.33, 1.33, 25);
      expect(Rs).toBeCloseTo(0, 10);
      expect(Rp).toBeCloseTo(0, 10);
      expect(Ts).toBeCloseTo(1, 10);
      expect(Tp).toBeCloseTo(1, 10);
    });
  });

  describe("Brewster's angle", () => {
    it("computes tan(θB) = n2/n1 for air-glass", () => {
      expect(brewsterAngleDeg(1.0, 1.5)).toBeCloseTo(56.31, 2);
    });

    it("has vanishing p-reflectance at Brewster's angle", () => {
      const thetaB = brewsterAngleDeg(1.0, 1.5);
      const { Rp, Rs } = fresnelCoefficients(1.0, 1.5, thetaB);
      expect(Rp).toBeCloseTo(0, 8);
      expect(Rs).toBeGreaterThan(0.1);
    });

    it("reflected light is fully polarized at Brewster's angle", () => {
      const thetaB = brewsterAngleDeg(1.0, 2.42); // diamond
      const result = fresnelCoefficients(1.0, 2.42, thetaB);
      expect(reflectedDegreeOfPolarization(result)).toBeCloseTo(1, 8);
    });

    it("reflected + refracted rays are perpendicular at Brewster's angle", () => {
      const thetaB = brewsterAngleDeg(1.0, 1.33);
      const { refractionAngleDeg } = fresnelCoefficients(1.0, 1.33, thetaB);
      expect(thetaB + refractionAngleDeg).toBeCloseTo(90, 6);
    });
  });

  describe("energy conservation", () => {
    it("satisfies R + T = 1 for both polarizations across angles", () => {
      for (const angle of [0, 10, 30, 45, 56.31, 70, 85]) {
        const { Rs, Rp, Ts, Tp } = fresnelCoefficients(1.0, 1.5, angle);
        expect(Rs + Ts).toBeCloseTo(1, 8);
        expect(Rp + Tp).toBeCloseTo(1, 8);
      }
    });

    it("holds for dense-to-rare incidence below the critical angle", () => {
      for (const angle of [0, 15, 30, 40]) {
        const { Rs, Rp, Ts, Tp } = fresnelCoefficients(1.5, 1.0, angle);
        expect(Rs + Ts).toBeCloseTo(1, 8);
        expect(Rp + Tp).toBeCloseTo(1, 8);
      }
    });
  });

  describe("total internal reflection", () => {
    it("computes the glass-air critical angle", () => {
      expect(criticalAngleDeg(1.5, 1.0)).toBeCloseTo(41.81, 2);
    });

    it("returns null when no TIR is possible", () => {
      expect(criticalAngleDeg(1.0, 1.5)).toBeNull();
    });

    it("fully reflects beyond the critical angle", () => {
      const result = fresnelCoefficients(1.5, 1.0, 60);
      expect(result.totalInternalReflection).toBe(true);
      expect(result.Rs).toBe(1);
      expect(result.Rp).toBe(1);
      expect(result.Ts).toBe(0);
      expect(result.Tp).toBe(0);
      expect(Number.isNaN(result.refractionAngleDeg)).toBe(true);
    });
  });

  describe("limits and monotonic behavior", () => {
    it("approaches full reflection at grazing incidence", () => {
      const { Rs, Rp } = fresnelCoefficients(1.0, 1.5, 89.9);
      expect(Rs).toBeGreaterThan(0.95);
      expect(Rp).toBeGreaterThan(0.9);
    });

    it("unpolarized reflectance is the average of Rs and Rp", () => {
      const result = fresnelCoefficients(1.0, 1.5, 45);
      expect(unpolarizedReflectance(result)).toBeCloseTo((result.Rs + result.Rp) / 2, 12);
    });

    it("Rs grows monotonically with angle for air-glass", () => {
      let prev = -1;
      for (let a = 0; a <= 89; a += 1) {
        const { Rs } = fresnelCoefficients(1.0, 1.5, a);
        expect(Rs).toBeGreaterThanOrEqual(prev);
        prev = Rs;
      }
    });
  });

  describe("sampleReflectanceCurve", () => {
    it("produces the requested number of in-range samples", () => {
      const curve = sampleReflectanceCurve(1.0, 1.5, 50);
      expect(curve).toHaveLength(50);
      for (const point of curve) {
        expect(point.Rs).toBeGreaterThanOrEqual(0);
        expect(point.Rs).toBeLessThanOrEqual(1);
        expect(point.Rp).toBeGreaterThanOrEqual(0);
        expect(point.Rp).toBeLessThanOrEqual(1);
      }
    });

    it("has its p-minimum near Brewster's angle", () => {
      const curve = sampleReflectanceCurve(1.0, 1.5, 901);
      const minPoint = curve.reduce((min, p) => (p.Rp < min.Rp ? p : min), curve[0]);
      expect(minPoint.angleDeg).toBeCloseTo(brewsterAngleDeg(1.0, 1.5), 1);
    });
  });
});
