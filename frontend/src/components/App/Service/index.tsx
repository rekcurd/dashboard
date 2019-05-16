import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  Service, Application, UserInfo, UserApplicationRole,
  ServiceDeploymentParam, Project
} from '@src/apis'
import {
  saveServiceDeploymentDispatcher,
  addNotification
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import ServiceDeployment from './ServiceDeployment'
import { applicationRole } from '@common/Enum'

/**
 * Page for adding service
 * You can create service ONLY when your application is deployed with Kubernetes.
 */
class SaveService extends React.Component<ServiceProps, ServiceState> {
  constructor(props, context) {
    super(props, context)

    this.renderForm = this.renderForm.bind(this)
    this.state = {
      submitting: false,
      notified: false,
    }
  }

  componentDidMount() {
    const { userInfoStatus, history } = this.props
    const { applicationId } = this.props.match.params

    const userInfo: UserInfo = isAPISucceeded<UserInfo>(userInfoStatus) && userInfoStatus.result
    if (userInfo) {
      const canEdit: boolean = userInfo.applicationRoles.some((userRole: UserApplicationRole) => {
        return String(userRole.applicationId) === String(applicationId) &&
          (userRole.role === applicationRole.editor || userRole.role === applicationRole.admin)
      })
      if (!canEdit) {
        history.goBack()
      }
    }
  }

  static getDerivedStateFromProps(nextProps: ServiceProps, prevState: ServiceState){
    const { saveServiceDeploymentStatus } = nextProps
    const { push } = nextProps.history
    const { projectId, applicationId } = nextProps.match.params
    const { submitting, notified } = prevState

    // Close modal when API successfully finished
    if (submitting && !notified) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveServiceDeploymentStatus) && saveServiceDeploymentStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(saveServiceDeploymentStatus) && !saveServiceDeploymentStatus.result) || isAPIFailed<boolean>(saveServiceDeploymentStatus)
      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully saved service' })
        push(`/projects/${projectId}/applications/${applicationId}`)
        return { notified: true }
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong with saving service. Try again later' })
        return { notified: true }
      }
    }
    return null
  }

  render() {
    const { fetchProjectByIdStatus, application } = this.props
    const targetStatus = { fetchProjectByIdStatus, application }

    return(
      <APIRequestResultsRenderer
        render={this.renderForm}
        APIStatus={targetStatus}
      />
    )
  }

  renderForm(result, canEdit) {
    const { method } = this.props
    const { projectId, applicationId } = this.props.match.params
    const project: Project = result.fetchProjectByIdStatus

    if (!canEdit) {
      this.props.history.push(`/projects/${projectId}/applications/${applicationId}`)
    }

    return (
      <Row className='justify-content-center'>
        <Col md='10'>
          <h1 className='mb-3'>
            <i className='fas fa-box fa-fw mr-2'></i>
            {method === 'patch' ? 'Edit' : 'Add'} Service
          </h1>
          <ServiceDeployment kubernetesMode={project.useKubernetes} method={method} />
        </Col>
      </Row>
    )
  }
}

type ServiceProps =
  StateProps & DispatchProps
  & RouteComponentProps<{projectId: number, applicationId: string, serviceId?: string}>
  & CustomProps

interface ServiceState {
  submitting: boolean
  notified: boolean
}

interface StateProps {
  fetchProjectByIdStatus: APIRequest<Project>
  application: APIRequest<Application>
  service: APIRequest<Service>
  saveServiceDeploymentStatus: APIRequest<boolean>
  userInfoStatus: APIRequest<UserInfo>
}

interface CustomProps {
  method: string
}

const mapStateToProps = (state: any, extraProps: CustomProps) => (
  {
    fetchProjectByIdStatus: state.fetchProjectByIdReducer.fetchProjectById,
    application: state.fetchApplicationByIdReducer.fetchApplicationById,
    service: state.fetchServiceByIdReducer.fetchServiceById,
    saveServiceDeploymentStatus: state.saveServiceDeploymentReducer.saveServiceDeployment,
    userInfoStatus: state.userInfoReducer.userInfo,
    ...state.form,
    ...extraProps
  }
)

export interface DispatchProps {
  saveServiceDeployment: (params: ServiceDeploymentParam) => Promise<void>
  addNotification: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    saveServiceDeployment: (params: ServiceDeploymentParam) => saveServiceDeploymentDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string, serviceId?: string}> & CustomProps>(
    mapStateToProps, mapDispatchToProps
  )(SaveService)
)
