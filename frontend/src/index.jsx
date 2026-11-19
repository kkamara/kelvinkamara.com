import React from "react"
import { createRoot, } from "react-dom/client"
import { Provider } from "react-redux"
import { HelmetProvider } from 'react-helmet-async';

import App from "./App"
import store from "./redux/store"

import "./index.scss"

import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap/dist/js/bootstrap.bundle.min"

import "./zephyr_bootstrap.css"

const container = document.getElementById("app")
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </Provider>
  </React.StrictMode>
)