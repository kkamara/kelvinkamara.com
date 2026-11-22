import { useCallback, useEffect, useState } from "react"
import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom"
import axios from "axios"
import {
  Alert, AppBar, Avatar, Box, Button, Checkbox, Chip, CircularProgress, Container,
  CssBaseline, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, MenuItem, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, ThemeProvider, Toolbar,
  Typography, createTheme,
} from "@mui/material"

const theme = createTheme({
  palette: { primary: { main: "#275e79" }, secondary: { main: "#d8a85f" }, background: { default: "#f4f6f8" } },
  shape: { borderRadius: 12 },
  typography: { fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', h4: { fontWeight: 700 }, h6: { fontWeight: 700 } },
})
const api = axios.create({ baseURL: "/api/v1/web", timeout: 30000 })
const sendEmail = async (path, data) => {
  try {
    return await api.post(path, data, { timeout: 60000 })
  } catch (error) {
    if (!error.response) throw new Error("Email delivery could not be confirmed. Check delivery before retrying; another copy may be sent.")
    throw error
  }
}
api.interceptors.request.use(config => {
  const token = localStorage.getItem("user-token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
const errorMessage = error => error.response?.data?.message || "The request failed. Please try again."
const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
const money = amount => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount / 100)
const fullName = item => `${item.firstName} ${item.lastName}`
const initialClient = { firstName: "", lastName: "", email: "", company: "", phone: "", notes: "" }
const initialInvoice = () => ({ clientId: "", description: "", amount: "", dueDate: today(), paymentInstructions: "", paymentLink: "" })
const initialAgreement = { clientId: "", title: "", body: "" }
const initialAgreementTemplate = { title: "", body: "" }
const initialPayment = () => ({ clientId: "", invoiceId: "", amount: "", paidDate: today(), method: "", details: "" })

export function pence(value) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("Enter a valid GBP amount with at most two decimal places.")
  const [whole, fraction = ""] = value.split(".")
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
  if (!Number.isSafeInteger(result) || result < 1 || result > 2147483647) throw new Error("Enter an amount between £0.01 and £21,474,836.47.")
  return result
}

function Field({ label, value, onChange, ...props }) {
  return <TextField label={label} value={value} onChange={event => onChange(event.target.value)} fullWidth size="small" {...props} />
}
function ClientSelect({ clients, value, onChange }) {
  return <Field select required label="Client" value={value} onChange={onChange}>
    {clients.map(client => <MenuItem key={client.id} value={String(client.id)}>{fullName(client)} — {client.email}</MenuItem>)}
  </Field>
}
function Panel({ title, children, subtitle }) {
  return <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderColor: "#e1e7eb" }}>
    <Typography variant="h6">{title}</Typography>
    {subtitle && <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
    <Box sx={{ mt: 2 }}>{children}</Box>
  </Paper>
}
function Empty({ children }) {
  return <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>{children}</Typography>
}
function Page({ title, description, children }) {
  return <Stack spacing={3}>
    <Box><Typography variant="h4">{title}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{description}</Typography></Box>
    {children}
  </Stack>
}
function Form({ children, onSubmit, button = "Save", busy }) {
  return <Box component="form" onSubmit={onSubmit}><Stack spacing={2}>{children}<Box><Button variant="contained" type="submit" disabled={busy}>{button}</Button></Box></Stack></Box>
}
function DataTable({ headers, rows }) {
  return <TableContainer><Table size="small"><TableHead><TableRow>{headers.map(header => <TableCell key={header}>{header}</TableCell>)}</TableRow></TableHead><TableBody>{rows}</TableBody></Table></TableContainer>
}

function Login({ onLogin, busy, error }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  return <Container maxWidth="xs" sx={{ py: 10 }}>
    <Box sx={{ mb: 3 }}><Typography color="primary" fontWeight={700}>KEL KAMARA</Typography><Typography variant="h4" sx={{ mt: 1 }}>Welcome back</Typography><Typography color="text.secondary">Sign in to your private workspace.</Typography></Box>
    <Panel title="Admin sign in">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Form busy={busy} button="Sign in" onSubmit={event => { event.preventDefault(); onLogin(email, password) }}>
        <Field label="Email" type="email" autoComplete="username" required value={email} onChange={setEmail} />
        <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={setPassword} />
      </Form>
    </Panel>
  </Container>
}
function Dashboard({ clients, invoices, agreements, payments }) {
  const cards = [["Clients", clients.length], ["Invoices", invoices.length], ["Agreements awaiting signature", agreements.filter(item => !item.signed).length], ["Payments recorded", payments.length]]
  return <Page title="Overview" description="Your client work, invoices and records in one place.">
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
      {cards.map(([label, value]) => <Paper key={label} variant="outlined" sx={{ p: 2.5 }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h4" sx={{ mt: 1 }}>{value}</Typography></Paper>)}
    </Box>
    <Panel title="Your workspace" subtitle="A quick guide to the essentials.">
      <Typography color="text.secondary">Add a client, create an invoice or service agreement, then send it directly by email. Record payments when they arrive, and use Actions for welcome messages and project updates.</Typography>
    </Panel>
  </Page>
}
function Clients({ clients, agreements, run, busy }) {
  const [form, setForm] = useState(initialClient)
  const [editing, setEditing] = useState(null)
  const set = key => value => setForm(current => ({ ...current, [key]: value }))
  const save = event => {
    event.preventDefault()
    run(async () => {
      if (editing) await api.put(`/admin/clients/${editing}`, form)
      else await api.post("/admin/clients", form)
      setForm(initialClient); setEditing(null)
    }, "Client saved.")
  }
  return <Page title="Clients" description="Keep the people and businesses you work with close at hand.">
    <Panel title={editing ? "Edit client" : "Add a client"}>
      <Form onSubmit={save} busy={busy}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Field label="First name" required value={form.firstName} onChange={set("firstName")} />
          <Field label="Last name" required value={form.lastName} onChange={set("lastName")} />
        </Stack>
        <Field label="Email" type="email" required value={form.email} onChange={set("email")} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><Field label="Company" value={form.company} onChange={set("company")} /><Field label="Phone" value={form.phone} onChange={set("phone")} /></Stack>
        <Field label="Notes" multiline minRows={2} value={form.notes} onChange={set("notes")} />
        {editing && <Button onClick={() => { setEditing(null); setForm(initialClient) }}>Cancel editing</Button>}
      </Form>
    </Panel>
    <Panel title="Client directory" subtitle={`${clients.length} saved clients`}>
      {!clients.length ? <Empty>No clients yet.</Empty> : <DataTable headers={["Client", "Company", "Contact", "Agreements", ""]} rows={clients.map(client => {
        const clientAgreements = agreements.filter(item => item.clientId === client.id)
        const signed = clientAgreements.filter(item => item.signed).length
        return <TableRow key={client.id}>
        <TableCell><Stack direction="row" spacing={1} alignItems="center"><Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 13 }}>{client.firstName[0]}{client.lastName[0]}</Avatar><span>{fullName(client)}</span></Stack></TableCell>
        <TableCell>{client.company || "—"}</TableCell><TableCell>{client.email}<br />{client.phone}</TableCell>
        <TableCell>{clientAgreements.length ? <Chip size="small" color={signed === clientAgreements.length ? "success" : "warning"} label={`${signed}/${clientAgreements.length} signed`} /> : "No agreements"}</TableCell>
        <TableCell><Button onClick={() => { setEditing(client.id); setForm(Object.fromEntries(Object.keys(initialClient).map(key => [key, client[key] || ""]))) }}>Edit</Button></TableCell>
      </TableRow>})} />}
    </Panel>
  </Page>
}
function Invoices({ clients, invoices, run, busy, download }) {
  const [form, setForm] = useState(initialInvoice)
  const set = key => value => setForm(current => ({ ...current, [key]: value }))
  return <Page title="Invoices" description="Create an invoice and send a PDF directly to your client.">
    <Panel title="Create invoice" subtitle="Payment instructions and an online payment link are optional.">
      <Form busy={busy} button="Create invoice" onSubmit={event => { event.preventDefault(); run(async () => {
        await api.post("/admin/invoices", { ...form, amountPence: pence(form.amount) }); setForm(initialInvoice())
      }, "Invoice created.") }}>
        <ClientSelect clients={clients} value={form.clientId} onChange={set("clientId")} />
        <Field label="What is this invoice for?" required multiline minRows={2} value={form.description} onChange={set("description")} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><Field label="Amount (GBP)" required value={form.amount} onChange={set("amount")} /><Field label="Due date" type="date" required slotProps={{ inputLabel: { shrink: true } }} value={form.dueDate} onChange={set("dueDate")} /></Stack>
        <Field label="Payment instructions" multiline minRows={2} value={form.paymentInstructions} onChange={set("paymentInstructions")} />
        <Field label="Optional HTTPS payment link" type="url" value={form.paymentLink} onChange={set("paymentLink")} />
      </Form>
    </Panel>
    <Panel title="Invoices" subtitle="Optional Stripe links are single-use. Record payments manually and deactivate a Stripe link in Stripe if a client pays another way.">
      {!invoices.length ? <Empty>No invoices yet.</Empty> : <DataTable headers={["Invoice", "Client", "Amount", "Due", "Actions"]} rows={invoices.map(item => <TableRow key={item.id}>
        <TableCell>#{item.id}<br />{item.description}</TableCell><TableCell>{fullName(item)}</TableCell><TableCell>{money(item.amountPence)}</TableCell><TableCell>{item.dueDate}</TableCell>
        <TableCell><Button disabled={busy} onClick={() => download(`/admin/invoices/${item.id}/document`, `invoice-${item.id}.pdf`)}>PDF</Button><Button disabled={busy} onClick={() => run(() => sendEmail(`/admin/invoices/${item.id}/email`), "Invoice email sent.")}>Email</Button>{item.paymentLink ? <Chip size="small" label="Payment link added" /> : <Button disabled={busy} onClick={() => run(() => api.post(`/admin/invoices/${item.id}/stripe-link`), "Stripe payment link created.")}>Create Stripe link</Button>}</TableCell>
      </TableRow>)} />}
    </Panel>
  </Page>
}
function Agreements({ clients, agreements, agreementTemplates, run, busy, download }) {
  const [form, setForm] = useState(initialAgreement)
  const [templateId, setTemplateId] = useState("")
  const [templateForm, setTemplateForm] = useState(initialAgreementTemplate)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState("")
  const set = key => value => setForm(current => ({ ...current, [key]: value }))
  const setTemplate = key => value => setTemplateForm(current => ({ ...current, [key]: value }))
  const resetTemplate = () => { setTemplateForm(initialAgreementTemplate); setEditingTemplate(null) }
  const chooseTemplate = value => {
    setTemplateId(value)
    const template = agreementTemplates.find(item => String(item.id) === value)
    if (template) setForm(current => ({ ...current, title: template.title, body: template.body }))
  }
  const deleteSelected = () => run(async () => {
    const isTemplate = deleteTarget.kind === "template"
    setDeleteError("")
    try {
      await api.delete(`/admin/${isTemplate ? "agreement-templates" : "agreements"}/${deleteTarget.id}`)
    } catch (error) {
      setDeleteError(error.response ? errorMessage(error) : error.message || errorMessage(error))
      throw error
    }
    if (isTemplate && editingTemplate === deleteTarget.id) resetTemplate()
    if (isTemplate && templateId === String(deleteTarget.id)) setTemplateId("")
    setDeleteTarget(null)
  }, deleteTarget.kind === "template" ? "Agreement template deleted." : "Agreement deleted.")
  return <Page title="Service agreements" description="Prepare an agreement for your client to sign and return.">
    <Panel title="Create agreement" subtitle="Enter your own terms. PDFs support Western European characters; signing and verification happen outside this app.">
      <Form busy={busy} button="Create agreement" onSubmit={event => { event.preventDefault(); run(async () => { await api.post("/admin/agreements", form); setForm(initialAgreement); setTemplateId("") }, "Agreement created.") }}>
        <ClientSelect clients={clients} value={form.clientId} onChange={set("clientId")} />
        <Field select label="Start from a template (optional)" value={templateId} onChange={chooseTemplate} helperText="Selecting a template replaces the title and text below.">
          <MenuItem value="">No template</MenuItem>
          {agreementTemplates.map(item => <MenuItem key={item.id} value={String(item.id)}>{item.title}</MenuItem>)}
        </Field>
        <Field label="Title" required value={form.title} onChange={set("title")} />
        <Field label="Agreement text" required multiline minRows={7} value={form.body} onChange={set("body")} />
      </Form>
    </Panel>
    <Panel title="Agreements" subtitle="Only mark an agreement signed after you have received and verified it.">
      {!agreements.length ? <Empty>No agreements yet.</Empty> : <DataTable headers={["Agreement", "Client", "Signed", "Actions"]} rows={agreements.map(item => <TableRow key={item.id}>
        <TableCell>{item.title}</TableCell><TableCell>{fullName(item)}</TableCell>
        <TableCell><FormControlLabel label={item.signed ? "Signed" : "Not signed"} control={<Checkbox checked={Boolean(item.signed)} disabled={busy} onChange={event => run(() => api.patch(`/admin/agreements/${item.id}`, { signed: event.target.checked }), "Agreement status updated.")} />} /></TableCell>
        <TableCell><Button disabled={busy} onClick={() => download(`/admin/agreements/${item.id}/document`, `agreement-${item.id}.pdf`)}>PDF</Button><Button disabled={busy} onClick={() => run(() => sendEmail(`/admin/agreements/${item.id}/email`), "Agreement email sent.")}>Email</Button><Button color="error" disabled={busy} aria-label={`Delete agreement ${item.title}`} onClick={() => { setDeleteError(""); setDeleteTarget({ kind: "agreement", id: item.id, title: item.title, client: fullName(item) }) }}>Delete</Button></TableCell>
      </TableRow>)} />}
    </Panel>
    <Panel title={editingTemplate ? "Edit agreement template" : "Create agreement template"} subtitle="Save reusable terms, such as initial website work or an ongoing monthly or yearly plan.">
      <Form busy={busy} button={editingTemplate ? "Save template" : "Create template"} onSubmit={event => { event.preventDefault(); run(async () => {
        if (editingTemplate) await api.put(`/admin/agreement-templates/${editingTemplate}`, templateForm)
        else await api.post("/admin/agreement-templates", templateForm)
        resetTemplate()
      }, "Agreement template saved.") }}>
        <Field label="Template title" required value={templateForm.title} onChange={setTemplate("title")} />
        <Field label="Template text" required multiline minRows={7} value={templateForm.body} onChange={setTemplate("body")} />
        {editingTemplate && <Button disabled={busy} onClick={resetTemplate}>Cancel editing</Button>}
      </Form>
    </Panel>
    <Panel title="Agreement templates" subtitle="Changes to templates do not affect agreements already created.">
      {!agreementTemplates.length ? <Empty>No templates yet.</Empty> : <DataTable headers={["Title", "Text", "Actions"]} rows={agreementTemplates.map(item => <TableRow key={item.id}>
        <TableCell>{item.title}</TableCell><TableCell sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.body}</TableCell>
        <TableCell><Button disabled={busy} aria-label={`Edit template ${item.title}`} onClick={() => { setEditingTemplate(item.id); setTemplateForm({ title: item.title, body: item.body }) }}>Edit</Button><Button color="error" disabled={busy} aria-label={`Delete template ${item.title}`} onClick={() => { setDeleteError(""); setDeleteTarget({ kind: "template", id: item.id, title: item.title }) }}>Delete</Button></TableCell>
      </TableRow>)} />}
    </Panel>
    <Dialog open={Boolean(deleteTarget)} onClose={() => { if (!busy) setDeleteTarget(null) }} aria-labelledby="delete-agreement-title">
      <DialogTitle id="delete-agreement-title">Delete {deleteTarget?.kind === "template" ? "template" : "agreement"}?</DialogTitle>
      <DialogContent><DialogContentText>
        {deleteTarget?.kind === "template"
          ? `Delete template #${deleteTarget.id}, "${deleteTarget.title}"? Existing agreements will not be affected.`
          : `Delete agreement #${deleteTarget?.id}, "${deleteTarget?.title}", for ${deleteTarget?.client} and its signed status? This cannot be undone and will not recall emails already sent.`}
      </DialogContentText>{deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}</DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setDeleteTarget(null)}>Cancel</Button><Button color="error" disabled={busy} onClick={deleteSelected}>Delete</Button></DialogActions>
    </Dialog>
  </Page>
}
function Payments({ clients, invoices, payments, run, busy, download }) {
  const [form, setForm] = useState(initialPayment)
  const [selected, setSelected] = useState("")
  const set = key => value => setForm(current => ({ ...current, [key]: value, ...(key === "clientId" ? { invoiceId: "" } : {}) }))
  return <Page title="Payments" description="Manually record payments received by any method.">
    <Panel title="Record a payment" subtitle="If the invoice has a Stripe link and payment was made another way, deactivate the link in Stripe to prevent a duplicate payment.">
      <Form busy={busy} button="Record payment" onSubmit={event => { event.preventDefault(); run(async () => {
        await api.post("/admin/payments", { ...form, amountPence: pence(form.amount) }); setForm(initialPayment())
      }, "Payment recorded.") }}>
        <ClientSelect clients={clients} value={form.clientId} onChange={set("clientId")} />
        <Field select label="Related invoice (optional)" value={form.invoiceId} onChange={set("invoiceId")}>
          <MenuItem value="">None</MenuItem>{invoices.filter(item => String(item.clientId) === form.clientId).map(item => <MenuItem key={item.id} value={String(item.id)}>#{item.id} — {money(item.amountPence)}</MenuItem>)}
        </Field>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><Field label="Amount (GBP)" required value={form.amount} onChange={set("amount")} /><Field label="Payment date" type="date" required slotProps={{ inputLabel: { shrink: true } }} value={form.paidDate} onChange={set("paidDate")} /></Stack>
        <Field label="Payment method" required value={form.method} onChange={set("method")} />
        <Field label="Details" multiline minRows={2} value={form.details} onChange={set("details")} />
      </Form>
    </Panel>
    <Panel title="Payment history" subtitle="Export or email the records for one client.">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
        <ClientSelect clients={clients} value={selected} onChange={setSelected} />
        <Button disabled={!selected || busy} onClick={() => download(`/admin/clients/${selected}/payments.csv`, `payments-${selected}.csv`)}>Export CSV</Button>
        <Button disabled={!selected || busy} onClick={() => run(() => sendEmail(`/admin/clients/${selected}/payments/email`), "Payment history email sent.")}>Email CSV</Button>
      </Stack>
      {!payments.length ? <Empty>No payments recorded yet.</Empty> : <DataTable headers={["Client", "Date", "Amount", "Method", "Details"]} rows={payments.filter(item => !selected || String(item.clientId) === selected).map(item => <TableRow key={item.id}>
        <TableCell>{fullName(item)}</TableCell><TableCell>{item.paidDate}</TableCell><TableCell>{money(item.amountPence)}</TableCell><TableCell>{item.method}</TableCell><TableCell>{item.details}{item.invoiceId ? ` (Invoice #${item.invoiceId})` : ""}</TableCell>
      </TableRow>)} />}
    </Panel>
  </Page>
}
function Actions({ clients, run, busy }) {
  const [clientId, setClientId] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const welcome = () => { setSubject("Welcome to working with Kel Kamara"); setMessage("Welcome! Thank you for choosing me as your service provider. I look forward to working with you on your project.") }
  return <Page title="Actions" description="Send a welcome message, project update or payment reminder.">
    <Panel title="Email a client" subtitle="Messages are sent to the saved email address for the selected client.">
      <Form busy={busy} button="Send email" onSubmit={event => { event.preventDefault(); run(async () => {
        await sendEmail(`/admin/clients/${clientId}/email`, { subject, message }); setSubject(""); setMessage("")
      }, "Email sent.") }}>
        <ClientSelect clients={clients} value={clientId} onChange={setClientId} />
        <Box><Button variant="outlined" onClick={welcome}>Use welcome message</Button></Box>
        <Field label="Subject" required value={subject} onChange={setSubject} />
        <Field label="Message" required multiline minRows={6} value={message} onChange={setMessage} />
      </Form>
    </Panel>
  </Page>
}
function Workspace({ onLogout }) {
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
            {[["/", "Overview"], ["/clients", "Clients"], ["/invoices", "Invoices"], ["/agreements", "Agreements"], ["/payments", "Payments"], ["/actions", "Actions"]].map(([path, label]) =>
              <Button key={path} component={NavLink} to={path} end={path === "/"} sx={{ justifyContent: "flex-start", color: "text.secondary", "&.active": { bgcolor: "#eaf2f6", color: "primary.main", fontWeight: 700 } }}>{label}</Button>)}
          </Stack>
        </Paper>
        <Box sx={{ minWidth: 0, width: "100%" }}>
          {notice && <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={{ mb: 2 }}>{notice.text}</Alert>}
          {loading ? <CircularProgress /> : !loaded ? <Button variant="outlined" onClick={load}>Retry loading</Button> : <Routes>
            <Route path="/" element={<Dashboard {...props} />} /><Route path="/clients" element={<Clients {...props} />} />
            <Route path="/invoices" element={<Invoices {...props} />} /><Route path="/agreements" element={<Agreements {...props} />} />
            <Route path="/payments" element={<Payments {...props} />} /><Route path="/actions" element={<Actions {...props} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>}
        </Box>
      </Stack>
    </Container>
  </>
}
function App() {
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
  return <ThemeProvider theme={theme}><CssBaseline /><BrowserRouter basename="/admin">
    {signedIn ? <>{error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}<Workspace onLogout={logout} /></> : <Login onLogin={login} busy={busy} error={error} />}
  </BrowserRouter></ThemeProvider>
}
export default App
