import * as React from 'react'
import { connect } from 'react-redux'
import { RouterProps } from 'react-router'
import { withRouter, RouteComponentProps, Link } from 'react-router-dom'
import { InjectedFormProps } from 'redux-form'
import { Row, Col, Alert } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { KubernetesHost } from '@src/apis'
import { addApplicationDispatcher, fetchAllKubernetesHostsDispatcher, addNotification } from '@src/actions'
import { FormCustomProps, ApplicationDeloymentForm } from './ApplicationDeploymentForm'

/**
 * Page for adding application
 *
 */
class AddApplication extends React.Component<AddApplicationProps, AddApplicationState> {
  constructor(props, context) {
    super(props, context)

    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)
    this.onChangeApplicationType = this.onChangeApplicationType.bind(this)
    this.state = {
      selectedApplicationType: null,
      submitting: false,
      notified: false,
      fetchedKubernetesHosts: []
    }
  }

  componentWillReceiveProps(nextProps: AddApplicationProps) {
    const { addApplicationStatus } = nextProps
    const { submitting, selectedApplicationType, notified } = this.state
    const { push } = nextProps.history

    // Close modal when API successfully finished
    if (submitting && !notified) {
      const succeeded: boolean = isAPISucceeded<boolean>(addApplicationStatus) && addApplicationStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(addApplicationStatus) && !addApplicationStatus.result) ||
        isAPIFailed<boolean>(addApplicationStatus)
      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully added application' })
        this.setState({ notified: true })
        push('/applications/')
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        this.setState({ notified: true })
      }
    }

    if ( selectedApplicationType === 'kubernetes' ) {
      if (isAPISucceeded<KubernetesHost[]>(this.props.fetchKubernetesHostsStatus)) {
        this.setState({
          fetchedKubernetesHosts: this.props.fetchKubernetesHostsStatus.result
        })
      } else if (isAPIFailed<KubernetesHost[]>(this.props.fetchKubernetesHostsStatus)) {
        nextProps.addNotification({ color: 'error', message: 'We could not fetch kubernetes hosts' })
      }
    }
  }

  componentWillMount() {
    this.props.fetchKubernetesHosts()
  }

  /**
   * Handle cancel button
   *
   * Reset form and move to application list page
   */
  onCancel() {
    const { push } = this.props.history
    push('/applications')
  }

  onSubmit(parameters) {
    const { addApplication } = this.props
    this.setState({ submitting: true, notified: false })

    return addApplication(
      {
        ...parameters.add.application,
        dbType: 'mysql'
      }
    )
  }

  /**
   * Update application types by hooking change of select box
   * value.
   *
   * @param event Triggered event
   */
  onChangeApplicationType(event) {
    if (event.target) {
      this.setState({ selectedApplicationType: event.target.value })
    }
  }

  render() {
    const {
      selectedApplicationType,
      fetchedKubernetesHosts
    } = this.state

    return (
      <Row className='justify-content-center'>
        <Col md='10' className='pt-5'>
          {this.hostsNotFoundAlert()}
          <ApplicationDeloymentForm
            onSubmit={this.onSubmit}
            onCancel={this.onCancel}
            onChangeApplicationType={this.onChangeApplicationType}
            selectedApplicationType={selectedApplicationType}
            kubernetesHosts={fetchedKubernetesHosts}
          />
        </Col>
      </Row>
    )
  }

  hostsNotFoundAlert() {
    const { fetchedKubernetesHosts, selectedApplicationType } = this.state
    const apiFinished: boolean =
      isAPISucceeded<KubernetesHost[]>(this.props.fetchKubernetesHostsStatus)
      || isAPIFailed<KubernetesHost[]>(this.props.fetchKubernetesHostsStatus)

    if (selectedApplicationType === 'kubernetes'
      && apiFinished
      && fetchedKubernetesHosts.length === 0) {
        const link = (
          <Link className='text-info' to='/settings/kubernetes/hosts/'>
            here
          </Link>
        )
        return (
          <Alert color='danger'>
            Register your Kubernetes host(s) {link} at first.
          </Alert>
        )
    }
    return null
  }
}

type AddApplicationProps = StateProps & DispatchProps & RouterProps & InjectedFormProps<{}, FormCustomProps>
interface AddApplicationState {
  selectedApplicationType: string
  submitting: boolean
  notified: boolean
  fetchedKubernetesHosts: KubernetesHost[]
}

interface StateProps {
  addApplicationStatus: APIRequest<boolean>
  fetchKubernetesHostsStatus: APIRequest<KubernetesHost[]>
}
const mapStateToProps = (state: any, extraProps: FormCustomProps) => (
  {
    addApplicationStatus: state.addApplicationReducer.addApplication,
    fetchKubernetesHostsStatus: state.fetchAllKubernetesHostsReducer.kubernetesHosts,
    ...state.form,
    ...extraProps
  }
)

export interface DispatchProps {
  addApplication: (params) => Promise<void>
  addNotification: (params) => Promise<void>
  fetchKubernetesHosts: () => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addApplication: (params) => addApplicationDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params)),
    fetchKubernetesHosts: () => fetchAllKubernetesHostsDispatcher(dispatch)
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{}> & FormCustomProps>(
    mapStateToProps, mapDispatchToProps
  )(AddApplication)
)
