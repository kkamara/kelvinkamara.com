import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export function adminBaseRedirect() {
  const configure = server => {
    server.middlewares.use((req, res, next) => {
      if (req.url === "/admin" || req.url?.startsWith("/admin?")) {
        res.writeHead(308, { Location: `/admin/${req.url.slice("/admin".length)}` })
        res.end()
        return
      }
      next()
    })
  }
  return {
    name: "admin-base-redirect",
    configureServer: configure,
    configurePreviewServer: configure,
  }
}

export default defineConfig(() => {
  return {
    plugins: [adminBaseRedirect(), react()],
    base: "/admin/",
    server: {
      host: "0.0.0.0",
      port: 3000,
      proxy: {
        "/api": "http://127.0.0.1:8000",
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 3000,
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      include: ["src/**/*.test.{js,jsx}"],
    },
  }
})