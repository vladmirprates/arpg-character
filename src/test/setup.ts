import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Node 25 ships a native (file-backed) localStorage that shadows jsdom's; use an in-memory one.
class MemoryStorage implements Storage {
  #data = new Map<string, string>();
  get length() {
    return this.#data.size;
  }
  clear() {
    this.#data.clear();
  }
  getItem(key: string) {
    return this.#data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.#data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.#data.delete(key);
  }
  setItem(key: string, value: string) {
    this.#data.set(key, String(value));
  }
}
for (const name of ["localStorage", "sessionStorage"] as const) {
  Object.defineProperty(globalThis, name, { value: new MemoryStorage(), configurable: true });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// jsdom lacks the modal dialog API; emulate just enough of it.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

// jsdom has no layout or media queries.
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

// jsdom has no canvas; the particle/ember effects bail out cleanly on a null context.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
