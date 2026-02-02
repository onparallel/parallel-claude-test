export class SettingsValidationError extends Error {
  constructor(
    public path: string,
    public override message: string,
  ) {
    super(message);
  }
}

export class MockSapOdataClientError extends Error {
  constructor(message: string) {
    super(message);
  }
}
