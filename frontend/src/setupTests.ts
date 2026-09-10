import { configure } from "@testing-library/react";

import "@testing-library/jest-dom/vitest";

// Async component tests can be slow on constrained CI runners (lazy chunks,
// Recharts, jsdom setup). Give findBy* / waitFor more room.
configure({ asyncUtilTimeout: 5000 });

// jsdom lacks ResizeObserver, which Recharts' ResponsiveContainer needs.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!("ResizeObserver" in globalThis)) {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
}
