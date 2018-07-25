import * as React from 'react'
import { Route, BrowserRouter, Redirect, Switch } from 'react-router-dom'

import Layout from './Layout'
import Applications from './Applications'
import SaveApplication from './SaveApplication'
import Application from './Application'
import Deploy from './Deploy'
import Service from './Service'
import Settings from './Settings'

import * as Kubernetes from './Kubernetes'

export const App = () => (
  <BrowserRouter>
    <Layout>
      <Switch>
        <Redirect exact from='/' to='/applications' />
        <Route exact path='/applications' component={Applications} />
        <Route exact path='/applications/add' component={SaveApplication} />
        <Route path='/applications/:applicationId' component={ApplicationRoute} />
        <Route path='/settings' component={SettingsRoute} />
      </Switch>
    </Layout>
  </BrowserRouter>
)

const ApplicationRoute = () => (
  <Application>
    <Switch>
      <Route path='/applications/:applicationId/dashboard' component={Deploy} />
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
