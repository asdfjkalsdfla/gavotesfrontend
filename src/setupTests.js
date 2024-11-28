import { vi, expect, beforeAll, afterEach, afterAll } from "vitest";

import { server } from "./mocks/server.mjs";

// ###########################
// HTTP Mocking
// ###########################

// Establish API mocking before all tests.
beforeAll(() => {
  // server.listen({
  //   onUnhandledRequest: (request, print) => {
  //     // console.log(request);
  //     if (request.url.toString().startsWith("https://georgiavotesvisual.com/static/absentee/")) {
  //       print.error();
  //     }
  //   },
  // });
  server.listen();
});

// so they don't affect other tests.
afterEach(() => {
  server.resetHandlers();
});

// Clean up after the tests are finished.
afterAll(() => {
  server.close();
});

// ###########################
// Mock items note in jsdom
// ###########################
const isDomWindow = expect.getState().environment === "jsdom";

if (isDomWindow) {
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

  class ResizeObserver {
    observe() {
      // do nothing
    }
    unobserve() {
      // do nothing
    }
    disconnect() {
      // do nothing
    }
  }

  window.ResizeObserver = ResizeObserver;

  window.URL.createObjectURL = vi.fn();

  const { getComputedStyle } = window;
  window.getComputedStyle = (elt) => getComputedStyle(elt);
}
