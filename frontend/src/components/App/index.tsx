import * as React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { Route, BrowserRouter, Redirect, Switch } from 'react-router-dom'

import Layout from './Layout'
import Applications from './Applications'
import SaveApplication from './SaveApplication'
import Application from './Application'
import Deploy from './Deploy'
import Services from './Services'
import Service from './Service'
import Settings from './Settings'
import Login from './Login'
import * as Kubernetes from './Kubernetes'
import { APIRequestResultsRenderer } from '@components/Common/APIRequestResultsRenderer'
import { AppState } from '@src/reducers'
import { settingsDispatcher } from '@src/actions'

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
    if (settings.auth) {
      login = <Route path='/login' component={Login} />
    }
    return (
      <Layout auth={settings.auth}>
        <Switch>
          <Redirect exact from='/' to='/applications' />
          <Route exact path='/applications' component={Applications} />
          <Route exact path='/applications/add' component={SaveApplication} />
          <Route path='/applications/:applicationId' component={ApplicationRoute} />
          <Route path='/settings' component={SettingsRoute} />
          {login}
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

const ApplicationRoute = () => (
  <Application>
    <Switch>
      <Route path='/applications/:applicationId/dashboard' component={Deploy} />
      <Route exact path='/applications/:applicationId/services' component={Services} />
      <Route exact path='/applications/:applicationId/models' component={Deploy} />
      <Route path='/applications/:applicationId/services/add'
        render={(props) => <Service {...props} mode='add'/>} />
      <Route path='/applications/:applicationId/services/:serviceId/edit'
        render={(props) => <Service {...props} mode='edit'/>} />
      <Redirect exact from='/applications/:applicationId' to='/applications/:applicationId/dashboard' />
    </Switch>
  </Application>
)

const SettingsRoute = () => (
  <Settings>
    <Switch>
      <Route path='/settings/kubernetes' component={KubernetesRoute} />
    </Switch>
  </Settings>
)

const KubernetesRoute = () => (
  <Kubernetes.Kubernetes>
    <Switch>
      <Redirect exact from='/settings/kubernetes' to='/settings/kubernetes/hosts' />
      <Route exact path='/settings/kubernetes/hosts' component={Kubernetes.Hosts} />
      <Route exact path='/settings/kubernetes/hosts/add'
        render={(props) => <Kubernetes.Host {...props} mode='add'/>} />
      <Route exact path='/settings/kubernetes/hosts/:kubernetesId/edit'
        render={(props) => <Kubernetes.Host {...props} mode='edit'/>} />
    </Switch>
  </Kubernetes.Kubernetes>
)
