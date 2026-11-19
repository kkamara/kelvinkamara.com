import React, { useEffect, } from "react"
import { useDispatch, useSelector, } from "react-redux"
import ReactPaginate from "react-paginate"
import moment from "moment"
import { Helmet, } from "react-helmet-async"
import ErrorComponent from "../layouts/ErrorComponent"

export default function HomeComponent() {
  const dispatch = useDispatch()
  const state = useSelector(state => ({
    auth: state.auth,
  }))

  const parseDate = date => moment(date).format("YYYY-MM-DD HH:mm")

  if (state.auth.loading) {
    return <div className="container home-container text-center">
      <Helmet>
        <title>{"Home - " + import.meta.env.VITE_APP_NAME}</title>
      </Helmet>
      <p>Loading...</p>
    </div>
  }

  return (
    <div className="container home-container">
      <Helmet>
        <title>{"Home - " + import.meta.env.VITE_APP_NAME}</title>
      </Helmet>
      <ErrorComponent error={state.auth.error}/>
      <div className="text-center">
        <button className="btn btn-primary home-button">
          Test Button
        </button>
      </div>
    </div>
  )
}
