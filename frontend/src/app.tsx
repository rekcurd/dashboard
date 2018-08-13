import * as React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, combineReducers, compose, applyMiddleware } from 'redux'
import { reducer as reduxFormReducer } from 'redux-form'
import thunk from 'redux-thunk'
import {
  notificationReducer,
  uploadModelReducer,
  switchModelsReducer,
  saveKubernetesHostReducer,
  addApplicationReducer,
  saveServiceReducer,
  saveModelReducer,
  fetchAllKubernetesHostsReducer,
  fetchKubernetesHostByIdReducer,
  fetchAllApplicationsReducer,
  fetchApplicationByIdReducer,
  fetchAllModelsReducer,
  fetchAllServicesReducer,
  fetchServiceDescriptionsReducer,
  fetchModelDescriptionsReducer,
  fetchServiceByIdReducer,
  fetchModelByIdReducer,
  deleteKubernetesHostReducer,
  deleteKubernetesServicesReducer,
  deleteKubernetesModelsReducer,
  syncKubernetesStatusReducer,
  settingsReducer,
  loginReducer,
  userInfoReducer
} from './reducers'
import { App } from './components/App'
import './assets/koromo.css'
import './assets/style'

const store = compose(applyMiddleware(thunk))(createStore)(
  combineReducers({
    notificationReducer,
    uploadModelReducer,
    switchModelsReducer,
    saveKubernetesHostReducer,
    addApplicationReducer,
    saveServiceReducer,
    saveModelReducer,
    fetchAllKubernetesHostsReducer,
    fetchKubernetesHostByIdReducer,
    fetchAllApplicationsReducer,
    fetchApplicationByIdReducer,
    fetchAllModelsReducer,
    fetchAllServicesReducer,
    fetchServiceByIdReducer,
    fetchModelByIdReducer,
    fetchServiceDescriptionsReducer,
    fetchModelDescriptionsReducer,
    deleteKubernetesHostReducer,
    deleteKubernetesServicesReducer,
    deleteKubernetesModelsReducer,
    syncKubernetesStatusReducer,
    settingsReducer,
    loginReducer,
    userInfoReducer,
    form: reduxFormReducer
  }))

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
