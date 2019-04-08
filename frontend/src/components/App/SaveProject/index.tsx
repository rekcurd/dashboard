import * as React from 'react'
import { connect } from 'react-redux'
import { RouterProps } from 'react-router'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Row, Col, Alert } from 'reactstrap'

import { ProjectParam } from '@src/apis'
import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { saveProjectDispatcher, addNotification } from '@src/actions'
import { FormCustomProps, ProjectDeloymentForm } from './ProjectDeploymentForm'

/**
 * Page for adding project
 *
 */
class AddProject extends React.Component<AddProjectProps, AddProjectState> {
  constructor(props, context) {
    super(props, context)

    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)
    this.state = {
      submitting: false,
      notified: false,
    }
  }

  static getDerivedStateFromProps(nextProps: AddProjectProps, prevState: AddProjectState){
    const { saveProjectStatus } = nextProps
    const { submitting, notified } = prevState
    const { push } = nextProps.history

    // Close modal when API successfully finished
    if (submitting && !notified) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveProjectStatus) && saveProjectStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(saveProjectStatus) && !saveProjectStatus.result) ||
        isAPIFailed<boolean>(saveProjectStatus)
      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully added project' })
        push('/projects/')
        return { notified: true }
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        return { notified: true }
      }
    }
  }

  /**
   * Handle cancel button
   *
   * Reset form and move to project list page
   */
  onCancel() {
    const { push } = this.props.history
    push('/projects')
  }

  onSubmit(parameters) {
    const { saveProject } = this.props
    this.setState({ submitting: true, notified: false })

    return saveProject(
      {
        ...parameters,
      }
    )
  }

  render() {
    return (
      <Row className='justify-content-center'>
        <Col md='10' className='pt-5'>
          <ProjectDeloymentForm
            submitting={this.state.submitting}
            onSubmit={this.onSubmit}
            onCancel={this.onCancel}
          />
        </Col>
      </Row>
    )
  }
}

type AddProjectProps = StateProps & DispatchProps & RouterProps
interface AddProjectState {
  submitting: boolean
  notified: boolean
}

interface StateProps {
  saveProjectStatus: APIRequest<boolean>
}
const mapStateToProps = (state: any, extraProps: FormCustomProps) => (
  {
    saveProjectStatus: state.saveProjectReducer.saveProject,
    ...state.form,
    ...extraProps
  }
)

export interface DispatchProps {
  saveProject: (params: ProjectParam) => Promise<void>
  addNotification: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    saveProject: (params: ProjectParam) => saveProjectDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{}> & FormCustomProps>(
    mapStateToProps, mapDispatchToProps
  )(AddProject)
)
