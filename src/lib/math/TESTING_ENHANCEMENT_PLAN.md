# Math Library Testing and Enhancement Plan

## Overview

Add comprehensive tests, fix mathematical issues, and improve numerical stability for `src/lib/math/` library (Complex, Matrix2x2, Vector3).

## Critical Files

### Source Files (to be modified)

- `src/lib/math/Complex.ts` - Complex number class
- `src/lib/math/Matrix2x2.ts` - 2x2 complex matrix class
- `src/lib/math/Vector3.ts` - 3D vector class

### Test Files (to be created)

- `src/lib/math/Complex.test.ts` - Complex number tests
- `src/lib/math/Matrix2x2.test.ts` - Matrix2x2 tests
- `src/lib/math/Vector3.test.ts` - Vector3 tests

### Configuration (optional update)

- `vitest.config.ts` - Update coverage pattern to include `src/lib/**/*.ts`

---

## Phase 1: Create Comprehensive Tests

### 1.1 Complex.test.ts

Test categories:

- **Construction**: `new Complex()`, `fromPolar()`, static factories
- **Properties**: `magnitude`, `magnitudeSquared`, `phase`
- **Arithmetic**: `add()`, `sub()`, `mul()`, `div()`, `scale()`, `conjugate()`, `negate()`
- **Advanced**: `exp()`, `sqrt()`, `log()`, `pow()`, `powComplex()`
- **Comparison**: `isZero()`, `equals()`, `isReal()`, `isImaginary()`
- **Edge cases**: zero, infinity, NaN, very small/large numbers
- **Mathematical correctness**: verify against known identities

### 1.2 Matrix2x2.test.ts

Test categories:

- **Construction**: `fromReal()`, `diagonal()`, `hermitian()`, static factories
- **Properties**: `trace()`, `determinant()`, `frobeniusNorm()`
- **Arithmetic**: `add()`, `sub()`, `mul()`, `scale()`, `scaleComplex()`
- **Matrix operations**: `transpose()`, `conjugate()`, `adjoint()`, `inverse()`
- **Jones matrices**: `jonesLinearPolarizer()`, `jonesWavePlate()`, `jonesRotator()`
- **Hermitian/unitary checks**: `isHermitian()`, `isUnitary()`, `isPositiveSemiDefinite()`
- **Edge cases**: singular matrices, near-singular matrices

### 1.3 Vector3.test.ts

Test categories:

- **Construction**: `fromArray()`, `fromSpherical()`, static factories
- **Properties**: `length`, `lengthSquared`
- **Arithmetic**: `add()`, `sub()`, `scale()`, `negate()`, `dot()`, `cross()`
- **Normalization**: `normalize()`, `normalizeOr()`
- **Geometric**: `reflect()`, `refract()`, `projectOnto()`, `perpendicular()`, `angleTo()`
- **Comparison**: `isParallel()`, `isPerpendicular()`, `equals()`, `isZero()`, `isNormalized()`
- **Interpolation**: `lerp()`, `slerp()`
- **Utility functions**: `buildOrthonormalBasis()`, `rotateAroundAxis()`, `signedAngle()`

---

## Phase 2: Fix Mathematical Issues (with Comments)

### 2.1 Complex.ts Fixes

#### Issue 1: `div()` zero division handling (lines 91-102)

**Add comprehensive comment preserving original code:**

```typescript
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
  return new Complex(
    (this.real * other.real + this.imag * other.imag) / denom,
    (this.imag * other.real - this.real * other.imag) / denom
  );
}
```

#### Issue 2: `powComplex()` edge case (lines 186-193)

**Add edge case handling with comments:**

```typescript
powComplex(exponent: Complex): Complex {
  if (this.isZero()) {
    // === MATHEMATICAL NOTE: Zero Base Powers ===
    // 0^z is defined only for Re(z) > 0, returning 0
    // Special cases:
    //   - 0^0 : undefined (indeterminate form)
    //   - 0^positive_real : 0
    //   - 0^negative_real : undefined (approaches infinity)
    // Current: Return ZERO for all cases (stable default)
    // Alternative: Handle strictly:
    //   if (exponent.isZero()) return new Complex(NaN, NaN);      // 0^0
    //   if (exponent.real < 0) return new Complex(Infinity, 0);  // 0^negative
    return Complex.ZERO;
  }
  const logThis = this.log();
  const product = exponent.mul(logThis);
  return product.exp();
}
```

#### Issue 3: `pow()` phase normalization (lines 169-180)

**Add phase normalization comment:**

```typescript
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
  const newPhase = this.phase * n;
  return new Complex(
    newMag * Math.cos(newPhase),
    newMag * Math.sin(newPhase)
  );
}
```

### 2.2 Matrix2x2.ts Enhancements

#### Add condition number check for `inverse()` (lines 222-234)

**Add numerical stability comment before inverse:**

```typescript
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
  return new Matrix2x2(
    this.a11.mul(invDet),
    this.a01.negate().mul(invDet),
    this.a10.negate().mul(invDet),
    this.a00.mul(invDet)
  );
}
```

### 2.3 Vector3.ts Fixes

#### Issue 1: `normalize()` zero vector documentation (lines 130-136)

**Add comprehensive comment:**

```typescript
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
```

#### Issue 2: `angleTo()` zero vector handling (lines 204-212)

**Add documentation comment:**

```typescript
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
  const cosAngle = Math.max(-1, Math.min(1, this.dot(other) / lenProduct));
  return Math.acos(cosAngle);
}
```

---

## Phase 3: Add Numerical Stability Methods (New Methods)

### 3.1 Complex.ts Additions

```typescript
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
 */
isValidPhysicalQuantity(): boolean {
  return this.isFinite() && this.magnitude >= 0;
}
```

### 3.2 Matrix2x2.ts Additions

```typescript
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
```

### 3.3 Vector3.ts Additions

```typescript
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
 */
angleToStrict(other: Vector3): number {
  const lenProduct = this.length * other.length;
  if (lenProduct < EPSILON) {
    return NaN; // Explicitly undefined for zero vectors
  }
  const cosAngle = Math.max(-1, Math.min(1, this.dot(other) / lenProduct));
  return Math.acos(cosAngle);
}
```

---

## Phase 4: Update Vitest Configuration

Update `vitest.config.ts` to include math library in coverage:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  // Change to include lib directory:
  include: ['src/lib/**/*.ts', 'src/core/**/*.ts'],
}
```

---

## Verification

### Run Tests

```bash

npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
```

### Expected Coverage Goals

- Complex.ts: >95% coverage
- Matrix2x2.ts: >95% coverage
- Vector3.ts: >95% coverage

### Manual Verification Checklist

- [ ] All tests pass
- [ ] Edge cases properly handled (zero, infinity, NaN)
- [ ] Numerical stability verified with extreme values
- [ ] No regressions in existing functionality
- [ ] Comments are clear and preserve original intent

---

## Implementation Order

1. **Create test files** (test-driven approach):
   - `Complex.test.ts`
   - `Matrix2x2.test.ts`
   - `Vector3.test.ts`

2. **Run tests to identify failures**

3. **Add mathematical comments** to edge cases (preserving original behavior)

4. **Add numerical stability methods** (new methods only, no breaking changes)

5. **Update vitest config** for coverage

6. **Final verification**
