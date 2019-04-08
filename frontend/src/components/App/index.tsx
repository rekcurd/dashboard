import * as React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { Route, BrowserRouter, Redirect, Switch } from 'react-router-dom'

import { APIRequestResultsRenderer } from '@components/Common/APIRequestResultsRenderer'
import { AppState } from '@src/reducers'
import { settingsDispatcher } from '@src/actions'

import Layout from './Layout'
import Login from './Login'

import Projects from './Projects'
import ProjectAdmin from './ProjectAdmin'
import DataServer from './DataServer'
import * as Kubernetes from './Kubernetes'
import SaveProject from './SaveProject'
import Applications from './Applications'
import SaveApplication from './SaveApplication'

import ApplicationAdmin from './ApplicationAdmin'
import Application from './Application'
import Dashboard from './Dashboard'
import Services from './Services'
import Service from './Service'
import Models from './Models'
import Model from './Model'
import ServiceRouting from './ServiceRouting'


interface AppStateProps {
  settingsState: AppState
}

interface AppDispatchProps {
  fetchSettings: () => Promise<void>
}

type AppProps = AppStateProps & AppDispatchProps

class AppComponent extends React.Component<AppProps> {
  componentDidMount() {
    const { fetchSettings } = this.props
    fetchSettings()
  }
  render() {
    const { settingsState } = this.props
    const app = (
      <APIRequestResultsRenderer
        APIStatus={{ settings: settingsState }}
        render={this.renderApp.bind(this)}
      />
    )
    return (
      <BrowserRouter>
        {app}
      </BrowserRouter>
    )
  }
  renderApp(results) {
    const settings: any = results.settings
    let login
    let projectAdmin
    let dataServerAdmin
    let kubenetesAdmin
    let applicationAdmin
    if (settings.auth) {
      login = <Route path='/login' component={Login} />
      projectAdmin = <Route exact path='/projects/:projectId/admin' component={ProjectAdmin} />
      dataServerAdmin = <Route exact path='/projects/:projectId/data_servers' component={DataServer} />
      kubenetesAdmin = <Route path='/projects/:projectId/kubernetes' component={KubernetesRoute} />
      applicationAdmin = <Route exact path='/projects/:projectId/applications/:applicationId/admin' component={ApplicationAdmin} />
    } else {
      login = null
      projectAdmin = <Redirect from='/projects/:projectId/admin' to='/projects/:projectId/applications' />
      dataServerAdmin = <Redirect from='/projects/:projectId/data_servers' to='/projects/:projectId/applications' />
      kubenetesAdmin = <Redirect from='/projects/:projectId/kubernetes' to='/projects/:projectId/applications' />
      applicationAdmin = <Redirect from='/projects/:projectId/applications/:applicationId/admin' to='/projects/:projectId/applications/:applicationId/dashboard' />
    }
    return (
      <Layout auth={settings.auth}>
        <Switch>
          <Redirect exact from='/' to='/projects' />
          <Redirect exact from='/projects/:projectId' to='/projects/:projectId/applications' />
          <Route exact path='/projects' component={Projects} />
          <Route exact path='/projects/add' component={SaveProject} />
          <Route exact path='/projects/:projectId/applications' component={Applications} />
          <Route exact path='/projects/:projectId/applications/add' component={SaveApplication} />
          <Route path='/projects/:projectId/applications/:applicationId' render={() => <ApplicationRoute settings={settings} />} />
          {login}
          {projectAdmin}
          {dataServerAdmin}
          {kubenetesAdmin}
          {applicationAdmin}
        </Switch>
      </Layout>
    )
  }
}
export const App = connect<AppStateProps, AppDispatchProps>(
  (state: any): AppStateProps => ({
    settingsState: state.settingsReducer.settings
  }),
  (dispatch: Dispatch): AppDispatchProps => ({
    fetchSettings: () => settingsDispatcher(dispatch)
  }),
)(AppComponent)


interface ApplicationRouteProps {
  settings: any
}

class ApplicationRoute extends React.Component<ApplicationRouteProps> {
  render() {
    return (
      <Application>
        <Switch>
          <Route path='/projects/:projectId/applications/:applicationId/dashboard' component={Dashboard} />
          <Route exact path='/projects/:projectId/applications/:applicationId/services' component={Services} />
          <Route exact path='/projects/:projectId/applications/:applicationId/models' component={Models} />
          <Route exact path='/projects/:projectId/applications/:applicationId/routing' component={ServiceRouting} />
          <Route exact path='/projects/:projectId/applications/:applicationId/services/add'
                 render={(props) => <Service {...props} method='post'/>} />
          <Route exact path='/projects/:projectId/applications/:applicationId/services/:serviceId/edit'
                 render={(props) => <Service {...props} method='patch'/>} />
          <Route exact path='/projects/:projectId/applications/:applicationId/models/:modelId/edit'
                 render={(props) => <Model {...props} method='patch'/>} />
          <Redirect exact from='/projects/:projectId/applications/:applicationId' to='/projects/:projectId/applications/:applicationId/dashboard' />
        </Switch>
      </Application>
    )
  }
}

class KubernetesRoute extends React.Component {
  render() {
    return(
      <Kubernetes.SideMenu>
        <Switch>
          <Route exact path='/projects/:projectId/kubernetes' component={Kubernetes.Hosts} />
          <Route exact path='/projects/:projectId/kubernetes/add'
                 render={(props) => <Kubernetes.Host {...props} method='post' />} />
          <Route exact path='/projects/:projectId/kubernetes/:kubernetesId'
                 render={(props) => <Kubernetes.Host {...props} method='patch' />} />
        </Switch>
      </Kubernetes.SideMenu>
    )
  }
}

