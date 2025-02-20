// Convert fractional odds (e.g., "5/1") to decimal odds (e.g., 6.0)
export const fractionalToDecimal = (fractional: string): number => {
  const [numerator, denominator] = fractional.split('/').map(Number);
  if (!denominator) return 0;
  return (numerator / denominator) + 1;
};

// Convert decimal odds (e.g., 6.0) to fractional odds (e.g., "5/1")
export const decimalToFractional = (decimal: number): string => {
  const numerator = decimal - 1;
  if (numerator === 0) return "0/1";
  
  // Find the best fractional representation
  const precision = 0.001; // Adjust for accuracy
  for (let denominator = 1; denominator <= 100; denominator++) {
    const testNumerator = Math.round(numerator * denominator);
    if (Math.abs(testNumerator / denominator - numerator) < precision) {
      return `${testNumerator}/${denominator}`;
    }
  }
  
  return `${Math.round(numerator)}/${1}`;
};

// Detect if a string is in fractional format
export const isFractionalOdds = (odds: string): boolean => {
  return /^\d+\/\d+$/.test(odds.trim());
};

// Calculate total odds for an accumulator
export const calculateAccumulatorOdds = (odds: number[]): number => {
  return odds.reduce((total, current) => total * current, 1);
};
