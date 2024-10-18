/**
 * Generates and increasing sequence of letter indices (same as Excel columns)
 * A, B, ... Z, AA, AB, ... AZ, BA ... ZZ, AAA, AAB, ...
 */
export function* letters() {
  const symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  let counter = 0;
  while (true) {
    let remaining = counter;
    let result = "";
    while (remaining >= 0) {
      result = symbols[remaining % symbols.length] + result;
      remaining = Math.floor(remaining / symbols.length) - 1;
    }
    yield result;
    counter++;
  }
}

/**
 * Generates an increasing sequence of numbers
 */
export function* numbers() {
  let counter = 0;
  while (true) {
    yield counter + 1;
    counter++;
  }
}

/**
 * Generates an increasing sequence of Roman numerals
 */
export function* romanNumerals() {
  const syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
  const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  let counter = 1;
  while (true) {
    let value = counter;
    let roman = "";
    for (let i = 0; i < val.length; i++) {
      while (value >= val[i]) {
        value -= val[i];
        roman += syms[i];
      }
    }
    yield roman;
    counter++;
  }
}

export function nth<T>(generator: Generator<T>, index: number) {
  for (let i = 0; i < index; ++i) {
    generator.next();
  }
  return generator.next().value;
}
