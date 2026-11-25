import { useState } from "react"
import { Button, Chip, Stack, TableRow, TableCell } from "@mui/material"
import { Page, Panel, Form, Field, Empty, DataTable, ClientSelect } from "../FormElements"
import { api, sendEmail } from "../../services/api"
import { initialInvoice } from "../../utils/initialState"
import { pence, money, fullName } from "../../utils/helpers"

export default function Invoices({ clients, invoices, run, busy, download }) {
  const [form, setForm] = useState(initialInvoice())
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
