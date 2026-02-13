/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import { ReactNode, createElement } from "react";

// Mock Next.js router
vi.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "/",
      query: {},
      asPath: "/",
      push: vi.fn(),
      pop: vi.fn(),
      reload: vi.fn(),
      back: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      beforePopState: vi.fn(),
      events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
    };
  },
}));

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => {
    return createElement("a", { href }, children);
  },
}));
