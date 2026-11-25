import { useState } from "react"
import { Avatar, Button, Chip, Stack, TableRow, TableCell } from "@mui/material"
import { Page, Panel, Form, Field, Empty, DataTable } from "../FormElements"
import { ClientSelect } from "../FormElements"
import { api } from "../../services/api"
import { initialClient } from "../../utils/initialState"
import { fullName } from "../../utils/helpers"

export default function Clients({ clients, agreements, run, busy }) {
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
        <TableCell><Stack direction="row" spacing={1} alignItems="center"><Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 13 }}>{(client.firstName || "?")[0]}{(client.lastName || "?")[0]}</Avatar><span>{fullName(client)}</span></Stack></TableCell>
        <TableCell>{client.company || "—"}</TableCell><TableCell>{client.email}<br />{client.phone}</TableCell>
        <TableCell>{clientAgreements.length ? <Chip size="small" color={signed === clientAgreements.length ? "success" : "warning"} label={`${signed}/${clientAgreements.length} signed`} /> : "No agreements"}</TableCell>
        <TableCell><Button onClick={() => { setEditing(client.id); setForm(Object.fromEntries(Object.keys(initialClient).map(key => [key, client[key] || ""]))) }}>Edit</Button></TableCell>
      </TableRow>})} />}
    </Panel>
  </Page>
}
