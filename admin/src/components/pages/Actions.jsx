import { useState } from "react"
import { Box, Button } from "@mui/material"
import { Page, Panel, Form, Field, ClientSelect } from "../FormElements"
import { sendEmail } from "../../services/api"

export default function Actions({ clients, run, busy }) {
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
