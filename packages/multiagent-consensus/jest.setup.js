// Silence console.error and console.warn during tests
let errorSpy, warnSpy, logSpy;

beforeAll(() => {
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

// Restore original console methods after all tests
afterAll(() => {
  if (errorSpy) errorSpy.mockRestore();
  if (warnSpy) warnSpy.mockRestore();
  if (logSpy) logSpy.mockRestore();
});
