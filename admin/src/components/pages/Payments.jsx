import { useState } from "react"
import { Button, MenuItem, Stack, TableRow, TableCell } from "@mui/material"
import { Page, Panel, Form, Field, Empty, DataTable, ClientSelect } from "../FormElements"
import { api, sendEmail } from "../../services/api"
import { initialPayment } from "../../utils/initialState"
import { pence, money, fullName } from "../../utils/helpers"

export default function Payments({ clients, invoices, payments, run, busy, download }) {
  const [form, setForm] = useState(initialPayment())
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
