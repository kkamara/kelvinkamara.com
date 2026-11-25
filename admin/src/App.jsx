import { useCallback, useState } from "react"
import { BrowserRouter } from "react-router-dom"
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material"
import { api } from "./services/api"
import { errorMessage } from "./utils/helpers"
import Login from "./components/pages/Login"
import Workspace from "./components/Workspace"

const theme = createTheme({
  palette: { primary: { main: "#275e79" }, secondary: { main: "#d8a85f" }, background: { default: "#f4f6f8" } },
  shape: { borderRadius: 12 },
  typography: { fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', h4: { fontWeight: 700 }, h6: { fontWeight: 700 } },
})

export default function App() {
  const [signedIn, setSignedIn] = useState(Boolean(localStorage.getItem("user-token")))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  
  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem("user-token")) await api.delete("/user")
      localStorage.removeItem("user-token"); setSignedIn(false)
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("user-token"); setSignedIn(false)
      } else {
        setError("Could not sign out. Please try again.")
      }
    }
  }, [])
  
  const login = async (email, password) => {
    setBusy(true); setError("")
    try {
      const response = await api.post("/user", { email, password })
      localStorage.setItem("user-token", response.data.data.authToken)
      await api.get("/admin/clients")
      setSignedIn(true)
    } catch (err) {
      localStorage.removeItem("user-token")
      setError(errorMessage(err))
    } finally { setBusy(false) }
  }
  
  return <ThemeProvider theme={theme}>
    <CssBaseline />
    <BrowserRouter basename="/admin">
      {signedIn ? <Workspace onLogout={logout} /> : <Login onLogin={login} busy={busy} error={error} />}
    </BrowserRouter>
  </ThemeProvider>
}
