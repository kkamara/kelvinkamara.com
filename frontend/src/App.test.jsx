import { render, screen } from "@testing-library/react"
import App, { pence } from "./App"

const api = vi.hoisted(() => ({
  interceptors: { request: { use: vi.fn() } },
  get: vi.fn(),
}))
vi.mock("axios", () => ({ default: { create: () => api } }))

describe("GBP amount entry", () => {
  it("converts pounds and pence without floating-point rounding", () => {
    expect(pence("12.34")).toBe(1234)
    expect(pence("0.1")).toBe(10)
    expect(pence("21474836.47")).toBe(2147483647)
  })

  it("does not display empty records when the initial load fails", async () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => "test-token"), removeItem: vi.fn() })
    api.get.mockRejectedValue(new Error("Network error"))
    try {
      window.history.pushState({}, "", "/admin")
      render(<App />)
      expect(await screen.findByRole("button", { name: "Retry loading" })).toBeInTheDocument()
      expect(screen.queryByText("No clients yet.")).not.toBeInTheDocument()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("rejects zero, excessive precision and amounts outside the supported range", () => {
    for (const value of ["0", "1.001", "-1", "21474836.48", "not a number"]) {
      expect(() => pence(value)).toThrow()
    }
  })
})
