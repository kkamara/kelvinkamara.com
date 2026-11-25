import { useState, useEffect } from "react"
import { Button, Stack, TableRow, TableCell } from "@mui/material"
import { Page, Panel, Form, Field, Empty, DataTable, ClientSelect } from "../FormElements"
import { api } from "../../services/api"

export default function Subscriptions({ clients, run, busy }) {
  const [form, setForm] = useState({ clientId: "", serviceName: "" })
  const [subscriptions, setSubscriptions] = useState([])
  const [selected, setSelected] = useState("")
  const set = key => value => setForm(current => ({ ...current, [key]: value }))
  const fetchSubscriptions = async () => {
    if (!selected) return
    try {
      const response = await api.get(`/subscriptions/all/${selected}`)
      setSubscriptions(response.data.data || [])
    } catch (error) {
      setSubscriptions([])
    }
  }
  useEffect(() => { fetchSubscriptions() }, [selected, fetchSubscriptions])
  return <Page title="Subscriptions" description="Record and manage ongoing service subscriptions for your clients.">
    <Panel title="Add a subscription" subtitle="Record a new active service subscription for a client.">
      <Form busy={busy} button="Add subscription" onSubmit={event => { event.preventDefault(); run(async () => {
        await api.post("/subscriptions", { userId: form.clientId, serviceName: form.serviceName }); setForm({ clientId: "", serviceName: "" }); await fetchSubscriptions()
      }, "Subscription added.") }}>
        <ClientSelect clients={clients} value={form.clientId} onChange={set("clientId")} />
        <Field label="Service name" required value={form.serviceName} onChange={set("serviceName")} placeholder="e.g., Website Hosting, SEO Optimization" />
      </Form>
    </Panel>
    <Panel title="Active subscriptions" subtitle="View and manage subscriptions for each client.">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
        <ClientSelect clients={clients} value={selected} onChange={setSelected} />
      </Stack>
      {!selected ? <Empty>Select a client to view their subscriptions.</Empty> : !subscriptions.length ? <Empty>No subscriptions recorded for this client.</Empty> : <DataTable headers={["Service", "Start Date", "Status", "Action"]} rows={subscriptions.map(item => <TableRow key={item.id}>
        <TableCell>{item.serviceName}</TableCell><TableCell>{item.startDate?.split("T")[0]}</TableCell><TableCell>{item.isActive ? "Active" : "Ended"}</TableCell>
        <TableCell><Button size="small" variant={item.isActive ? "outlined" : "contained"} onClick={() => run(async () => {
          if (item.isActive) await api.put(`/subscriptions/${item.id}/end`, {}); else await api.put(`/subscriptions/${item.id}/reactivate`, {}); await fetchSubscriptions()
        }, item.isActive ? "Subscription ended." : "Subscription reactivated.")}>{item.isActive ? "End" : "Reactivate"}</Button></TableCell>
      </TableRow>)} />}
    </Panel>
  </Page>
}
