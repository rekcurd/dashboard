import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps, Link } from 'react-router-dom'
import { Alert } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { KubernetesHost, Model, Service, Application } from '@src/apis'
import {
  fetchKubernetesHostByIdDispatcher,
  fetchServiceByIdDispatcher,
  fetchAllModelsDispatcher,
  saveServiceDispatcher,
  addNotification
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import { ServiceDeploymentForm } from './ServiceDeploymentForm'

/**
 * Page for adding service
 * You can create service ONLY when your application is deployed with Kubernetes.
 */
class ServiceDeployment extends React.Component<SaveServiceProps, SaveServiceState> {
  constructor(props, context) {
    super(props, context)

    this.renderForm = this.renderForm.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)
    this.state = {
      submitting: false,
      notified: false,
    }
  }

  componentWillReceiveProps(nextProps: SaveServiceProps) {
    const { saveServiceStatus } = nextProps
    const { push } = nextProps.history
    const { applicationId } = this.props.match.params
    const { submitting, notified } = this.state

    // Close modal when API successfully finished
    if (submitting && !notified) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveServiceStatus) && saveServiceStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(saveServiceStatus) && !saveServiceStatus.result) ||
        isAPIFailed<boolean>(saveServiceStatus)
      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully saved service' })
        this.setState({ notified: true })
        push(`/applications/${applicationId}`)
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        this.setState({ notified: true })
      }
    }

  }

  componentWillMount() {
    this.props.fetchKubernetesHostById({id: this.props.kubernetesId})
    this.props.fetchAllModels({application_id: this.props.match.params.applicationId})
    if (this.props.mode === 'edit') {
      this.props.fetchServiceById(
        {
          kubernetes: true,
          id: this.props.match.params.serviceId,
          applicationId: this.props.match.params.applicationId,
          kubernetesId: this.props.kubernetesId
        }
      )
    }
  }

  render() {
    const {
      kubernetesId,
      fetchKubernetesHostStatus,
      fetchServiceByIdStatus,
      fetchAllModelsStatus,
      mode
    } = this.props

    const targetStatus =
      mode === 'edit'
      ? { hosts: fetchKubernetesHostStatus, service: fetchServiceByIdStatus, models: fetchAllModelsStatus }
      : { hosts: fetchKubernetesHostStatus, models: fetchAllModelsStatus }

    if (!kubernetesId && mode === 'edit') {
      // TODO: Check whether this is fine
      return null
    }

    return(
      <APIRequestResultsRenderer
        render={this.renderForm}
        APIStatus={targetStatus}
      />
    )
  }

  renderForm(params) {
    const { mode } = this.props

    return (
      <React.Fragment>
        {this.hostsNotFoundAlert()}
        <ServiceDeploymentForm
          mode={mode}
          models={params.models}
          onSubmit={this.onSubmit}
          onCancel={this.onCancel}
          applicationType='kubernetes'
          kubernetesHost={params.hosts}
          service={params.service}
        />
      </React.Fragment>
    )
  }

  hostsNotFoundAlert() {
    const failed: boolean =
      isAPIFailed<KubernetesHost>(this.props.fetchKubernetesHostStatus)

    if (failed) {
        const link = (
          <Link className='text-info' to='/settings/kubernetes/hosts/'>
            here
          </Link>
        )
        return (
          <Alert color='danger'>
            We could not fetch Kubernetes host.
            Check {` `}{link}.
          </Alert>
        )
    }
    return null
  }

  /**
   * Handle cancel button
   *
   * Reset form and move to application list page
   */
  onCancel() {
    const { push } = this.props.history
    const { applicationId } = this.props.match.params
    push(`applications/${applicationId}`)
  }

  onSubmit(parameters) {
    const { saveServiceDeployment, mode } = this.props
    const { applicationId, serviceId } = this.props.match.params

    const request = {
      dbType: 'sqlite',
      ...parameters[mode].service,
      mode,
      id: serviceId,
      applicationType: 'kubernetes',
      applicationId,
      saveDescription: false
    }

    this.setState({ submitting: true, notified: false })
    return saveServiceDeployment(request)
  }
}

type SaveServiceProps =
  StateProps & DispatchProps
  & RouteComponentProps<{applicationId: string, serviceId?: string}>
  & CustomProps

interface SaveServiceState {
  submitting: boolean
  notified: boolean
}

interface StateProps {
  application: APIRequest<Application>
  saveServiceStatus: APIRequest<boolean>
  fetchKubernetesHostStatus: APIRequest<KubernetesHost>
  fetchServiceByIdStatus: APIRequest<Service>
  fetchAllModelsStatus: APIRequest<Model[]>
}

interface CustomProps {
  mode: string
  kubernetesId: string
}

const mapStateToProps = (state: any, extraProps: CustomProps) => (
  {
    application: state.fetchApplicationByIdReducer.applicationById,
    saveServiceStatus: state.saveServiceReducer.saveService,
    fetchKubernetesHostStatus: state.fetchKubernetesHostByIdReducer.kubernetesHostById,
    fetchServiceByIdStatus: state.fetchServiceByIdReducer.serviceById,
    fetchAllModelsStatus: state.fetchAllModelsReducer.models,
    ...state.form,
    ...extraProps
  }
)

export interface DispatchProps {
  saveServiceDeployment: (params) => Promise<void>
  fetchKubernetesHostById: (params) => Promise<void>
  fetchServiceById: (params) => Promise<void>
  fetchAllModels: (params) => Promise<void>
  addNotification: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchKubernetesHostById: (params) => fetchKubernetesHostByIdDispatcher(dispatch, params),
    fetchServiceById: (params) => fetchServiceByIdDispatcher(dispatch, params),
    fetchAllModels: (params) => fetchAllModelsDispatcher(dispatch, params),
    saveServiceDeployment: (params) => saveServiceDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, CustomProps & RouteComponentProps<{applicationId: string, serviceId?: string}> & CustomProps>(
    mapStateToProps, mapDispatchToProps
  )(ServiceDeployment)
)
