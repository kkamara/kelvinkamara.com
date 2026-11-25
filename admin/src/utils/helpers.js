export const pence = (value) => {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("Enter a valid GBP amount with at most two decimal places.")
  const [whole, fraction = ""] = value.split(".")
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
  if (!Number.isSafeInteger(result) || result < 1 || result > 2147483647) throw new Error("Enter an amount between £0.01 and £21,474,836.47.")
  return result
}

export const money = amount => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount / 100)

export const fullName = item => `${item.firstName} ${item.lastName}`

export const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export const errorMessage = error => error.response?.data?.message || "The request failed. Please try again."
