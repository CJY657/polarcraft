/**
 * Complex Number Tests
 * Comprehensive tests for the Complex class, covering:
 * - Construction and static factories
 * - Properties (magnitude, phase)
 * - Arithmetic operations
 * - Advanced operations (exp, sqrt, log, pow)
 * - Comparison operations
 * - Edge cases (zero, infinity, NaN, numerical stability)
 * - Mathematical correctness (Euler's identity, conjugation properties)
 */

import { Complex, complexMul, complexAdd, complexMagSq } from './Complex';

describe('Complex', () => {
  describe('Static Factories', () => {
    it('should create complex number from real and imaginary parts', () => {
      const c = new Complex(3, 4);
      expect(c.real).toBe(3);
      expect(c.imag).toBe(4);
    });

    it('should default imaginary part to 0', () => {
      const c = new Complex(5);
      expect(c.real).toBe(5);
      expect(c.imag).toBe(0);
    });

    it('should create from polar coordinates', () => {
      const c = Complex.fromPolar(5, Math.PI / 4);
      expect(c.magnitude).toBeCloseTo(5, 10);
      expect(c.phase).toBeCloseTo(Math.PI / 4, 10);
    });

    it('should create complex exponential e^(iθ)', () => {
      const c = Complex.exp(Math.PI / 2);
      expect(c.real).toBeCloseTo(0, 10);
      expect(c.imag).toBeCloseTo(1, 10);
    });

    it('should have static ZERO constant', () => {
      expect(Complex.ZERO.real).toBe(0);
      expect(Complex.ZERO.imag).toBe(0);
    });

    it('should have static ONE constant', () => {
      expect(Complex.ONE.real).toBe(1);
      expect(Complex.ONE.imag).toBe(0);
    });

    it('should have static I constant', () => {
      expect(Complex.I.real).toBe(0);
      expect(Complex.I.imag).toBe(1);
    });

    it('should create from array', () => {
      const c = Complex.fromArray([3, 4]);
      expect(c.real).toBe(3);
      expect(c.imag).toBe(4);
    });
  });

  describe('Properties', () => {
    it('should calculate magnitude correctly', () => {
      const c = new Complex(3, 4);
      expect(c.magnitude).toBe(5);
    });

    it('should calculate magnitude squared correctly', () => {
      const c = new Complex(3, 4);
      expect(c.magnitudeSquared).toBe(25);
    });

    it('should calculate phase for first quadrant', () => {
      const c = new Complex(1, 1);
      expect(c.phase).toBeCloseTo(Math.PI / 4, 10);
    });

    it('should calculate phase for second quadrant', () => {
      const c = new Complex(-1, 1);
      expect(c.phase).toBeCloseTo(3 * Math.PI / 4, 10);
    });

    it('should calculate phase for third quadrant', () => {
      const c = new Complex(-1, -1);
      expect(c.phase).toBeCloseTo(-3 * Math.PI / 4, 10);
    });

    it('should calculate phase for fourth quadrant', () => {
      const c = new Complex(1, -1);
      expect(c.phase).toBeCloseTo(-Math.PI / 4, 10);
    });

    it('should calculate phase for positive real axis', () => {
      const c = new Complex(1, 0);
      expect(c.phase).toBeCloseTo(0, 10);
    });

    it('should calculate phase for negative real axis', () => {
      const c = new Complex(-1, 0);
      expect(c.phase).toBeCloseTo(Math.PI, 10);
    });
  });

  describe('Arithmetic Operations', () => {
    describe('addition', () => {
      it('should add two complex numbers', () => {
        const a = new Complex(1, 2);
        const b = new Complex(3, 4);
        const result = a.add(b);
        expect(result.real).toBe(4);
        expect(result.imag).toBe(6);
      });

      it('should add complex number to its conjugate', () => {
        const c = new Complex(3, 4);
        const result = c.add(c.conjugate());
        expect(result.real).toBe(6);
        expect(result.imag).toBe(0);
      });
    });

    describe('subtraction', () => {
      it('should subtract two complex numbers', () => {
        const a = new Complex(5, 7);
        const b = new Complex(2, 3);
        const result = a.sub(b);
        expect(result.real).toBe(3);
        expect(result.imag).toBe(4);
      });
    });

    describe('multiplication', () => {
      it('should multiply two complex numbers', () => {
        const a = new Complex(1, 2);
        const b = new Complex(3, 4);
        const result = a.mul(b);
        expect(result.real).toBe(-5);
        expect(result.imag).toBe(10);
      });

      it('should multiply by i', () => {
        const c = new Complex(1, 0);
        const result = c.mul(Complex.I);
        expect(result.real).toBeCloseTo(0, 10);
        expect(result.imag).toBeCloseTo(1, 10);
      });

      it('should satisfy i² = -1', () => {
        const result = Complex.I.mul(Complex.I);
        expect(result.real).toBeCloseTo(-1, 10);
        expect(result.imag).toBeCloseTo(0, 10);
      });
    });

    describe('division', () => {
      it('should divide two complex numbers', () => {
        const a = new Complex(4, 6);
        const b = new Complex(1, 1);
        const result = a.div(b);
        expect(result.real).toBe(5);
        expect(result.imag).toBe(1);
      });

      it('should divide by zero safely', () => {
        const c = new Complex(1, 1);
        const result = c.div(Complex.ZERO);
        expect(result.real).toBe(0);
        expect(result.imag).toBe(0);
      });

      it('should divide by near-zero safely', () => {
        const c = new Complex(1, 1);
        const tiny = new Complex(1e-15, 1e-15);
        const result = c.div(tiny);
        expect(result).toEqual(Complex.ZERO);
      });
    });

    describe('scalar multiplication', () => {
      it('should scale by positive scalar', () => {
        const c = new Complex(1, 2);
        const result = c.scale(3);
        expect(result.real).toBe(3);
        expect(result.imag).toBe(6);
      });

      it('should scale by negative scalar', () => {
        const c = new Complex(1, 2);
        const result = c.scale(-2);
        expect(result.real).toBe(-2);
        expect(result.imag).toBe(-4);
      });

      it('should scale by zero', () => {
        const c = new Complex(1, 2);
        const result = c.scale(0);
        expect(result.real).toBe(0);
        expect(result.imag).toBe(0);
      });
    });

    describe('conjugate', () => {
      it('should return conjugate', () => {
        const c = new Complex(3, 4);
        const result = c.conjugate();
        expect(result.real).toBe(3);
        expect(result.imag).toBe(-4);
      });

      it('should return real number unchanged', () => {
        const c = new Complex(5, 0);
        const result = c.conjugate();
        expect(result.real).toBe(5);
        expect(result.isReal()).toBe(true); // Use isReal() instead of comparing to 0 (handles -0 vs +0)
      });

      it('should satisfy |z|² = z × z*', () => {
        const c = new Complex(3, 4);
        const conjugate = c.conjugate();
        const product = c.mul(conjugate);
        expect(product.real).toBeCloseTo(25, 10);
        expect(product.imag).toBeCloseTo(0, 10);
      });
    });

    describe('negation', () => {
      it('should negate complex number', () => {
        const c = new Complex(3, 4);
        const result = c.negate();
        expect(result.real).toBe(-3);
        expect(result.imag).toBe(-4);
      });
    });
  });

  describe('Advanced Operations', () => {
    describe('exponential', () => {
      it('should calculate e^z', () => {
        const c = new Complex(0, Math.PI);
        const result = c.exp();
        expect(result.real).toBeCloseTo(-1, 10);
        expect(result.imag).toBeCloseTo(0, 10);
      });

      it('should satisfy Euler\'s identity: e^(iπ) + 1 = 0', () => {
        const c = new Complex(0, Math.PI);
        const result = c.exp().add(Complex.ONE);
        expect(result.real).toBeCloseTo(0, 10);
        expect(result.imag).toBeCloseTo(0, 10);
      });

      it('should calculate e^0 = 1', () => {
        const c = Complex.ZERO;
        const result = c.exp();
        expect(result.real).toBeCloseTo(1, 10);
        expect(result.imag).toBeCloseTo(0, 10);
      });
    });

    describe('square root', () => {
      it('should calculate sqrt of positive real', () => {
        const c = new Complex(4, 0);
        const result = c.sqrt();
        expect(result.real).toBeCloseTo(2, 10);
        expect(result.imag).toBeCloseTo(0, 10);
      });

      it('should calculate sqrt of negative real', () => {
        const c = new Complex(-1, 0);
        const result = c.sqrt();
        expect(result.real).toBeCloseTo(0, 10);
        expect(result.imag).toBeCloseTo(1, 10);
      });

      it('should calculate sqrt of complex number', () => {
        const c = new Complex(3, 4);
        const result = c.sqrt();
        const squared = result.mul(result);
        expect(squared.real).toBeCloseTo(3, 10);
        expect(squared.imag).toBeCloseTo(4, 10);
      });

      it('should handle zero', () => {
        const c = Complex.ZERO;
        const result = c.sqrt();
        expect(result.real).toBe(0);
        expect(result.imag).toBe(0);
      });
    });

    describe('logarithm', () => {
      it('should calculate natural log of positive real', () => {
        const c = new Complex(Math.E, 0);
        const result = c.log();
        expect(result.real).toBeCloseTo(1, 10);
        expect(result.imag).toBeCloseTo(0, 10);
      });

      it('should calculate log of complex number', () => {
        const c = new Complex(1, Math.PI / 4);
        const result = c.log();
        const back = result.exp();
        expect(back.real).toBeCloseTo(c.real, 10);
        expect(back.imag).toBeCloseTo(c.imag, 10);
      });
    });

    describe('power', () => {
      it('should calculate z^2', () => {
        const c = new Complex(1, 2);
        const result = c.pow(2);
        expect(result.real).toBeCloseTo(-3, 10);
        expect(result.imag).toBeCloseTo(4, 10);
      });

      it('should calculate z^0 = 1', () => {
        const c = new Complex(3, 4);
        const result = c.pow(0);
        expect(result.real).toBeCloseTo(1, 10);
        expect(result.imag).toBeCloseTo(0, 10);
      });

      it('should calculate z^(-1) = 1/z', () => {
        const c = new Complex(2, 0);
        const result = c.pow(-1);
        expect(result.real).toBeCloseTo(0.5, 10);
        expect(result.imag).toBeCloseTo(0, 10);
      });

      it('should calculate (-1)^(1/2) = i', () => {
        const c = new Complex(-1, 0);
        const result = c.pow(0.5);
        expect(result.real).toBeCloseTo(0, 10);
        expect(result.imag).toBeCloseTo(1, 10);
      });

      it('should handle zero base with positive exponent', () => {
        const c = Complex.ZERO;
        const result = c.pow(2);
        expect(result.real).toBe(0);
        expect(result.imag).toBe(0);
      });
    });

    describe('complex power', () => {
      it('should calculate z^w', () => {
        const base = new Complex(2, 0);
        const exp = new Complex(2, 0);
        const result = base.powComplex(exp);
        expect(result.real).toBeCloseTo(4, 10);
        expect(result.imag).toBeCloseTo(0, 10);
      });

      it('should handle zero base', () => {
        const base = Complex.ZERO;
        const exp = new Complex(2, 0);
        const result = base.powComplex(exp);
        expect(result.real).toBe(0);
        expect(result.imag).toBe(0);
      });
    });
  });

  describe('Comparison Operations', () => {
    describe('isZero', () => {
      it('should return true for zero', () => {
        expect(Complex.ZERO.isZero()).toBe(true);
      });

      it('should return false for non-zero', () => {
        expect(new Complex(1, 0).isZero()).toBe(false);
        expect(new Complex(0, 1).isZero()).toBe(false);
        expect(new Complex(1e-10, 0).isZero()).toBe(false); // Use value > EPSILON (1e-12)
      });

      it('should use custom tolerance', () => {
        expect(new Complex(1e-10, 0).isZero(1e-8)).toBe(true);
      });
    });

    describe('equals', () => {
      it('should return true for equal numbers', () => {
        const a = new Complex(1, 2);
        const b = new Complex(1, 2);
        expect(a.equals(b)).toBe(true);
      });

      it('should return false for different numbers', () => {
        const a = new Complex(1, 2);
        const b = new Complex(1, 3);
        expect(a.equals(b)).toBe(false);
      });

      it('should use custom tolerance', () => {
        const a = new Complex(1, 2);
        const b = new Complex(1.0001, 2.0001);
        expect(a.equals(b, 1e-3)).toBe(true);
      });
    });

    describe('isReal', () => {
      it('should return true for real numbers', () => {
        expect(new Complex(5, 0).isReal()).toBe(true);
      });

      it('should return false for complex numbers', () => {
        expect(new Complex(5, 1).isReal()).toBe(false);
      });

      it('should use custom tolerance', () => {
        expect(new Complex(5, 1e-15).isReal(1e-10)).toBe(true);
      });
    });

    describe('isImaginary', () => {
      it('should return true for imaginary numbers', () => {
        expect(new Complex(0, 5).isImaginary()).toBe(true);
      });

      it('should return false for complex numbers', () => {
        expect(new Complex(1, 5).isImaginary()).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      const c = new Complex(1e100, 1e100);
      expect(c.magnitude).toBeGreaterThan(0);
      expect(Number.isFinite(c.magnitude)).toBe(true);
    });

    it('should handle very small numbers', () => {
      const c = new Complex(1e-100, 1e-100);
      expect(c.magnitude).toBeGreaterThan(0);
      expect(c.magnitude).toBeLessThan(1);
    });

    it('should handle NaN in real part', () => {
      const c = new Complex(NaN, 1);
      expect(Number.isNaN(c.real)).toBe(true);
    });

    it('should handle Infinity', () => {
      const c = new Complex(Infinity, 1);
      expect(c.real).toBe(Infinity);
    });

    it('should handle negative zero', () => {
      const c = new Complex(-0, -0);
      // JavaScript has signed zeros; -0 !== 0 but -0 == 0
      // Check magnitude instead which treats -0 the same as 0
      expect(c.magnitude).toBe(0);
    });
  });

  describe('Mathematical Correctness', () => {
    it('should satisfy commutative property of addition', () => {
      const a = new Complex(1, 2);
      const b = new Complex(3, 4);
      const ab = a.add(b);
      const ba = b.add(a);
      expect(ab.equals(ba)).toBe(true);
    });

    it('should satisfy associative property of addition', () => {
      const a = new Complex(1, 2);
      const b = new Complex(3, 4);
      const c = new Complex(5, 6);
      const abc = a.add(b).add(c);
      const ab_c = a.add(b.add(c));
      expect(abc.equals(ab_c)).toBe(true);
    });

    it('should satisfy commutative property of multiplication', () => {
      const a = new Complex(1, 2);
      const b = new Complex(3, 4);
      const ab = a.mul(b);
      const ba = b.mul(a);
      expect(ab.equals(ba)).toBe(true);
    });

    it('should satisfy (z*)* = z', () => {
      const c = new Complex(3, 4);
      const result = c.conjugate().conjugate();
      expect(result.equals(c)).toBe(true);
    });

    it('should satisfy (z₁ + z₂)* = z₁* + z₂*', () => {
      const a = new Complex(1, 2);
      const b = new Complex(3, 4);
      const left = a.add(b).conjugate();
      const right = a.conjugate().add(b.conjugate());
      expect(left.equals(right)).toBe(true);
    });

    it('should satisfy |z₁ × z₂| = |z₁| × |z₂|', () => {
      const a = new Complex(3, 4);
      const b = new Complex(1, 1);
      const productMag = a.mul(b).magnitude;
      const magProduct = a.magnitude * b.magnitude;
      expect(productMag).toBeCloseTo(magProduct, 10);
    });
  });

  describe('Utility Functions', () => {
    it('should clone complex number', () => {
      const c = new Complex(3, 4);
      const clone = c.clone();
      expect(clone.equals(c)).toBe(true);
      expect(clone).not.toBe(c);
    });

    it('should convert to array', () => {
      const c = new Complex(3, 4);
      expect(c.toArray()).toEqual([3, 4]);
    });

    it('should convert to string', () => {
      const c = new Complex(3, 4);
      const str = c.toString();
      expect(str).toContain('3.0000');
      expect(str).toContain('4.0000');
    });
  });

  describe('Performance-Critical Functions', () => {
    it('should multiply complex numbers using tuple function', () => {
      const [r, i] = complexMul(1, 2, 3, 4);
      expect(r).toBe(-5);
      expect(i).toBe(10);
    });

    it('should add complex numbers using tuple function', () => {
      const [r, i] = complexAdd(1, 2, 3, 4);
      expect(r).toBe(4);
      expect(i).toBe(6);
    });

    it('should calculate magnitude squared using tuple function', () => {
      const magSq = complexMagSq(3, 4);
      expect(magSq).toBe(25);
    });
  });
});
