/**
 * Matrix2x2 Tests
 * Comprehensive tests for the Matrix2x2 class (2x2 complex matrices)
 * Used for Jones calculus and coherency matrices in polarization optics
 */

import { Matrix2x2, Complex, jonesLinearPolarizer, jonesWavePlate, jonesRotator } from './index';

describe('Matrix2x2', () => {
  describe('Static Factories', () => {
    it('should create zero matrix', () => {
      const m = Matrix2x2.ZERO;
      expect(m.a00.isZero()).toBe(true);
      expect(m.a01.isZero()).toBe(true);
      expect(m.a10.isZero()).toBe(true);
      expect(m.a11.isZero()).toBe(true);
    });

    it('should create identity matrix', () => {
      const m = Matrix2x2.IDENTITY;
      expect(m.a00.real).toBe(1);
      expect(m.a01.isZero()).toBe(true);
      expect(m.a10.isZero()).toBe(true);
      expect(m.a11.real).toBe(1);
    });

    it('should create from real numbers', () => {
      const m = Matrix2x2.fromReal(1, 2, 3, 4);
      expect(m.a00.real).toBe(1);
      expect(m.a01.real).toBe(2);
      expect(m.a10.real).toBe(3);
      expect(m.a11.real).toBe(4);
    });

    it('should create diagonal matrix', () => {
      const m = Matrix2x2.diagonal(new Complex(1), new Complex(2));
      expect(m.a00.real).toBe(1);
      expect(m.a01.isZero()).toBe(true);
      expect(m.a10.isZero()).toBe(true);
      expect(m.a11.real).toBe(2);
    });

    it('should create scaled identity matrix', () => {
      const m = Matrix2x2.scaledIdentity(new Complex(5));
      expect(m.a00.real).toBe(5);
      expect(m.a01.isZero()).toBe(true);
      expect(m.a10.isZero()).toBe(true);
      expect(m.a11.real).toBe(5);
    });

    it('should create Hermitian matrix', () => {
      const m = Matrix2x2.hermitian(4, new Complex(1, 2), 9);
      expect(m.a00.real).toBe(4);
      expect(m.a00.isReal()).toBe(true);
      expect(m.a01.real).toBe(1);
      expect(m.a01.imag).toBe(2);
      expect(m.a10.real).toBe(1);
      expect(m.a10.imag).toBe(-2); // Conjugate of a01
      expect(m.a11.real).toBe(9);
      expect(m.a11.isReal()).toBe(true);
    });
  });

  describe('Element Access', () => {
    it('should get element by index', () => {
      const m = Matrix2x2.fromReal(1, 2, 3, 4);
      expect(m.get(0, 0).real).toBe(1);
      expect(m.get(0, 1).real).toBe(2);
      expect(m.get(1, 0).real).toBe(3);
      expect(m.get(1, 1).real).toBe(4);
    });

    it('should convert to array', () => {
      const m = Matrix2x2.fromReal(1, 2, 3, 4);
      const arr = m.toArray();
      expect(arr[0][0].real).toBe(1);
      expect(arr[0][1].real).toBe(2);
      expect(arr[1][0].real).toBe(3);
      expect(arr[1][1].real).toBe(4);
    });
  });

  describe('Arithmetic Operations', () => {
    describe('addition', () => {
      it('should add two matrices', () => {
        const a = Matrix2x2.fromReal(1, 2, 3, 4);
        const b = Matrix2x2.fromReal(5, 6, 7, 8);
        const result = a.add(b);
        expect(result.a00.real).toBe(6);
        expect(result.a01.real).toBe(8);
        expect(result.a10.real).toBe(10);
        expect(result.a11.real).toBe(12);
      });

      it('should satisfy A + 0 = A', () => {
        const a = Matrix2x2.fromReal(1, 2, 3, 4);
        const result = a.add(Matrix2x2.ZERO);
        expect(result.a00.real).toBe(1);
        expect(result.a01.real).toBe(2);
        expect(result.a10.real).toBe(3);
        expect(result.a11.real).toBe(4);
      });
    });

    describe('subtraction', () => {
      it('should subtract two matrices', () => {
        const a = Matrix2x2.fromReal(5, 6, 7, 8);
        const b = Matrix2x2.fromReal(1, 2, 3, 4);
        const result = a.sub(b);
        expect(result.a00.real).toBe(4);
        expect(result.a01.real).toBe(4);
        expect(result.a10.real).toBe(4);
        expect(result.a11.real).toBe(4);
      });
    });

    describe('scalar multiplication', () => {
      it('should multiply by scalar', () => {
        const m = Matrix2x2.fromReal(1, 2, 3, 4);
        const result = m.scale(2);
        expect(result.a00.real).toBe(2);
        expect(result.a01.real).toBe(4);
        expect(result.a10.real).toBe(6);
        expect(result.a11.real).toBe(8);
      });

      it('should multiply by negative scalar', () => {
        const m = Matrix2x2.fromReal(1, 2, 3, 4);
        const result = m.scale(-1);
        expect(result.a00.real).toBe(-1);
        expect(result.a01.real).toBe(-2);
        expect(result.a10.real).toBe(-3);
        expect(result.a11.real).toBe(-4);
      });
    });

    describe('complex scalar multiplication', () => {
      it('should multiply by complex scalar', () => {
        const m = Matrix2x2.fromReal(1, 2, 3, 4);
        const scalar = new Complex(2, 0);
        const result = m.scaleComplex(scalar);
        expect(result.a00.real).toBe(2);
        expect(result.a01.real).toBe(4);
        expect(result.a10.real).toBe(6);
        expect(result.a11.real).toBe(8);
      });
    });

    describe('matrix multiplication', () => {
      it('should multiply two matrices', () => {
        const a = Matrix2x2.fromReal(1, 2, 3, 4);
        const b = Matrix2x2.fromReal(5, 6, 7, 8);
        const result = a.mul(b);
        expect(result.a00.real).toBe(19); // 1*5 + 2*7
        expect(result.a01.real).toBe(22); // 1*6 + 2*8
        expect(result.a10.real).toBe(43); // 3*5 + 4*7
        expect(result.a11.real).toBe(50); // 3*6 + 4*8
      });

      it('should satisfy A × I = A', () => {
        const a = Matrix2x2.fromReal(1, 2, 3, 4);
        const result = a.mul(Matrix2x2.IDENTITY);
        expect(result.a00.real).toBe(1);
        expect(result.a01.real).toBe(2);
        expect(result.a10.real).toBe(3);
        expect(result.a11.real).toBe(4);
      });

      it('should satisfy I × A = A', () => {
        const a = Matrix2x2.fromReal(1, 2, 3, 4);
        const result = Matrix2x2.IDENTITY.mul(a);
        expect(result.a00.real).toBe(1);
        expect(result.a01.real).toBe(2);
        expect(result.a10.real).toBe(3);
        expect(result.a11.real).toBe(4);
      });
    });

    describe('vector application', () => {
      it('should apply matrix to column vector', () => {
        const m = Matrix2x2.fromReal(1, 2, 3, 4);
        const [v0, v1] = m.apply(new Complex(1), new Complex(1));
        expect(v0.real).toBe(3); // 1*1 + 2*1
        expect(v1.real).toBe(7); // 3*1 + 4*1
      });
    });
  });

  describe('Matrix Properties', () => {
    describe('trace', () => {
      it('should calculate trace of real matrix', () => {
        const m = Matrix2x2.fromReal(1, 2, 3, 4);
        const trace = m.trace();
        expect(trace.real).toBe(5); // 1 + 4
        expect(trace.isReal()).toBe(true);
      });

      it('should calculate trace of complex matrix', () => {
        const m = new Matrix2x2(
          new Complex(1, 1),
          new Complex(2, 0),
          new Complex(3, 0),
          new Complex(4, 1)
        );
        const trace = m.trace();
        expect(trace.real).toBe(5);
        expect(trace.imag).toBe(2);
      });

      it('should satisfy tr(A + B) = tr(A) + tr(B)', () => {
        const a = Matrix2x2.fromReal(1, 2, 3, 4);
        const b = Matrix2x2.fromReal(5, 6, 7, 8);
        const left = a.add(b).trace();
        const right = a.trace().add(b.trace());
        expect(left.equals(right, 1e-10)).toBe(true);
      });
    });

    describe('determinant', () => {
      it('should calculate determinant of real matrix', () => {
        const m = Matrix2x2.fromReal(1, 2, 3, 4);
        const det = m.determinant();
        expect(det.real).toBe(-2); // 1*4 - 2*3
      });

      it('should calculate determinant of identity', () => {
        const det = Matrix2x2.IDENTITY.determinant();
        expect(det.real).toBe(1);
      });

      it('should calculate determinant of zero matrix', () => {
        const det = Matrix2x2.ZERO.determinant();
        expect(det.isZero()).toBe(true);
      });

      it('should satisfy det(A × B) = det(A) × det(B)', () => {
        const a = Matrix2x2.fromReal(1, 2, 3, 4);
        const b = Matrix2x2.fromReal(5, 6, 7, 8);
        const left = a.mul(b).determinant();
        const right = a.determinant().mul(b.determinant());
        expect(left.equals(right, 1e-10)).toBe(true);
      });
    });

    describe('frobenius norm', () => {
      it('should calculate Frobenius norm', () => {
        const m = Matrix2x2.fromReal(1, 2, 3, 4);
        const norm = m.frobeniusNorm();
        const expected = Math.sqrt(1 + 4 + 9 + 16); // sqrt(30)
        expect(norm).toBeCloseTo(expected, 10);
      });

      it('should calculate norm of identity', () => {
        const norm = Matrix2x2.IDENTITY.frobeniusNorm();
        expect(norm).toBeCloseTo(Math.sqrt(2), 10);
      });

      it('should be non-negative', () => {
        const m = Matrix2x2.fromReal(-1, -2, -3, -4);
        const norm = m.frobeniusNorm();
        expect(norm).toBeGreaterThan(0);
      });
    });
  });

  describe('Matrix Operations', () => {
    describe('transpose', () => {
      it('should transpose matrix', () => {
        const m = Matrix2x2.fromReal(1, 2, 3, 4);
        const result = m.transpose();
        expect(result.a00.real).toBe(1);
        expect(result.a01.real).toBe(3);
        expect(result.a10.real).toBe(2);
        expect(result.a11.real).toBe(4);
      });

      it('should satisfy (A^T)^T = A', () => {
        const m = Matrix2x2.fromReal(1, 2, 3, 4);
        const result = m.transpose().transpose();
        expect(result.a00.real).toBe(1);
        expect(result.a01.real).toBe(2);
        expect(result.a10.real).toBe(3);
        expect(result.a11.real).toBe(4);
      });
    });

    describe('conjugate', () => {
      it('should conjugate matrix', () => {
        const m = new Matrix2x2(
          new Complex(1, 1),
          new Complex(2, 2),
          new Complex(3, 3),
          new Complex(4, 4)
        );
        const result = m.conjugate();
        expect(result.a00.real).toBe(1);
        expect(result.a00.imag).toBe(-1);
        expect(result.a01.real).toBe(2);
        expect(result.a01.imag).toBe(-2);
        expect(result.a10.real).toBe(3);
        expect(result.a10.imag).toBe(-3);
        expect(result.a11.real).toBe(4);
        expect(result.a11.imag).toBe(-4);
      });
    });

    describe('adjoint (conjugate transpose)', () => {
      it('should calculate adjoint', () => {
        const m = new Matrix2x2(
          new Complex(1, 1),
          new Complex(2, 2),
          new Complex(3, 3),
          new Complex(4, 4)
        );
        const result = m.adjoint();
        expect(result.a00.real).toBe(1);
        expect(result.a00.imag).toBe(-1);
        expect(result.a01.real).toBe(3);
        expect(result.a01.imag).toBe(-3);
        expect(result.a10.real).toBe(2);
        expect(result.a10.imag).toBe(-2);
        expect(result.a11.real).toBe(4);
        expect(result.a11.imag).toBe(-4);
      });

      it('should satisfy (A†)† = A', () => {
        const m = Matrix2x2.fromReal(1, 2, 3, 4);
        const result = m.adjoint().adjoint(); // Fixed: was adjjoint
        expect(result.a00.real).toBe(1);
        expect(result.a01.real).toBe(2);
        expect(result.a10.real).toBe(3);
        expect(result.a11.real).toBe(4);
      });
    });

    describe('inverse', () => {
      it('should invert identity matrix', () => {
        const inv = Matrix2x2.IDENTITY.inverse();
        expect(inv).not.toBeNull();
        expect(inv!.a00.real).toBeCloseTo(1, 10);
        expect(inv!.a01.isZero()).toBe(true);
        expect(inv!.a10.isZero()).toBe(true);
        expect(inv!.a11.real).toBeCloseTo(1, 10);
      });

      it('should invert real matrix', () => {
        const m = Matrix2x2.fromReal(1, 2, 3, 4);
        const inv = m.inverse();
        expect(inv).not.toBeNull();
        const product = m.mul(inv!);
        expect(product.a00.real).toBeCloseTo(1, 10);
        expect(product.a01.isZero(1e-10)).toBe(true);
        expect(product.a10.isZero(1e-10)).toBe(true);
        expect(product.a11.real).toBeCloseTo(1, 10);
      });

      it('should return null for singular matrix', () => {
        const m = Matrix2x2.fromReal(1, 2, 2, 4); // det = 0
        const inv = m.inverse();
        expect(inv).toBeNull();
      });

      it('should return null for zero matrix', () => {
        const inv = Matrix2x2.ZERO.inverse();
        expect(inv).toBeNull();
      });

      it('should satisfy A × A^(-1) = I', () => {
        const m = Matrix2x2.fromReal(2, 1, 1, 2);
        const inv = m.inverse();
        expect(inv).not.toBeNull();
        const product = m.mul(inv!);
        expect(product.a00.real).toBeCloseTo(1, 10);
        expect(product.a01.isZero(1e-10)).toBe(true);
        expect(product.a10.isZero(1e-10)).toBe(true);
        expect(product.a11.real).toBeCloseTo(1, 10);
      });
    });
  });

  describe('Special Properties', () => {
    describe('isHermitian', () => {
      it('should identify Hermitian matrix', () => {
        const m = Matrix2x2.hermitian(4, new Complex(1, 2), 9);
        expect(m.isHermitian()).toBe(true);
      });

      it('should identify non-Hermitian matrix', () => {
        const m = Matrix2x2.fromReal(1, 2, 3, 4);
        expect(m.isHermitian()).toBe(false);
      });

      it('should identify real diagonal matrix as Hermitian', () => {
        const m = Matrix2x2.diagonal(new Complex(1), new Complex(2));
        expect(m.isHermitian()).toBe(true);
      });

      it('should identify identity as Hermitian', () => {
        expect(Matrix2x2.IDENTITY.isHermitian()).toBe(true);
      });
    });

    describe('isUnitary', () => {
      it('should identify identity as unitary', () => {
        expect(Matrix2x2.IDENTITY.isUnitary()).toBe(true);
      });

      it('should identify rotation matrix as unitary', () => {
        const m = jonesRotator(Math.PI / 4);
        expect(m.isUnitary(1e-10)).toBe(true);
      });

      it('should identify non-unitary matrix', () => {
        const m = Matrix2x2.fromReal(1, 2, 3, 4);
        expect(m.isUnitary()).toBe(false);
      });
    });

    describe('isPositiveSemiDefinite', () => {
      it('should identify PSD Hermitian matrix', () => {
        const m = Matrix2x2.hermitian(4, new Complex(1, 0), 4);
        expect(m.isPositiveSemiDefinite()).toBe(true);
      });

      it('should reject non-Hermitian matrix', () => {
        const m = Matrix2x2.fromReal(1, 2, 3, 4);
        expect(m.isPositiveSemiDefinite()).toBe(false);
      });

      it('should identify identity as PSD', () => {
        expect(Matrix2x2.IDENTITY.isPositiveSemiDefinite()).toBe(true);
      });

      it('should identify zero matrix as PSD', () => {
        expect(Matrix2x2.ZERO.isPositiveSemiDefinite()).toBe(true);
      });
    });

    describe('isZero', () => {
      it('should identify zero matrix', () => {
        expect(Matrix2x2.ZERO.isZero()).toBe(true);
      });

      it('should identify non-zero matrix', () => {
        expect(Matrix2x2.fromReal(1, 2, 3, 4).isZero()).toBe(false);
      });

      it('should use custom tolerance', () => {
        const m = Matrix2x2.fromReal(1e-15, 0, 0, 1e-15);
        expect(m.isZero(1e-10)).toBe(true);
      });
    });
  });

  describe('Jones Matrix Factories', () => {
    describe('linear polarizer', () => {
      it('should create horizontal polarizer (0°)', () => {
        const m = jonesLinearPolarizer(0);
        expect(m.a00.real).toBeCloseTo(1, 10);
        expect(m.a01.isZero(1e-10)).toBe(true);
        expect(m.a10.isZero(1e-10)).toBe(true);
        expect(m.a11.isZero(1e-10)).toBe(true);
      });

      it('should create vertical polarizer (90°)', () => {
        const m = jonesLinearPolarizer(Math.PI / 2);
        expect(m.a00.isZero(1e-10)).toBe(true);
        expect(m.a01.isZero(1e-10)).toBe(true);
        expect(m.a10.isZero(1e-10)).toBe(true);
        expect(m.a11.real).toBeCloseTo(1, 10);
      });

      it('should create 45° polarizer', () => {
        const m = jonesLinearPolarizer(Math.PI / 4);
        expect(m.a00.real).toBeCloseTo(0.5, 10);
        expect(m.a01.real).toBeCloseTo(0.5, 10);
        expect(m.a10.real).toBeCloseTo(0.5, 10);
        expect(m.a11.real).toBeCloseTo(0.5, 10);
      });

      it('should be Hermitian', () => {
        const m = jonesLinearPolarizer(Math.PI / 6);
        expect(m.isHermitian(1e-10)).toBe(true);
      });

      it('should be idempotent (P² = P)', () => {
        const m = jonesLinearPolarizer(Math.PI / 4);
        const squared = m.mul(m);
        expect(squared.a00.equals(m.a00, 1e-10)).toBe(true);
        expect(squared.a01.equals(m.a01, 1e-10)).toBe(true);
        expect(squared.a10.equals(m.a10, 1e-10)).toBe(true);
        expect(squared.a11.equals(m.a11, 1e-10)).toBe(true);
      });
    });

    describe('wave plate', () => {
      it('should create QWP (quarter wave plate)', () => {
        const m = jonesWavePlate(Math.PI / 2, Math.PI / 4);
        expect(m).not.toBeNull();
        // QWP at 45° should be circular polarizer
        expect(m.isUnitary(1e-10)).toBe(true);
      });

      it('should create HWP (half wave plate)', () => {
        const m = jonesWavePlate(Math.PI, 0);
        expect(m).not.toBeNull();
        // HWP with horizontal fast axis
        expect(m.isUnitary(1e-10)).toBe(true);
      });

      it('should be unitary (lossless)', () => {
        const m = jonesWavePlate(Math.PI / 2, Math.PI / 6);
        expect(m.isUnitary(1e-10)).toBe(true);
      });
    });

    describe('rotator', () => {
      it('should create rotation matrix', () => {
        const m = jonesRotator(Math.PI / 4);
        const expected = 1 / Math.sqrt(2);
        expect(m.a00.real).toBeCloseTo(expected, 10);
        expect(m.a01.real).toBeCloseTo(-expected, 10);
        expect(m.a10.real).toBeCloseTo(expected, 10);
        expect(m.a11.real).toBeCloseTo(expected, 10);
      });

      it('should be unitary', () => {
        const m = jonesRotator(Math.PI / 3);
        expect(m.isUnitary(1e-10)).toBe(true);
      });

      it('should satisfy R(θ) × R(φ) = R(θ + φ)', () => {
        const m1 = jonesRotator(Math.PI / 6);
        const m2 = jonesRotator(Math.PI / 3);
        const product = m1.mul(m2);
        const expected = jonesRotator(Math.PI / 6 + Math.PI / 3);
        expect(product.a00.equals(expected.a00, 1e-10)).toBe(true);
        expect(product.a01.equals(expected.a01, 1e-10)).toBe(true);
        expect(product.a10.equals(expected.a10, 1e-10)).toBe(true);
        expect(product.a11.equals(expected.a11, 1e-10)).toBe(true);
      });
    });
  });

  describe('Utility', () => {
    it('should clone matrix', () => {
      const m = Matrix2x2.fromReal(1, 2, 3, 4);
      const clone = m.clone();
      expect(clone.a00.real).toBe(1);
      expect(clone.a01.real).toBe(2);
      expect(clone.a10.real).toBe(3);
      expect(clone.a11.real).toBe(4);
      expect(clone).not.toBe(m);
    });

    it('should convert to string', () => {
      const m = Matrix2x2.fromReal(1, 2, 3, 4);
      const str = m.toString();
      expect(str).toContain('1.0000');
      expect(str).toContain('2.0000');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large values', () => {
      const m = Matrix2x2.fromReal(1e100, 1e100, 1e100, 1e100);
      expect(m.frobeniusNorm()).toBeGreaterThan(0);
    });

    it('should handle very small values', () => {
      const m = Matrix2x2.fromReal(1e-100, 1e-100, 1e-100, 1e-100);
      const det = m.determinant();
      expect(det.isZero()).toBe(true);
    });

    it('should handle NaN', () => {
      const m = new Matrix2x2(
        new Complex(NaN, 0),
        Complex.ZERO,
        Complex.ZERO,
        Complex.ZERO
      );
      expect(Number.isNaN(m.a00.real)).toBe(true);
    });

    it('should handle Infinity', () => {
      const m = new Matrix2x2(
        new Complex(Infinity, 0),
        Complex.ZERO,
        Complex.ZERO,
        Complex.ZERO
      );
      expect(m.a00.real).toBe(Infinity);
    });
  });

  describe('Mathematical Correctness', () => {
    it('should satisfy (A × B)^T = B^T × A^T', () => {
      const a = Matrix2x2.fromReal(1, 2, 3, 4);
      const b = Matrix2x2.fromReal(5, 6, 7, 8);
      const left = a.mul(b).transpose();
      const right = b.transpose().mul(a.transpose());
      expect(left.a00.equals(right.a00, 1e-10)).toBe(true);
      expect(left.a01.equals(right.a01, 1e-10)).toBe(true);
      expect(left.a10.equals(right.a10, 1e-10)).toBe(true);
      expect(left.a11.equals(right.a11, 1e-10)).toBe(true);
    });

    it('should satisfy det(A^T) = det(A)', () => {
      const m = Matrix2x2.fromReal(1, 2, 3, 4);
      const det1 = m.determinant();
      const det2 = m.transpose().determinant();
      expect(det1.equals(det2, 1e-10)).toBe(true);
    });

    it('should satisfy det(A*) = conj(det(A))', () => {
      const m = new Matrix2x2(
        new Complex(1, 1),
        new Complex(2, 0),
        new Complex(3, 0),
        new Complex(4, 1)
      );
      const det1 = m.determinant();
      const det2 = m.conjugate().determinant();
      expect(det2.equals(det1.conjugate(), 1e-10)).toBe(true);
    });
  });
});
