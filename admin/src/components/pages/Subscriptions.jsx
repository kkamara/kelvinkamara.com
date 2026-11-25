import { useState, useEffect } from "react"
import { Alert, Button, Stack, TableRow, TableCell } from "@mui/material"
import { Page, Panel, Form, Field, Empty, DataTable, ClientSelect } from "../FormElements"
import { api } from "../../services/api"
import { errorMessage } from "../../utils/helpers"

export default function Subscriptions({ clients, run, busy }) {
  const [form, setForm] = useState({ clientId: "", serviceName: "" })
  const [selected, setSelected] = useState("")
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState(null)
  const set = key => value => setForm(current => ({ ...current, [key]: value }))
  useEffect(() => {
    if (!selected) return
    let active = true
    setResult(null)
    api.get(`/admin/clients/${selected}/subscriptions`)
      .then(response => { if (active) setResult({ clientId: selected, data: response.data.data }) })
      .catch(error => { if (active) setResult({ clientId: selected, error: errorMessage(error) }) })
    return () => { active = false }
  }, [selected, version])
  const current = result?.clientId === selected ? result : null
  return <Page title="Subscriptions" description="Record and manage ongoing service subscriptions for your clients.">
    <Panel title="Add a subscription" subtitle="Record a new active service subscription for a client.">
      <Form busy={busy} button="Add subscription" onSubmit={event => { event.preventDefault(); run(async () => {
        await api.post("/admin/subscriptions", form); setSelected(form.clientId); setVersion(value => value + 1); setForm({ clientId: "", serviceName: "" })
      }, "Subscription added.") }}>
        <ClientSelect clients={clients} value={form.clientId} onChange={set("clientId")} />
        <Field label="Service name" required value={form.serviceName} onChange={set("serviceName")} placeholder="e.g., Website Hosting, SEO Optimization" />
      </Form>
    </Panel>
    <Panel title="Active subscriptions" subtitle="View and manage subscriptions for each client.">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
        <ClientSelect clients={clients} value={selected} onChange={setSelected} />
      </Stack>
      {!selected ? <Empty>Select a client to view their subscriptions.</Empty> : !current ? <Empty>Loading subscriptions...</Empty> : current.error ? <Alert severity="error">{current.error} <Button onClick={() => setVersion(value => value + 1)}>Retry</Button></Alert> : !current.data.length ? <Empty>No subscriptions recorded for this client.</Empty> : <DataTable headers={["Service", "Start Date", "Status", "Action"]} rows={current.data.map(item => <TableRow key={item.id}>
        <TableCell>{item.serviceName}</TableCell><TableCell>{item.startDate?.split("T")[0]}</TableCell><TableCell>{item.isActive ? "Active" : "Ended"}</TableCell>
        <TableCell><Button size="small" disabled={busy} variant={item.isActive ? "outlined" : "contained"} onClick={() => run(
          async () => { await api.patch(`/admin/subscriptions/${item.id}`, { isActive: !item.isActive }); setVersion(value => value + 1) },
          item.isActive ? "Subscription ended." : "Subscription reactivated."
        )}>{item.isActive ? "End" : "Reactivate"}</Button></TableCell>
      </TableRow>)} />}
    </Panel>
  </Page>
}
