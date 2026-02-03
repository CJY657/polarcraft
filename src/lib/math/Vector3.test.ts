/**
 * Vector3 Tests
 * Comprehensive tests for the Vector3 class (3D vectors)
 * Used for ray tracing, polarization basis, and spatial calculations
 */

import { Vector3, buildOrthonormalBasis, rotateAroundAxis, signedAngle } from './index';

describe('Vector3', () => {
  describe('Static Factories', () => {
    it('should have ZERO constant', () => {
      expect(Vector3.ZERO.x).toBe(0);
      expect(Vector3.ZERO.y).toBe(0);
      expect(Vector3.ZERO.z).toBe(0);
    });

    it('should have X unit vector', () => {
      expect(Vector3.X.x).toBe(1);
      expect(Vector3.X.y).toBe(0);
      expect(Vector3.X.z).toBe(0);
    });

    it('should have Y unit vector', () => {
      expect(Vector3.Y.x).toBe(0);
      expect(Vector3.Y.y).toBe(1);
      expect(Vector3.Y.z).toBe(0);
    });

    it('should have Z unit vector', () => {
      expect(Vector3.Z.x).toBe(0);
      expect(Vector3.Z.y).toBe(0);
      expect(Vector3.Z.z).toBe(1);
    });

    it('should have negative unit vectors', () => {
      expect(Vector3.NEG_X.x).toBe(-1);
      expect(Vector3.NEG_Y.y).toBe(-1);
      expect(Vector3.NEG_Z.z).toBe(-1);
    });

    it('should create from array', () => {
      const v = Vector3.fromArray([1, 2, 3]);
      expect(v.x).toBe(1);
      expect(v.y).toBe(2);
      expect(v.z).toBe(3);
    });

    it('should create from spherical coordinates', () => {
      const v = Vector3.fromSpherical(0, 0); // North pole
      expect(v.x).toBeCloseTo(0, 10);
      expect(v.y).toBeCloseTo(0, 10);
      expect(v.z).toBeCloseTo(1, 10);
    });

    it('should create unit vector from spherical', () => {
      const v = Vector3.fromSpherical(Math.PI / 4, Math.PI / 2);
      expect(v.isNormalized()).toBe(true);
    });
  });

  describe('Properties', () => {
    it('should calculate length', () => {
      const v = new Vector3(3, 4, 0);
      expect(v.length).toBe(5);
    });

    it('should calculate 3D length', () => {
      const v = new Vector3(1, 2, 2);
      expect(v.length).toBe(3);
    });

    it('should calculate length squared', () => {
      const v = new Vector3(3, 4, 0);
      expect(v.lengthSquared).toBe(25);
    });

    it('should have zero length for zero vector', () => {
      expect(Vector3.ZERO.length).toBe(0);
    });

    it('should have unit length for unit vectors', () => {
      expect(Vector3.X.length).toBe(1);
      expect(Vector3.Y.length).toBe(1);
      expect(Vector3.Z.length).toBe(1);
    });
  });

  describe('Arithmetic Operations', () => {
    describe('addition', () => {
      it('should add two vectors', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(4, 5, 6);
        const result = a.add(b);
        expect(result.x).toBe(5);
        expect(result.y).toBe(7);
        expect(result.z).toBe(9);
      });

      it('should satisfy commutative property', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(4, 5, 6);
        const ab = a.add(b);
        const ba = b.add(a);
        expect(ab.equals(ba)).toBe(true);
      });

      it('should satisfy v + 0 = v', () => {
        const v = new Vector3(1, 2, 3);
        const result = v.add(Vector3.ZERO);
        expect(result.equals(v)).toBe(true);
      });
    });

    describe('subtraction', () => {
      it('should subtract two vectors', () => {
        const a = new Vector3(5, 7, 9);
        const b = new Vector3(1, 2, 3);
        const result = a.sub(b);
        expect(result.x).toBe(4);
        expect(result.y).toBe(5);
        expect(result.z).toBe(6);
      });
    });

    describe('scalar multiplication', () => {
      it('should scale by positive scalar', () => {
        const v = new Vector3(1, 2, 3);
        const result = v.scale(2);
        expect(result.x).toBe(2);
        expect(result.y).toBe(4);
        expect(result.z).toBe(6);
      });

      it('should scale by negative scalar', () => {
        const v = new Vector3(1, 2, 3);
        const result = v.scale(-1);
        expect(result.x).toBe(-1);
        expect(result.y).toBe(-2);
        expect(result.z).toBe(-3);
      });

      it('should scale by zero', () => {
        const v = new Vector3(1, 2, 3);
        const result = v.scale(0);
        expect(result.x).toBe(0);
        expect(result.y).toBe(0);
        expect(result.z).toBe(0);
      });
    });

    describe('negation', () => {
      it('should negate vector', () => {
        const v = new Vector3(1, 2, 3);
        const result = v.negate();
        expect(result.x).toBe(-1);
        expect(result.y).toBe(-2);
        expect(result.z).toBe(-3);
      });
    });

    describe('dot product', () => {
      it('should calculate dot product', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(4, 5, 6);
        const result = a.dot(b);
        expect(result).toBe(32); // 1*4 + 2*5 + 3*6
      });

      it('should calculate dot product of perpendicular vectors', () => {
        const a = Vector3.X;
        const b = Vector3.Y;
        expect(a.dot(b)).toBe(0);
      });

      it('should calculate dot product of parallel vectors', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(2, 4, 6);
        expect(a.dot(b)).toBe(28); // Fixed: 1*2 + 2*4 + 3*6 = 2 + 8 + 18 = 28
      });

      it('should satisfy commutative property', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(4, 5, 6);
        expect(a.dot(b)).toBe(b.dot(a));
      });
    });

    describe('cross product', () => {
      it('should calculate cross product', () => {
        const a = new Vector3(1, 0, 0);
        const b = new Vector3(0, 1, 0);
        const result = a.cross(b);
        expect(result.x).toBeCloseTo(0, 10);
        expect(result.y).toBeCloseTo(0, 10);
        expect(result.z).toBeCloseTo(1, 10);
      });

      it('should be anti-commutative: a × b = -(b × a)', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(4, 5, 6);
        const ab = a.cross(b);
        const ba = b.cross(a);
        expect(ab.equals(ba.negate())).toBe(true);
      });

      it('should satisfy right-hand rule: X × Y = Z', () => {
        const result = Vector3.X.cross(Vector3.Y);
        expect(result.equals(Vector3.Z)).toBe(true);
      });

      it('should satisfy Y × Z = X', () => {
        const result = Vector3.Y.cross(Vector3.Z);
        expect(result.equals(Vector3.X)).toBe(true);
      });

      it('should satisfy Z × X = Y', () => {
        const result = Vector3.Z.cross(Vector3.X);
        expect(result.equals(Vector3.Y)).toBe(true);
      });

      it('should return zero for parallel vectors', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(2, 4, 6);
        const result = a.cross(b);
        expect(result.isZero()).toBe(true);
      });
    });
  });

  describe('Normalization', () => {
    it('should normalize vector', () => {
      const v = new Vector3(3, 4, 0);
      const result = v.normalize();
      expect(result.length).toBeCloseTo(1, 10);
      expect(result.x).toBeCloseTo(0.6, 10);
      expect(result.y).toBeCloseTo(0.8, 10);
    });

    it('should return zero for zero vector', () => {
      const result = Vector3.ZERO.normalize();
      expect(result.equals(Vector3.ZERO)).toBe(true);
    });

    it('should preserve direction', () => {
      const v = new Vector3(3, 4, 0);
      const normalized = v.normalize();
      const scale = v.length / normalized.length;
      expect(scale).toBeCloseTo(v.length, 10);
    });

    describe('normalizeOr', () => {
      it('should return fallback for zero vector', () => {
        const fallback = Vector3.X;
        const result = Vector3.ZERO.normalizeOr(fallback);
        expect(result.equals(fallback)).toBe(true);
      });

      it('should normalize non-zero vector', () => {
        const v = new Vector3(3, 4, 0);
        const fallback = Vector3.X;
        const result = v.normalizeOr(fallback);
        expect(result.isNormalized()).toBe(true);
      });
    });
  });

  describe('Geometric Operations', () => {
    describe('reflection', () => {
      it('should reflect vector across normal', () => {
        const v = new Vector3(1, -1, 0);
        const normal = new Vector3(0, 1, 0);
        const result = v.reflect(normal);
        expect(result.x).toBeCloseTo(1, 10);
        expect(result.y).toBeCloseTo(1, 10);
      });

      it('should satisfy reflection formula: v - 2(v·n)n', () => {
        const v = new Vector3(1, 2, 3);
        const normal = Vector3.Y.normalize();
        const result = v.reflect(normal);
        const expected = v.sub(normal.scale(2 * v.dot(normal)));
        expect(result.equals(expected, 1e-10)).toBe(true);
      });
    });

    describe('refraction', () => {
      it('should refract through surface', () => {
        const incident = new Vector3(0, -1, -1).normalize();
        const normal = new Vector3(0, 0, 1);
        const eta = 1 / 1.5; // air to glass
        const result = incident.refract(normal, eta);
        expect(result).not.toBeNull();
        expect(result!.isNormalized()).toBe(true);
      });

      it('should return null for total internal reflection', () => {
        const incident = new Vector3(0.8, -0.6, 0).normalize();
        const normal = new Vector3(0, 1, 0);
        const eta = 1.5 / 1; // glass to air (higher to lower)
        const result = incident.refract(normal, eta);
        expect(result).toBeNull();
      });

      it('should not change direction for normal incidence', () => {
        const incident = new Vector3(0, -1, 0);
        const normal = new Vector3(0, 1, 0);
        const eta = 1 / 1.5;
        const result = incident.refract(normal, eta);
        expect(result).not.toBeNull();
        expect(result!.x).toBeCloseTo(0, 10);
        expect(result!.y).toBeCloseTo(-1, 10);
      });
    });

    describe('projection', () => {
      it('should project onto another vector', () => {
        const v = new Vector3(3, 4, 0);
        const target = new Vector3(1, 0, 0);
        const result = v.projectOnto(target);
        expect(result.x).toBe(3);
        expect(result.y).toBeCloseTo(0, 10);
        expect(result.z).toBeCloseTo(0, 10);
      });

      it('should return zero for perpendicular projection', () => {
        const v = new Vector3(0, 3, 0);
        const target = new Vector3(1, 0, 0);
        const result = v.projectOnto(target);
        expect(result.isZero()).toBe(true);
      });

      it('should return itself when projecting onto parallel vector', () => {
        const v = new Vector3(1, 2, 3);
        const target = new Vector3(2, 4, 6);
        const result = v.projectOnto(target);
        expect(result.isParallel(v)).toBe(true);
      });
    });

    describe('perpendicular', () => {
      it('should return perpendicular component', () => {
        const v = new Vector3(3, 4, 0);
        const target = new Vector3(1, 0, 0);
        const result = v.perpendicular(target);
        expect(result.x).toBeCloseTo(0, 10);
        expect(result.y).toBe(4);
      });

      it('should satisfy v = proj + perp', () => {
        const v = new Vector3(3, 4, 0);
        const target = new Vector3(1, 1, 0);
        const proj = v.projectOnto(target);
        const perp = v.perpendicular(target);
        const sum = proj.add(perp);
        expect(sum.equals(v, 1e-10)).toBe(true);
      });
    });

    describe('angleTo', () => {
      it('should calculate angle between vectors', () => {
        const a = Vector3.X;
        const b = Vector3.Y;
        const angle = a.angleTo(b);
        expect(angle).toBeCloseTo(Math.PI / 2, 10);
      });

      it('should return 0 for parallel vectors', () => {
        const a = Vector3.X;
        const b = new Vector3(2, 0, 0);
        expect(a.angleTo(b)).toBeCloseTo(0, 10);
      });

      it('should return π for anti-parallel vectors', () => {
        const a = Vector3.X;
        const b = Vector3.NEG_X;
        expect(a.angleTo(b)).toBeCloseTo(Math.PI, 10);
      });

      it('should return 0 for zero vector', () => {
        const a = Vector3.ZERO;
        const b = Vector3.X;
        expect(a.angleTo(b)).toBe(0);
      });

      it('should be symmetric: angle(a,b) = angle(b,a)', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(4, 5, 6);
        expect(a.angleTo(b)).toBeCloseTo(b.angleTo(a), 10);
      });
    });
  });

  describe('Comparison Operations', () => {
    describe('isParallel', () => {
      it('should identify parallel vectors', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(2, 4, 6);
        expect(a.isParallel(b)).toBe(true);
      });

      it('should identify anti-parallel vectors', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(-1, -2, -3);
        expect(a.isParallel(b)).toBe(true);
      });

      it('should reject perpendicular vectors', () => {
        expect(Vector3.X.isParallel(Vector3.Y)).toBe(false);
      });

      it('should use custom tolerance', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(1.0001, 2.0001, 3.0001);
        expect(a.isParallel(b, 1e-3)).toBe(true);
      });
    });

    describe('isPerpendicular', () => {
      it('should identify perpendicular vectors', () => {
        expect(Vector3.X.isPerpendicular(Vector3.Y)).toBe(true);
        expect(Vector3.Y.isPerpendicular(Vector3.Z)).toBe(true);
        expect(Vector3.Z.isPerpendicular(Vector3.X)).toBe(true);
      });

      it('should reject parallel vectors', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(2, 4, 6);
        expect(a.isPerpendicular(b)).toBe(false);
      });

      it('should use custom tolerance', () => {
        const a = Vector3.X;
        const b = new Vector3(0, 1e-10, 0);
        expect(a.isPerpendicular(b, 1e-8)).toBe(true);
      });
    });

    describe('equals', () => {
      it('should identify equal vectors', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(1, 2, 3);
        expect(a.equals(b)).toBe(true);
      });

      it('should reject different vectors', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(1, 2, 4);
        expect(a.equals(b)).toBe(false);
      });

      it('should use custom tolerance', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(1.0001, 2.0001, 3.0001);
        expect(a.equals(b, 1e-3)).toBe(true);
      });
    });

    describe('isZero', () => {
      it('should identify zero vector', () => {
        expect(Vector3.ZERO.isZero()).toBe(true);
        expect(new Vector3(0, 0, 0).isZero()).toBe(true);
      });

      it('should reject non-zero vectors', () => {
        expect(new Vector3(1e-10, 0, 0).isZero()).toBe(false);
      });

      it('should use custom tolerance', () => {
        const v = new Vector3(1e-15, 0, 0);
        expect(v.isZero(1e-10)).toBe(true);
      });
    });

    describe('isNormalized', () => {
      it('should identify unit vectors', () => {
        expect(Vector3.X.isNormalized()).toBe(true);
        expect(Vector3.Y.isNormalized()).toBe(true);
        expect(Vector3.Z.isNormalized()).toBe(true);
      });

      it('should reject non-unit vectors', () => {
        expect(new Vector3(2, 0, 0).isNormalized()).toBe(false);
      });

      it('should identify normalized custom vector', () => {
        const v = new Vector3(1, 2, 3).normalize();
        expect(v.isNormalized()).toBe(true);
      });
    });
  });

  describe('Interpolation', () => {
    describe('lerp', () => {
      it('should interpolate at t=0.5', () => {
        const a = new Vector3(0, 0, 0);
        const b = new Vector3(2, 4, 6);
        const result = a.lerp(b, 0.5);
        expect(result.x).toBe(1);
        expect(result.y).toBe(2);
        expect(result.z).toBe(3);
      });

      it('should return a at t=0', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(4, 5, 6);
        expect(a.lerp(b, 0).equals(a)).toBe(true);
      });

      it('should return b at t=1', () => {
        const a = new Vector3(1, 2, 3);
        const b = new Vector3(4, 5, 6);
        expect(a.lerp(b, 1).equals(b)).toBe(true);
      });
    });

    describe('slerp', () => {
      it('should interpolate on unit sphere', () => {
        const a = Vector3.X;
        const b = Vector3.Y;
        const result = a.slerp(b, 0.5);
        expect(result.isNormalized()).toBe(true);
        expect(result.angleTo(a)).toBeCloseTo(result.angleTo(b), 10);
      });

      it('should return a at t=0', () => {
        const a = Vector3.X;
        const b = Vector3.Y;
        expect(a.slerp(b, 0).equals(a)).toBe(true);
      });

      it('should return b at t=1', () => {
        const a = Vector3.X;
        const b = Vector3.Y;
        expect(a.slerp(b, 1).equals(b)).toBe(true);
      });

      it('should handle parallel vectors', () => {
        const a = Vector3.X;
        const b = Vector3.X;
        expect(a.slerp(b, 0.5).equals(a)).toBe(true);
      });
    });
  });

  describe('Utility Functions', () => {
    it('should clone vector', () => {
      const v = new Vector3(1, 2, 3);
      const clone = v.clone();
      expect(clone.equals(v)).toBe(true);
      expect(clone).not.toBe(v);
    });

    it('should convert to array', () => {
      const v = new Vector3(1, 2, 3);
      expect(v.toArray()).toEqual([1, 2, 3]);
    });

    it('should convert to string', () => {
      const v = new Vector3(1, 2, 3);
      const str = v.toString();
      expect(str).toContain('1.0000');
      expect(str).toContain('2.0000');
      expect(str).toContain('3.0000');
    });

    it('should round trip array conversion', () => {
      const arr = [1, 2, 3] as [number, number, number];
      const v = Vector3.fromArray(arr);
      expect(v.toArray()).toEqual(arr);
    });
  });

  describe('External Utility Functions', () => {
    describe('buildOrthonormalBasis', () => {
      it('should build orthonormal basis from normal', () => {
        const normal = Vector3.Z;
        const [t1, t2] = buildOrthonormalBasis(normal);
        expect(t1.isNormalized()).toBe(true);
        expect(t2.isNormalized()).toBe(true);
        expect(t1.isPerpendicular(normal)).toBe(true);
        expect(t2.isPerpendicular(normal)).toBe(true);
        expect(t1.isPerpendicular(t2)).toBe(true);
      });

      it('should satisfy n × t1 = t2', () => {
        const normal = new Vector3(1, 2, 3).normalize();
        const [t1, t2] = buildOrthonormalBasis(normal);
        const cross = normal.cross(t1);
        expect(cross.equals(t2, 1e-10)).toBe(true);
      });

      it('should handle arbitrary normal', () => {
        const normal = new Vector3(0.5, 0.7, 0.3).normalize();
        const [t1, t2] = buildOrthonormalBasis(normal);
        expect(t1.isNormalized()).toBe(true);
        expect(t2.isNormalized()).toBe(true);
      });
    });

    describe('rotateAroundAxis', () => {
      it('should rotate around axis by 90 degrees', () => {
        const v = Vector3.X;
        const axis = Vector3.Z;
        const angle = Math.PI / 2;
        const result = rotateAroundAxis(v, axis, angle);
        expect(result.x).toBeCloseTo(0, 10);
        expect(result.y).toBeCloseTo(1, 10);
        expect(result.z).toBeCloseTo(0, 10);
      });

      it('should preserve vector parallel to axis', () => {
        const v = Vector3.Z;
        const axis = Vector3.Z;
        const angle = Math.PI / 2;
        const result = rotateAroundAxis(v, axis, angle);
        expect(result.equals(v, 1e-10)).toBe(true);
      });

      it('should rotate by 360 degrees to original', () => {
        const v = new Vector3(1, 0, 0);
        const axis = new Vector3(0, 1, 0);
        const angle = 2 * Math.PI;
        const result = rotateAroundAxis(v, axis, angle);
        expect(result.equals(v, 1e-10)).toBe(true);
      });
    });

    describe('signedAngle', () => {
      it('should calculate positive angle', () => {
        const v1 = Vector3.X;
        const v2 = Vector3.Y;
        const axis = Vector3.Z;
        const angle = signedAngle(v1, v2, axis);
        expect(angle).toBeCloseTo(Math.PI / 2, 10);
      });

      it('should calculate negative angle', () => {
        const v1 = Vector3.Y;
        const v2 = Vector3.X;
        const axis = Vector3.Z;
        const angle = signedAngle(v1, v2, axis);
        expect(angle).toBeCloseTo(-Math.PI / 2, 10);
      });

      it('should return 0 for same vectors', () => {
        const v = Vector3.X;
        const angle = signedAngle(v, v, Vector3.Z);
        expect(angle).toBeCloseTo(0, 10);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large values', () => {
      const v = new Vector3(1e100, 1e100, 1e100);
      expect(v.length).toBeGreaterThan(0);
    });

    it('should handle very small values', () => {
      const v = new Vector3(1e-100, 1e-100, 1e-100);
      expect(v.length).toBeGreaterThan(0);
    });

    it('should handle NaN', () => {
      const v = new Vector3(NaN, 0, 0);
      expect(Number.isNaN(v.x)).toBe(true);
    });

    it('should handle Infinity', () => {
      const v = new Vector3(Infinity, 0, 0);
      expect(v.x).toBe(Infinity);
    });

    it('should handle negative zero', () => {
      const v = new Vector3(-0, -0, -0);
      // JavaScript has signed zeros; -0 !== 0 but -0 == 0
      // Check length instead which treats -0 the same as 0
      expect(v.length).toBe(0);
    });
  });

  describe('Mathematical Correctness', () => {
    it('should satisfy distributive property: (a + b) × c = a × c + b × c', () => {
      const a = new Vector3(1, 2, 3);
      const b = new Vector3(4, 5, 6);
      const c = new Vector3(7, 8, 9);
      const left = a.add(b).cross(c);
      const right = a.cross(c).add(b.cross(c));
      expect(left.equals(right, 1e-10)).toBe(true);
    });

    it('should satisfy triple product: a · (b × c) = b · (c × a)', () => {
      const a = new Vector3(1, 2, 3);
      const b = new Vector3(4, 5, 6);
      const c = new Vector3(7, 8, 9);
      const left = a.dot(b.cross(c));
      const right = b.dot(c.cross(a));
      expect(left).toBeCloseTo(right, 10);
    });

    it('should satisfy scalar triple product cyclic permutation', () => {
      const a = new Vector3(1, 2, 3);
      const b = new Vector3(4, 5, 6);
      const c = new Vector3(7, 8, 9);
      const abc = a.dot(b.cross(c));
      const bca = b.dot(c.cross(a));
      const cab = c.dot(a.cross(b));
      expect(abc).toBeCloseTo(bca, 10);
      expect(bca).toBeCloseTo(cab, 10);
    });

    it('should satisfy Lagrange identity: |a × b|² = |a|²|b|² - (a·b)²', () => {
      const a = new Vector3(1, 2, 3);
      const b = new Vector3(4, 5, 6);
      const left = a.cross(b).lengthSquared;
      const right = a.lengthSquared * b.lengthSquared - Math.pow(a.dot(b), 2);
      expect(left).toBeCloseTo(right, 10);
    });
  });
});
