/**
 * Generates a random number between 0 and 1 using the Web Crypto API.
 * This function uses `crypto.getRandomValues` to ensure that the number is
 * generated in a cryptographically secure manner.
 * @returns A random number between 0 (inclusive) and 1 (exclusive).
 */
export function getRandomNumber(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / 0xff_ff_ff_ff;
}

