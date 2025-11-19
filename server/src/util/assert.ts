type AssertionError = Error & {
  __type: "AssertionError";
};

export function isAssertionError(error: unknown): error is AssertionError {
  return error instanceof Error && error.message.startsWith("Assertion Error: ");
}

export function getAssertionErrorMessage(error: AssertionError): string {
  return error.message.slice("Assertion Error: ".length);
}
