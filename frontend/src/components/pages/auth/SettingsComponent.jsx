import React, {
  useEffect,
  useState,
  useRef,
} from "react"
import { Helmet, } from "react-helmet-async"
import { useSelector, useDispatch, } from "react-redux"

import ErrorComponent from "../../layouts/ErrorComponent"
import { updateSettings, } from "../../../redux/actions/updateUserSettingsActions"

import "./SettingsComponent.scss"

const defaultFirstNameState = ""
const defaultLastNameState = ""
const defaultEmailState = ""
const defaultPasswordState = ""
const defaultPasswordConfirmationState = ""

export default function SettingsComponent() {
  const state = useSelector(state => ({
    auth: state.auth,
    updateUserSettings: state.updateUserSettings,
  }))
  const dispatch = useDispatch()
  const [firstName, setFirstName] = useState(defaultFirstNameState)
  const [lastName, setLastName] = useState(defaultLastNameState)
  const [email, setEmail] = useState(defaultEmailState)
  const [password, setPassword] = useState(defaultPasswordState)
  const [passwordConfirmation, setPasswordConfirmation] = useState(defaultPasswordConfirmationState)

  const [error, setError] = useState("")

  useEffect(() => {
    setFirstName(state.auth.data.firstName)
    setLastName(state.auth.data.lastName)
    setEmail(state.auth.data.email)
  }, [])

  useEffect(() => {
    if (false === state.updateUserSettings.loading) {
      if (null !== state.updateUserSettings.error) {
        setError(state.updateUserSettings.error)
      }
      if (null !== state.updateUserSettings.data) {
        window.location.reload()
      }
    }
  }, [state.updateUserSettings])

  const handleFirstNameChange = e => {
    setFirstName(e.target.value)
  }

  const handleLastNameChange = e => {
    setLastName(e.target.value)
  }

  const handleEmailChange = e => {
    setEmail(e.target.value)
  }

  const handlePasswordChange = e => {
    setPassword(e.target.value)
  }

  const handlePasswordConfirmationChange = e => {
    setPasswordConfirmation(e.target.value)
  }

  const handleFormSubmit = e => {
    e.preventDefault()
    setError("")
    dispatch(updateSettings({
      firstName,
      lastName,
      email,
      password,
      passwordConfirmation,
    }))
  }
  
  if (state.auth.loading) {
    return <div className="container settings-container text-center">
      <Helmet>
        <title>{"User Settings - " + import.meta.env.VITE_APP_NAME}</title>
      </Helmet>
      <p>Loading...</p>
    </div>
  }

  return (
    <div className="container settings-container">
      <Helmet>
        <title>{"User Settings - " + import.meta.env.VITE_APP_NAME}</title>
      </Helmet>
      <div className="row">
        <div className="col-md-4 offset-md-4">
          <h1 className="fw-bold">User Settings</h1>

          <ErrorComponent error={error}/>

          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label htmlFor="firstName">
                First Name*:
              </label>
              <input
                type="text"
                className="form-control"
                id="firstName"
                value={firstName}
                onChange={handleFirstNameChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">
                Last Name*:
              </label>
              <input
                type="text"
                className="form-control"
                id="lastName"
                value={lastName}
                onChange={handleLastNameChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">
                Email*:
              </label>
              <input
                type="text"
                className="form-control"
                id="email"
                value={email}
                onChange={handleEmailChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">
                Password:
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={password}
                onChange={handlePasswordChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="passwordConfirmation">
                Password Confirmation:
              </label>
              <input
                type="password"
                className="form-control"
                id="passwordConfirmation"
                value={passwordConfirmation}
                onChange={handlePasswordConfirmationChange}
              />
            </div>
            <div className="float-end">
              <input
                type="submit"
                className="btn btn-success"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
