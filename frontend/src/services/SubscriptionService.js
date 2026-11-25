import HttpService from "./HttpService"

export const addSubscriptionService = (userId, serviceName) => {
  const http = new HttpService()
  const tokenId = "user-token"
  
  return http.postData("/subscriptions", {
    userId,
    serviceName,
  }, tokenId)
    .then((response) => {
      return response.data
    })
    .catch(err => { throw err })
}

export const getActiveSubscriptionsService = (userId) => {
  const http = new HttpService()
  const tokenId = "user-token"
  
  return http.getData(`/subscriptions/active/${userId}`, tokenId)
    .then((response) => {
      return response.data
    })
    .catch(err => { throw err })
}

export const getAllSubscriptionsService = (userId) => {
  const http = new HttpService()
  const tokenId = "user-token"
  
  return http.getData(`/subscriptions/all/${userId}`, tokenId)
    .then((response) => {
      return response.data
    })
    .catch(err => { throw err })
}

export const getActiveServicesService = (userId) => {
  const http = new HttpService()
  const tokenId = "user-token"
  
  return http.getData(`/subscriptions/services/active/${userId}`, tokenId)
    .then((response) => {
      return response.data
    })
    .catch(err => { throw err })
}

export const checkServiceSubscriptionService = (userId, serviceName) => {
  const http = new HttpService()
  const tokenId = "user-token"
  
  return http.getData(`/subscriptions/check/${userId}/${encodeURIComponent(serviceName)}`, tokenId)
    .then((response) => {
      return response.data
    })
    .catch(err => { throw err })
}

export const endSubscriptionService = (subscriptionId) => {
  const http = new HttpService()
  const tokenId = "user-token"
  
  return http.putData(`/subscriptions/${subscriptionId}/end`, {}, tokenId)
    .then((response) => {
      return response.data
    })
    .catch(err => { throw err })
}

export const reactivateSubscriptionService = (subscriptionId) => {
  const http = new HttpService()
  const tokenId = "user-token"
  
  return http.putData(`/subscriptions/${subscriptionId}/reactivate`, {}, tokenId)
    .then((response) => {
      return response.data
    })
    .catch(err => { throw err })
}

export const deleteSubscriptionService = (subscriptionId) => {
  const http = new HttpService()
  const tokenId = "user-token"
  
  return http.delData(`/subscriptions/${subscriptionId}`, tokenId)
    .then((response) => {
      return response.data
    })
    .catch(err => { throw err })
}
