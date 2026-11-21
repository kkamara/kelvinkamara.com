// @vitest-environment node
import { adminBaseRedirect } from "../vite.config"

describe.each(["configureServer", "configurePreviewServer"])("%s", hook => {
  const middleware = () => {
    const use = vi.fn()
    adminBaseRedirect()[hook]({ middlewares: { use } })
    return use.mock.calls[0][0]
  }

  it.each([
    ["/admin", "/admin/"],
    ["/admin?return=%2Finvoices", "/admin/?return=%2Finvoices"],
  ])("redirects %s to %s", (url, location) => {
    const res = { writeHead: vi.fn(), end: vi.fn() }
    const next = vi.fn()
    middleware()({ url }, res, next)
    expect(res.writeHead).toHaveBeenCalledWith(308, { Location: location })
    expect(res.end).toHaveBeenCalledOnce()
    expect(next).not.toHaveBeenCalled()
  })

  it.each(["/admin/", "/admin/invoices", "/administrator"])("does not redirect %s", url => {
    const res = { writeHead: vi.fn(), end: vi.fn() }
    const next = vi.fn()
    middleware()({ url }, res, next)
    expect(next).toHaveBeenCalledOnce()
    expect(res.writeHead).not.toHaveBeenCalled()
  })
})
