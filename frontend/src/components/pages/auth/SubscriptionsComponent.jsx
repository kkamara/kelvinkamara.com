import React, { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Helmet } from "react-helmet-async"

import {
  getActiveSubscriptionsService,
  getAllSubscriptionsService,
  addSubscriptionService,
  endSubscriptionService,
  reactivateSubscriptionService,
  deleteSubscriptionService,
} from "../../../services/SubscriptionService"
import ErrorComponent from "../../layouts/ErrorComponent"

import "./SubscriptionsComponent.scss"

export default function SubscriptionsComponent() {
  const auth = useSelector((state) => state.auth)
  const [subscriptions, setSubscriptions] = useState([])
  const [activeOnly, setActiveOnly] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [serviceName, setServiceName] = useState("")
  const [addingSubscription, setAddingSubscription] = useState(false)

  const userId = auth?.data?.id

  const loadSubscriptions = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError("")

      const response = activeOnly
        ? await getActiveSubscriptionsService(userId)
        : await getAllSubscriptionsService(userId)

      if (response.success) {
        setSubscriptions(response.data)
      } else {
        setError(response.message || "Failed to load subscriptions")
      }
    } catch (err) {
      setError(err.message || "Error loading subscriptions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubscriptions()
  }, [userId, activeOnly])

  const handleAddSubscription = async (e) => {
    e.preventDefault()

    if (!serviceName.trim()) {
      setError("Please enter a service name")
      return
    }

    try {
      setAddingSubscription(true)
      setError("")
      setSuccessMessage("")

      const response = await addSubscriptionService(userId, serviceName.trim())

      if (response.success) {
        setServiceName("")
        setSuccessMessage(response.message)
        await loadSubscriptions()
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        setError(response.message || "Failed to add subscription")
      }
    } catch (err) {
      setError(err.message || "Error adding subscription")
    } finally {
      setAddingSubscription(false)
    }
  }

  const handleEndSubscription = async (subscriptionId) => {
    if (!window.confirm("Are you sure you want to end this subscription?")) {
      return
    }

    try {
      setError("")
      setSuccessMessage("")

      const response = await endSubscriptionService(subscriptionId)

      if (response.success) {
        setSuccessMessage("Subscription ended successfully")
        await loadSubscriptions()
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        setError(response.message || "Failed to end subscription")
      }
    } catch (err) {
      setError(err.message || "Error ending subscription")
    }
  }

  const handleReactivateSubscription = async (subscriptionId) => {
    try {
      setError("")
      setSuccessMessage("")

      const response = await reactivateSubscriptionService(subscriptionId)

      if (response.success) {
        setSuccessMessage("Subscription reactivated successfully")
        await loadSubscriptions()
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        setError(response.message || "Failed to reactivate subscription")
      }
    } catch (err) {
      setError(err.message || "Error reactivating subscription")
    }
  }

  const handleDeleteSubscription = async (subscriptionId) => {
    if (!window.confirm("Are you sure you want to permanently delete this subscription?")) {
      return
    }

    try {
      setError("")
      setSuccessMessage("")

      const response = await deleteSubscriptionService(subscriptionId)

      if (response.success) {
        setSuccessMessage("Subscription deleted successfully")
        await loadSubscriptions()
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        setError(response.message || "Failed to delete subscription")
      }
    } catch (err) {
      setError(err.message || "Error deleting subscription")
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="subscriptions-container">
      <Helmet>
        <title>Service Subscriptions - Kelvin Kamara</title>
        <meta name="description" content="Manage your service subscriptions" />
      </Helmet>

      <div className="subscriptions-content">
        <h1>Service Subscriptions</h1>

        {error && <ErrorComponent error={error} />}

        {successMessage && (
          <div className="alert alert-success" role="alert">
            {successMessage}
          </div>
        )}

        <div className="add-subscription-section">
          <h2>Add New Subscription</h2>
          <form onSubmit={handleAddSubscription} className="subscription-form">
            <div className="form-group">
              <label htmlFor="serviceName">Service Name</label>
              <input
                type="text"
                id="serviceName"
                className="form-control"
                placeholder="e.g., Premium Support, API Access"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                disabled={addingSubscription}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={addingSubscription}
            >
              {addingSubscription ? "Adding..." : "Add Subscription"}
            </button>
          </form>
        </div>

        <div className="subscriptions-list-section">
          <div className="subscriptions-header">
            <h2>Your Subscriptions</h2>
            <div className="filter-buttons">
              <button
                className={`btn btn-sm ${activeOnly ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveOnly(true)}
              >
                Active Only
              </button>
              <button
                className={`btn btn-sm ${!activeOnly ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveOnly(false)}
              >
                All Subscriptions
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="alert alert-info">
              No subscriptions found. Add a new subscription to get started.
            </div>
          ) : (
            <div className="subscriptions-table-wrapper">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id}>
                      <td>{subscription.serviceName}</td>
                      <td>
                        <span className={`badge ${
                          subscription.isActive
                            ? "bg-success"
                            : "bg-secondary"
                        }`}>
                          {subscription.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{formatDate(subscription.startDate)}</td>
                      <td>
                        {subscription.endDate
                          ? formatDate(subscription.endDate)
                          : "—"}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {subscription.isActive ? (
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() =>
                                handleEndSubscription(subscription.id)
                              }
                              title="End this subscription"
                            >
                              End
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() =>
                                handleReactivateSubscription(subscription.id)
                              }
                              title="Reactivate this subscription"
                            >
                              Reactivate
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() =>
                              handleDeleteSubscription(subscription.id)
                            }
                            title="Permanently delete this subscription"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
