import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { Service, Application, } from '@src/apis'
import {
  saveServiceDispatcher,
  addNotification,
  fetchServiceDescriptionsDispatcher
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import { ServiceDescriptionForm } from './ServiceDescriptionForm'

/**
 * Page for adding service
 * You can create service ONLY when your application is deployed with Kubernetes.
 */
class ServiceDescription extends React.Component<ServiceDescriptionProps, ServiceDescriptionState> {
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

  componentWillReceiveProps(nextProps: ServiceDescriptionProps) {
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
        nextProps.addNotification({ color: 'success', message: 'Successfully saved service description' })
        this.setState({ notified: true })
        push(`/applications/${applicationId}`)
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        this.setState({ notified: true })
      }
    }

  }

  componentWillMount() {
    const { mode } = this.props
    const { serviceId, applicationId } = this.props.match.params

    if (mode === 'edit') {
      this.props.fetchServiceDescriptionById(
        {
          id: serviceId,
          applicationId
        }
      )
    }
  }

  render() {
    const { fetchServiceDescriptionByIdStatus, mode } = this.props
    const targetStatus = { service: fetchServiceDescriptionByIdStatus }

    if (mode === 'edit') {
      return(
        <APIRequestResultsRenderer
          render={this.renderForm}
          APIStatus={targetStatus}
        />
      )
    }
    return this.renderForm({})
  }

  renderForm(params) {
    const { onSubmit, onCancel } = this

    return (
      <ServiceDescriptionForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        service={params.service[0]}
      />
    )
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

  onSubmit(parameters): Promise<void> {
    const { saveServiceDescription, mode } = this.props
    const { applicationId, serviceId } = this.props.match.params

    const request = {
      ...parameters[mode].service,
      mode,
      id: serviceId,
      applicationId,
      saveDescription: true
    }

    this.setState({ submitting: true, notified: false })
    return saveServiceDescription(request)
  }

}

type ServiceDescriptionProps =
  StateProps & DispatchProps
  & RouteComponentProps<{applicationId: string, serviceId?: string}>
  & CustomProps

interface ServiceDescriptionState {
  submitting: boolean
  notified: boolean
}

interface StateProps {
  application: APIRequest<Application>
  saveServiceStatus: APIRequest<boolean>
  fetchServiceDescriptionByIdStatus: APIRequest<Service>
}

interface CustomProps {
  mode: string
}

const mapStateToProps = (state: any, extraProps: CustomProps) => (
  {
    application: state.fetchApplicationByIdReducer.applicationById,
    saveServiceStatus: state.saveServiceReducer.saveService,
    fetchServiceDescriptionByIdStatus: state.fetchServiceDescriptionsReducer.serviceDescriptions,
    ...state.form,
    ...extraProps
  }
)

export interface DispatchProps {
  saveServiceDescription: (params) => Promise<void>
  fetchServiceDescriptionById: (params) => Promise<void>
  addNotification: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchServiceDescriptionById: (params) => fetchServiceDescriptionsDispatcher(dispatch, params),
    saveServiceDescription: (params) => saveServiceDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{applicationId: string, serviceId?: string}> & CustomProps>(
    mapStateToProps, mapDispatchToProps
  )(ServiceDescription)
)
