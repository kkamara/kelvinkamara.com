import { Box, Paper, Typography } from "@mui/material"
import { Page, Panel } from "../FormElements"

export default function Dashboard({ clients, invoices, agreements, payments }) {
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
