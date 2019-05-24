import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Row, Col, Alert } from 'reactstrap'

import { ApplicationParam } from '@src/apis'
import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { saveApplicationDispatcher, addNotification } from '@src/actions'
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
    this.state = {
      submitting: false,
      notified: false,
    }
  }

  static getDerivedStateFromProps(nextProps: AddApplicationProps, nextState: AddApplicationState){
    const { saveApplicationStatus } = nextProps
    const { submitting, notified } = nextState
    const { push } = nextProps.history
    const { projectId } = nextProps.match.params

    // Close modal when API successfully finished
    if (submitting && !notified) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveApplicationStatus) && saveApplicationStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(saveApplicationStatus) && !saveApplicationStatus.result) || isAPIFailed<boolean>(saveApplicationStatus)
      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully added application' })
        push(`/projects/${projectId}/applications`)
        return { notified: true }
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        return { notified: true }
      }
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
    const { projectId } = this.props.match.params
    push(`/projects/${projectId}/applications`)
  }

  onSubmit(parameters) {
    const { saveApplication } = this.props
    this.setState({ submitting: true, notified: false })

    return saveApplication(
      {
        method: 'post',
        projectId: this.props.match.params.projectId,
        ...parameters,
      }
    )
  }

  render() {
    return (
      <Row className='justify-content-center'>
        <Col md='10' className='pt-5'>
          <ApplicationDeloymentForm
            onSubmit={this.onSubmit}
            onCancel={this.onCancel}
          />
        </Col>
      </Row>
    )
  }
}

type AddApplicationProps = StateProps & DispatchProps & RouteComponentProps<{projectId: number}>
interface AddApplicationState {
  submitting: boolean
  notified: boolean
}

interface StateProps {
  saveApplicationStatus: APIRequest<boolean>
}
const mapStateToProps = (state: any, extraProps: FormCustomProps) => (
  {
    saveApplicationStatus: state.saveApplicationReducer.saveApplication,
    ...extraProps
  }
)

export interface DispatchProps {
  saveApplication: (params: ApplicationParam) => Promise<void>
  addNotification: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    saveApplication: (params: ApplicationParam) => saveApplicationDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number}> & FormCustomProps>(
    mapStateToProps, mapDispatchToProps
  )(AddApplication)
)
