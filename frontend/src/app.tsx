import * as React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, combineReducers, compose, applyMiddleware } from 'redux'
import {
  saveProjectReducer,
  saveDataServerReducer,
  saveKubernetesReducer,
  saveApplicationReducer,
  updateServiceReducer,
  saveServiceDeploymentReducer,
  saveKubernetesGitKeyReducer,
  updateServiceRoutingReducer,
  uploadModelReducer,
  updateModelReducer,
  fetchAllProjectsReducer,
  fetchProjectByIdReducer,
  fetchDataServerReducer,
  fetchAllKubernetesReducer,
  fetchKubernetesByIdReducer,
  fetchAllApplicationsReducer,
  fetchApplicationByIdReducer,
  fetchAllModelsReducer,
  fetchModelByIdReducer,
  fetchAllServicesReducer,
  fetchServiceByIdReducer,
  fetchKubernetesGitKeyReducer,
  fetchServiceRoutingReducer,
  switchModelsReducer,
  syncKubernetesReducer,
  deleteKubernetesReducer,
  deleteDataServerReducer,
  deleteApplicationReducer,
  deleteServicesReducer,
  deleteModelsReducer,
  loginReducer,
  settingsReducer,
  userInfoReducer,
  fetchAllUsersReducer,
  fetchProjectAccessControlListReducer,
  saveProjectAccessControlReducer,
  deleteProjectAccessControlReducer,
  fetchApplicationAccessControlListReducer,
  saveApplicationAccessControlReducer,
  deleteApplicationAccessControlReducer,
  notificationReducer
} from './reducers'
import { App } from './components/App'
import './assets/koromo.css'
import './assets/style'

const store = createStore(
  combineReducers({
    saveProjectReducer,
    saveDataServerReducer,
    saveKubernetesReducer,
    saveApplicationReducer,
    updateServiceReducer,
    saveServiceDeploymentReducer,
    saveKubernetesGitKeyReducer,
    updateServiceRoutingReducer,
    uploadModelReducer,
    updateModelReducer,
    fetchAllProjectsReducer,
    fetchProjectByIdReducer,
    fetchDataServerReducer,
    fetchAllKubernetesReducer,
    fetchKubernetesByIdReducer,
    fetchAllApplicationsReducer,
    fetchApplicationByIdReducer,
    fetchAllModelsReducer,
    fetchModelByIdReducer,
    fetchAllServicesReducer,
    fetchServiceByIdReducer,
    fetchKubernetesGitKeyReducer,
    fetchServiceRoutingReducer,
    switchModelsReducer,
    syncKubernetesReducer,
    deleteKubernetesReducer,
    deleteDataServerReducer,
    deleteApplicationReducer,
    deleteServicesReducer,
    deleteModelsReducer,
    loginReducer,
    settingsReducer,
    userInfoReducer,
    fetchAllUsersReducer,
    fetchProjectAccessControlListReducer,
    saveProjectAccessControlReducer,
    deleteProjectAccessControlReducer,
    fetchApplicationAccessControlListReducer,
    saveApplicationAccessControlReducer,
    deleteApplicationAccessControlReducer,
    notificationReducer
  }))

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
