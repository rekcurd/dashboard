import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { Service, Application, UserInfo, UserRole } from '@src/apis'
import {
  fetchApplicationByIdDispatcher,
  saveServiceDispatcher,
  addNotification
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import ServiceDeployment from './ServiceDeployment'
import ServiceDescription from './ServiceDescription'

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

  componentWillReceiveProps(nextProps: ServiceProps) {
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
    const { applicationId } = this.props.match.params
    const { fetchApplicationById } = this.props

    fetchApplicationById({id: applicationId})
  }

  componentDidMount() {
    const { userInfoStatus, history } = this.props
    const { applicationId } = this.props.match.params
    const userInfo: UserInfo = isAPISucceeded<UserInfo>(userInfoStatus) && userInfoStatus.result
    if (userInfo) {
      const canEdit: boolean = userInfo.roles.some((role: UserRole) => {
        return String(role.applicationId) === applicationId &&
          (role.role === 'edit' || role.role === 'admin')
      })
      if (!canEdit) {
        history.goBack()
      }
    }
  }

  render() {
    const { application } = this.props
    const targetStatus = { application }

    return(
      <APIRequestResultsRenderer
        render={this.renderForm}
        APIStatus={targetStatus}
      />
    )
  }

  renderForm(result) {
    const { mode } = this.props

    return (
      <Row className='justify-content-center'>
        <Col md='10'>
          <h1 className='mb-3'>
            <i className='fas fa-box fa-fw mr-2'></i>
            {mode === 'edit' ? 'Edit' : 'Add'} Service
          </h1>
          { mode === 'edit' ? <ServiceDescription mode={mode}/> : null }
          <ServiceDeployment
            mode={mode}
            kubernetesId={result.application.kubernetesId}
          />
        </Col>
      </Row>
    )
  }
}

type ServiceProps =
  StateProps & DispatchProps
  & RouteComponentProps<{applicationId: string, serviceId?: string}>
  & CustomProps

interface ServiceState {
  submitting: boolean
  notified: boolean
}

interface StateProps {
  service: APIRequest<Service>
  application: APIRequest<Application>
  saveServiceStatus: APIRequest<boolean>
  userInfoStatus: APIRequest<UserInfo>
}

interface CustomProps {
  mode: string
}

const mapStateToProps = (state: any, extraProps: CustomProps) => (
  {
    application: state.fetchApplicationByIdReducer.applicationById,
    service: state.fetchServiceByIdReducer.serviceById,
    saveServiceStatus: state.saveServiceReducer.saveService,
    userInfoStatus: state.userInfoReducer.userInfo,
    ...state.form,
    ...extraProps
  }
)

export interface DispatchProps {
  fetchApplicationById: (params) => Promise<void>
  saveService: (params) => Promise<void>
  addNotification: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchApplicationById: (params) => fetchApplicationByIdDispatcher(dispatch, params),
    saveService: (params) => saveServiceDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{applicationId: string, serviceId?: string}> & CustomProps>(
    mapStateToProps, mapDispatchToProps
  )(SaveService)
)
