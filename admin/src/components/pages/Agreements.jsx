import { useState } from "react"
import { Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, MenuItem, TableRow, TableCell } from "@mui/material"
import { Page, Panel, Form, Field, Empty, DataTable, ClientSelect } from "../FormElements"
import { api, sendEmail } from "../../services/api"
import { initialAgreement, initialAgreementTemplate } from "../../utils/initialState"
import { fullName, errorMessage } from "../../utils/helpers"

export default function Agreements({ clients, agreements, agreementTemplates, run, busy, download }) {
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
