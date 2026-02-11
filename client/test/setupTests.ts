import "@testing-library/jest-dom";
import { ReactNode, createElement } from "react";

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "/",
      query: {},
      asPath: "/",
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ children, href }: { children: ReactNode; href: string }) => {
    return createElement("a", { href }, children);
  };
});
