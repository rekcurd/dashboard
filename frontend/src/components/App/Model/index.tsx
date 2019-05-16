import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  Model, Application, UserInfo, UserApplicationRole,
  UpdateModelParam, FetchModelByIdParam
} from '@src/apis'
import {
  fetchModelByIdDispatcher,
  updateModelDispatcher,
  addNotification
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import ModelDescription from './ModelDescription'
import { applicationRole } from '@common/Enum'

/**
 * Page for adding model
 * You can create model ONLY when your application is deployed with Kubernetes.
 */
class SaveModel extends React.Component<ModelProps, ModelState> {
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
      const canEdit: boolean = userInfo.applicationRoles.some((role: UserApplicationRole) => {
        return String(role.applicationId) === String(applicationId) &&
          (role.role === applicationRole.editor || role.role === applicationRole.admin)
      })
      if (!canEdit) {
        history.goBack()
      }
    }
  }

  static getDerivedStateFromProps(nextProps: ModelProps, prevState: ModelState){
    const { updateModelStatus } = nextProps
    const { push } = nextProps.history
    const { submitting, notified } = prevState
    const { projectId, applicationId } = nextProps.match.params

    // Close modal when API successfully finished
    if (submitting && !notified) {
      const succeeded: boolean = isAPISucceeded<boolean>(updateModelStatus) && updateModelStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(updateModelStatus) && !updateModelStatus.result) || isAPIFailed<boolean>(updateModelStatus)
      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully saved model' })
        push(`/projects/${projectId}/applications/${applicationId}`)
        return { notified: true }
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        return { notified: true }
      }
    }
    return null
  }

  render() {
    const { application } = this.props

    return(
      <APIRequestResultsRenderer
        APIStatus={{application}}
        render={this.renderForm}
      />
    )
  }

  renderForm(result) {
    return (
      <Row className='justify-content-center'>
        <Col md='10'>
          <h1 className='mb-3'>
            <i className='fas fa-box fa-fw mr-2'></i>
            Edit Model
          </h1>
          <ModelDescription />
        </Col>
      </Row>
    )
  }
}

type ModelProps =
  StateProps & DispatchProps
  & RouteComponentProps<{projectId: number, applicationId: string, modelId: number}>
  & CustomProps

interface ModelState {
  submitting: boolean
  notified: boolean
}

interface StateProps {
  model: APIRequest<Model>
  application: APIRequest<Application>
  updateModelStatus: APIRequest<boolean>
  userInfoStatus: APIRequest<UserInfo>
}

interface CustomProps {}

const mapStateToProps = (state: any, extraProps: CustomProps): StateProps => (
  {
    model: state.fetchModelByIdReducer.fetchModelById,
    application: state.fetchApplicationByIdReducer.fetchApplicationById,
    updateModelStatus: state.updateModelReducer.updateModel,
    userInfoStatus: state.userInfoReducer.userInfo,
    ...state.form,
    ...extraProps
  }
)

export interface DispatchProps {
  fetchModelById: (params: FetchModelByIdParam) => Promise<void>
  updateModel: (params: UpdateModelParam) => Promise<void>
  addNotification: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchModelById: (params: FetchModelByIdParam) => fetchModelByIdDispatcher(dispatch, params),
    updateModel: (params: UpdateModelParam) => updateModelDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string, modelId: number}> & CustomProps>(
    mapStateToProps, mapDispatchToProps
  )(SaveModel)
)
