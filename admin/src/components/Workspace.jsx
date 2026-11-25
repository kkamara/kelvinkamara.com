import { useCallback, useEffect, useState } from "react"
import { Alert, AppBar, Avatar, Box, Button, CircularProgress, Container, Paper, Stack, Toolbar, Typography } from "@mui/material"
import { NavLink, Navigate, Route, Routes } from "react-router-dom"
import { api } from "../services/api"
import { errorMessage } from "../utils/helpers"
import Dashboard from "./pages/Dashboard"
import Clients from "./pages/Clients"
import Invoices from "./pages/Invoices"
import Agreements from "./pages/Agreements"
import Payments from "./pages/Payments"
import Subscriptions from "./pages/Subscriptions"
import Actions from "./pages/Actions"

export default function Workspace({ onLogout }) {
  const [data, setData] = useState({ clients: [], invoices: [], agreements: [], agreementTemplates: [], payments: [] })
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const refresh = useCallback(async () => {
    const resources = [["clients", "clients"], ["invoices", "invoices"], ["agreements", "agreements"], ["agreementTemplates", "agreement-templates"], ["payments", "payments"]]
    const responses = await Promise.all(resources.map(([, path]) => api.get(`/admin/${path}`)))
    setData(Object.fromEntries(resources.map(([name], index) => [name, responses[index].data.data])))
    setLoaded(true)
  }, [])
  const load = useCallback(() => {
    setLoading(true)
    setNotice(null)
    refresh().catch(error => {
      if (error.response?.status === 401 || error.response?.status === 403) onLogout()
      else setNotice({ severity: "error", text: errorMessage(error) })
    }).finally(() => setLoading(false))
  }, [refresh, onLogout])
  useEffect(() => { load() }, [load])
  const run = async (operation, success) => {
    setBusy(true); setNotice(null)
    try {
      await operation()
      try {
        await refresh()
        setNotice({ severity: "success", text: success })
      } catch {
        setLoaded(false)
        setNotice({ severity: "warning", text: `${success} The list could not be refreshed; retry loading before continuing.` })
      }
    }
    catch (error) { setNotice({ severity: "error", text: error.response ? errorMessage(error) : error.message || errorMessage(error) }) }
    finally { setBusy(false) }
  }
  const download = (path, filename) => run(async () => {
    let response
    try {
      response = await api.get(path, { responseType: "blob" })
    } catch (error) {
      if (error.response?.data instanceof Blob && error.response.data.type.includes("application/json")) {
        try {
          error.response.data = JSON.parse(await error.response.data.text())
        } catch {
          // Keep the original error when the response is not valid JSON.
        }
      }
      throw error
    }
    const url = URL.createObjectURL(response.data)
    const link = document.createElement("a")
    link.href = url; link.download = filename; link.click()
    URL.revokeObjectURL(url)
  }, "Download ready.")
  const props = { ...data, run, busy, download }
  return <>
    <AppBar position="static" elevation={0} sx={{ bgcolor: "#172b4d" }}><Toolbar sx={{ gap: 2, flexWrap: "wrap", py: 1 }}>
      <Box sx={{ flexGrow: 1 }}><Typography variant="subtitle1" fontWeight={700}>Kel Kamara</Typography><Typography variant="caption" sx={{ opacity: 0.75 }}>CLIENT WORKSPACE</Typography></Box>
      <Avatar sx={{ bgcolor: "#54728a", width: 34, height: 34, fontSize: 13 }}>KK</Avatar><Button color="inherit" onClick={onLogout}>Sign out</Button>
    </Toolbar></AppBar>
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">
        <Paper variant="outlined" sx={{ p: 1, width: { xs: "100%", md: 200 }, flexShrink: 0 }}>
          <Stack direction={{ xs: "row", md: "column" }} flexWrap="wrap">
            {[["/", "Overview"], ["/clients", "Clients"], ["/invoices", "Invoices"], ["/agreements", "Agreements"], ["/payments", "Payments"], ["/subscriptions", "Subscriptions"], ["/actions", "Actions"]].map(([path, label]) =>
              <Button key={path} component={NavLink} to={path} end={path === "/"} sx={{ justifyContent: "flex-start", color: "text.secondary", "&.active": { bgcolor: "#eaf2f6", color: "primary.main", fontWeight: 700 } }}>{label}</Button>)}
          </Stack>
        </Paper>
        <Box sx={{ minWidth: 0, width: "100%" }}>
          {notice && <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={{ mb: 2 }}>{notice.text}</Alert>}
          {loading ? <CircularProgress /> : !loaded ? <Button variant="outlined" onClick={load}>Retry loading</Button> : <Routes>
            <Route path="/" element={<Dashboard {...props} />} /><Route path="/clients" element={<Clients {...props} />} />
            <Route path="/invoices" element={<Invoices {...props} />} /><Route path="/agreements" element={<Agreements {...props} />} />
            <Route path="/payments" element={<Payments {...props} />} /><Route path="/subscriptions" element={<Subscriptions {...props} />} />
            <Route path="/actions" element={<Actions {...props} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>}
        </Box>
      </Stack>
    </Container>
  </>
}
