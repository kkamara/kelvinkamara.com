import { useState } from "react"
import { Alert, Box, Container, Typography } from "@mui/material"
import { Panel, Form, Field } from "../FormElements"

export default function Login({ onLogin, busy, error }) {
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
