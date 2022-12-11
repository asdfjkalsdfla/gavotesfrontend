import { vi, beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./mocks/server.js";

// ###########################
// HTTP Mocking
// ###########################

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());

// ###########################
// Mock items note in jsdom
// ###########################

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
