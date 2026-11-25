export const initialClient = { firstName: "", lastName: "", email: "", company: "", phone: "", notes: "" }
export const initialInvoice = () => ({ clientId: "", description: "", amount: "", dueDate: today(), paymentInstructions: "", paymentLink: "" })
export const initialAgreement = { clientId: "", title: "", body: "" }
export const initialAgreementTemplate = { title: "", body: "" }
export const initialPayment = () => ({ clientId: "", invoiceId: "", amount: "", paidDate: today(), method: "", details: "" })

function today() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
