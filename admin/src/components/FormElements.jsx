import { Box, Button, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material"
import { fullName } from "../utils/helpers"

export function Field({ label, value, onChange, ...props }) {
  return <TextField label={label} value={value} onChange={event => onChange(event.target.value)} fullWidth size="small" {...props} />
}

export function ClientSelect({ clients, value, onChange }) {
  return <Field select required label="Client" value={value} onChange={onChange}>
    {clients.map(client => <MenuItem key={client.id} value={String(client.id)}>{fullName(client)} — {client.email}</MenuItem>)}
  </Field>
}

export function Panel({ title, children, subtitle }) {
  return <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderColor: "#e1e7eb" }}>
    <Typography variant="h6">{title}</Typography>
    {subtitle && <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
    <Box sx={{ mt: 2 }}>{children}</Box>
  </Paper>
}

export function Empty({ children }) {
  return <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>{children}</Typography>
}

export function Page({ title, description, children }) {
  return <Stack spacing={3}>
    <Box><Typography variant="h4">{title}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{description}</Typography></Box>
    {children}
  </Stack>
}

export function Form({ children, onSubmit, button = "Save", busy }) {
  return <Box component="form" onSubmit={onSubmit}><Stack spacing={2}>{children}<Box><Button variant="contained" type="submit" disabled={busy}>{button}</Button></Box></Stack></Box>
}

export function DataTable({ headers, rows }) {
  return <TableContainer><Table size="small"><TableHead><TableRow>{headers.map((header, idx) => <TableCell key={idx}>{header}</TableCell>)}</TableRow></TableHead><TableBody>{rows}</TableBody></Table></TableContainer>
}
