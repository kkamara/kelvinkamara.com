import { cleanup, render, screen, waitForElementToBeRemoved, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import App, { pence } from "./App"

const api = vi.hoisted(() => ({
  interceptors: { request: { use: vi.fn() } },
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))
vi.mock("axios", () => ({ default: { create: () => api } }))

describe("GBP amount entry", () => {
  it("converts pounds and pence without floating-point rounding", () => {
    expect(pence("12.34")).toBe(1234)
    expect(pence("0.1")).toBe(10)
    expect(pence("21474836.47")).toBe(2147483647)
  })

  describe("agreement templates and deletion", () => {
    const template = { id: 2, title: "Initial website", body: "Website services" }
    const agreement = { id: 7, title: "Signed agreement", clientId: 1, firstName: "Ava", lastName: "Tester", signed: 1 }
    beforeEach(() => {
      vi.stubGlobal("localStorage", { getItem: vi.fn(() => "test-token"), removeItem: vi.fn() })
      window.history.pushState({}, "", "/admin/agreements")
      api.get.mockImplementation(path => Promise.resolve({ data: { data: ({
        "/admin/clients": [{ id: 1, firstName: "Ava", lastName: "Tester", email: "ava@example.test" }],
        "/admin/invoices": [],
        "/admin/agreements": [agreement],
        "/admin/agreement-templates": [template],
        "/admin/payments": [],
      })[path] } }))
      api.post.mockResolvedValue({})
      api.put.mockResolvedValue({})
      api.delete.mockResolvedValue({})
    })
    afterEach(() => {
      cleanup()
      vi.clearAllMocks()
      vi.unstubAllGlobals()
    })

    it("copies a saved template into an editable client agreement", async () => {
      const user = userEvent.setup()
      render(<App />)
      await screen.findByText("Website services")
      await user.click(screen.getByRole("combobox", { name: "Client" }))
      await user.click(screen.getByRole("option", { name: /Ava Tester/ }))
      await user.click(screen.getByRole("combobox", { name: "Start from a template (optional)" }))
      await user.click(screen.getByRole("option", { name: "Initial website" }))
      expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Initial website")
      const text = screen.getByRole("textbox", { name: "Agreement text" })
      expect(text).toHaveValue("Website services")
      await user.type(text, " tailored")
      await user.click(screen.getByRole("button", { name: "Create agreement" }))
      expect(api.post).toHaveBeenCalledWith("/admin/agreements", { clientId: "1", title: "Initial website", body: "Website services tailored" })
    })

    it("creates a reusable template and confirms template deletion", async () => {
      const user = userEvent.setup()
      render(<App />)
      await screen.findByText("Website services")
      await user.type(screen.getByRole("textbox", { name: "Template title" }), "Ongoing plan")
      await user.type(screen.getByRole("textbox", { name: "Template text" }), "Monthly support")
      await user.click(screen.getByRole("button", { name: "Create template" }))
      expect(api.post).toHaveBeenCalledWith("/admin/agreement-templates", { title: "Ongoing plan", body: "Monthly support" })
      await screen.findByText("Agreement template saved.")
      await user.click(screen.getByRole("button", { name: "Delete template Initial website" }))
      const dialog = screen.getByRole("dialog")
      expect(within(dialog).getByText(/Existing agreements will not be affected/)).toBeInTheDocument()
      await user.click(within(dialog).getByRole("button", { name: "Delete" }))
      expect(api.delete).toHaveBeenCalledWith("/admin/agreement-templates/2")
      await screen.findByText("Agreement template deleted.")
    })

    it("shows a PDF download error returned as a JSON blob", async () => {
      const user = userEvent.setup()
      const message = "This agreement contains characters that cannot be rendered in a PDF."
      const blob = new Blob([], { type: "application/json" })
      blob.text = async () => JSON.stringify({ message })
      const get = api.get.getMockImplementation()
      api.get.mockImplementation(path => path.endsWith("/document")
        ? Promise.reject({ response: { data: blob } })
        : get(path))
      render(<App />)
      await user.click(await screen.findByRole("button", { name: "PDF" }))
      expect(await screen.findByText(message)).toBeInTheDocument()
    })

    it("edits a template and confirms deletion without deleting on cancel or failure", async () => {
      const user = userEvent.setup()
      render(<App />)
      await user.click(await screen.findByRole("button", { name: "Edit template Initial website" }))
      const title = screen.getByRole("textbox", { name: "Template title" })
      await user.clear(title)
      await user.type(title, "Ongoing plan")
      await user.click(screen.getByRole("button", { name: "Save template" }))
      expect(api.put).toHaveBeenCalledWith("/admin/agreement-templates/2", { title: "Ongoing plan", body: "Website services" })
      await screen.findByText("Agreement template saved.")
      await user.click(screen.getByRole("button", { name: "Delete agreement Signed agreement" }))
      let dialog = screen.getByRole("dialog")
      expect(within(dialog).getByText(/signed status/)).toBeInTheDocument()
      expect(within(dialog).getByText(/Ava Tester/)).toBeInTheDocument()
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
      expect(api.delete).not.toHaveBeenCalled()
      await waitForElementToBeRemoved(() => screen.queryByRole("dialog"))
      api.delete.mockRejectedValueOnce(new Error("Delete failed"))
      await user.click(screen.getByRole("button", { name: "Delete agreement Signed agreement" }))
      dialog = screen.getByRole("dialog")
      await user.click(within(dialog).getByRole("button", { name: "Delete" }))
      expect(await within(dialog).findByText("Delete failed")).toBeInTheDocument()
      expect(screen.getByRole("dialog")).toBeInTheDocument()
      await user.click(within(dialog).getByRole("button", { name: "Delete" }))
      expect(api.delete).toHaveBeenLastCalledWith("/admin/agreements/7")
      expect(await screen.findByText("Agreement deleted.")).toBeInTheDocument()
      await waitForElementToBeRemoved(() => screen.queryByRole("dialog"))
    })
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
