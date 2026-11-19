import { combineReducers, } from "redux"
import authReducer from "./authReducer"
import updateUserSettingsReducer from "./updateUserSettingsReducer"

export default combineReducers({
  auth: authReducer,
  updateUserSettings: updateUserSettingsReducer,
})
