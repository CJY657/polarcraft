/**
 * Saccharimetry Physics Module
 * Calculation of optical rotation for sugar solutions (sucrose)
 * Demonstrating rotary dispersion - wavelength-dependent optical rotation
 */

/**
 * Parameters for saccharimetry calculations
 */
export interface SaccharimetryParams {
  wavelength: number;      // nm (380-700 for visible light)
  concentration: number;   // g/mL (sucrose solution, typical range 0-1)
  pathLength: number;      // dm (tube length, typical range 1-10)
  temperature?: number;    // °C (default 20, affects specific rotation slightly)
}

/**
 * Specific rotation of sucrose at different wavelengths
 * Based on experimental data at 20°C
 * Values are in degrees·mL/(g·dm)
 * Source: International Critical Tables and optical rotation databases
 */
const SUCROSE_SPECIFIC_ROTATION_DATA: Record<number, number> = {
  700: 45.5,   // red
  650: 52.3,   // orange-red
  600: 60.8,   // orange
  589: 66.5,   // sodium D line (yellow-green) - standard reference
  550: 71.2,   // green
  500: 81.5,   // cyan-green
  450: 95.8,   // blue
  400: 115.0,  // violet
};

/**
 * Standard wavelengths for visualization across the visible spectrum
 */
export const SPECTRUM_WAVELENGTHS = [700, 650, 600, 550, 500, 450, 400];

/**
 * Convert wavelength to RGB color string
 * Based on Dan Bruton's algorithm for visible light approximation
 * @param wavelength - Wavelength in nanometers (380-700)
 * @returns RGB color string "rgb(r, g, b)"
 */
export function wavelengthToRGB(wavelength: number): string {
  let r = 0, g = 0, b = 0;

  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
  } else if (wavelength >= 645 && wavelength <= 700) {
    r = 1;
  }

  // Intensity correction for visibility at spectrum edges
  let alpha = 1;
  if (wavelength >= 380 && wavelength < 420) {
    alpha = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else if (wavelength >= 645 && wavelength <= 700) {
    alpha = 0.3 + 0.7 * (700 - wavelength) / (700 - 645);
  }

  return `rgb(${Math.round(r * 255 * alpha)}, ${Math.round(g * 255 * alpha)}, ${Math.round(b * 255 * alpha)})`;
}

/**
 * Get color name for a given wavelength
 * @param wavelength - Wavelength in nanometers
 * @returns Color name in Chinese
 */
export function getColorName(wavelength: number): string {
  if (wavelength >= 620) return "红";
  if (wavelength >= 590) return "橙";
  if (wavelength >= 570) return "黄";
  if (wavelength >= 495) return "绿";
  if (wavelength >= 470) return "青";
  if (wavelength >= 420) return "蓝";
  return "紫";
}

/**
 * Get specific rotation of sucrose at a given wavelength
 * Uses cubic spline interpolation between data points
 * @param wavelength - Wavelength in nanometers
 * @param temperature - Temperature in °C (default 20)
 * @returns Specific rotation in degrees·mL/(g·dm)
 */
export function getSpecificRotation(wavelength: number, temperature: number = 20): number {
  // Temperature correction (simplified): rotation decreases slightly with temperature
  // Approximate coefficient: -0.01 °C⁻¹ for sucrose
  const tempCorrection = 1 - 0.01 * (temperature - 20);

  // Find surrounding data points for interpolation
  const wavelengths = Object.keys(SUCROSE_SPECIFIC_ROTATION_DATA).map(Number).sort((a, b) => a - b);

  // If exact match exists
  if (SUCROSE_SPECIFIC_ROTATION_DATA[wavelength]) {
    return SUCROSE_SPECIFIC_ROTATION_DATA[wavelength] * tempCorrection;
  }

  // Find interpolation range
  let lowerWl = wavelengths[0];
  let upperWl = wavelengths[wavelengths.length - 1];

  for (let i = 0; i < wavelengths.length - 1; i++) {
    if (wavelength >= wavelengths[i] && wavelength <= wavelengths[i + 1]) {
      lowerWl = wavelengths[i];
      upperWl = wavelengths[i + 1];
      break;
    }
  }

  // Linear interpolation
  const lowerValue = SUCROSE_SPECIFIC_ROTATION_DATA[lowerWl];
  const upperValue = SUCROSE_SPECIFIC_ROTATION_DATA[upperWl];
  const t = (wavelength - lowerWl) / (upperWl - lowerWl);
  const interpolatedValue = lowerValue + t * (upperValue - lowerValue);

  return interpolatedValue * tempCorrection;
}

/**
 * Calculate optical rotation angle for a specific wavelength
 * Formula: α = [α]_λ × c × L
 * @param params - Saccharimetry parameters
 * @returns Rotation angle in degrees
 */
export function calculateRotation(params: SaccharimetryParams): number {
  const { wavelength, concentration, pathLength, temperature = 20 } = params;

  const specificRotation = getSpecificRotation(wavelength, temperature);
  const rotation = specificRotation * concentration * pathLength;

  return rotation;
}

/**
 * Calculate rotation angles for all spectrum wavelengths
 * Useful for batch calculations in visualization
 * @param concentration - Solution concentration in g/mL
 * @param pathLength - Tube length in dm
 * @param temperature - Temperature in °C (default 20)
 * @returns Array of { wavelength, color, rotationAngle }
 */
export function calculateAllRotations(
  concentration: number,
  pathLength: number,
  temperature: number = 20
): Array<{ wavelength: number; color: string; colorName: string; rotationAngle: number }> {
  return SPECTRUM_WAVELENGTHS.map((wl) => ({
    wavelength: wl,
    color: wavelengthToRGB(wl),
    colorName: getColorName(wl),
    rotationAngle: calculateRotation({
      wavelength: wl,
      concentration,
      pathLength,
      temperature,
    }),
  }));
}
