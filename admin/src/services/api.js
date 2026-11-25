import axios from "axios"

export const api = axios.create({ baseURL: "/api/v1/web", timeout: 30000 })

api.interceptors.request.use(config => {
  const token = localStorage.getItem("user-token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const sendEmail = async (path, data) => {
  try {
    return await api.post(path, data, { timeout: 60000 })
  } catch (error) {
    if (!error.response) throw new Error("Email delivery could not be confirmed. Check delivery before retrying; another copy may be sent.")
    throw error
  }
}
