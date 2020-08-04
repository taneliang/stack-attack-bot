import { Logger } from ".";

export function mockLogger(): Logger {
  return {
    // Mock all logged functions
    fatal: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),

    // Calling child simply creates another mock logger
    child: mockLogger,
  };
}
