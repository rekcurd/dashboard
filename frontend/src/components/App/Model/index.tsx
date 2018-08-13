import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps, Link } from 'react-router-dom'
import { Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { Model, Application } from '@src/apis'
import {
  fetchApplicationByIdDispatcher,
  saveModelDispatcher,
  addNotification
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import ModelDescription from './ModelDescription'

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

  componentWillReceiveProps(nextProps: ModelProps) {
    const { saveModelStatus } = nextProps
    const { push } = nextProps.history
    const { applicationId } = this.props.match.params
    const { submitting, notified } = this.state

    // Close modal when API successfully finished
    if (submitting && !notified) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveModelStatus) && saveModelStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(saveModelStatus) && !saveModelStatus.result) ||
        isAPIFailed<boolean>(saveModelStatus)
      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully saved model' })
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
            {mode === 'edit' ? 'Edit' : 'Add'} Model
          </h1>
          { mode === 'edit' ? <ModelDescription mode={mode}/> : null }
        </Col>
      </Row>
    )
  }
}

type ModelProps =
  StateProps & DispatchProps
  & RouteComponentProps<{applicationId: string, modelId?: string}>
  & CustomProps

interface ModelState {
  submitting: boolean
  notified: boolean
}

interface StateProps {
  model: APIRequest<Model>
  application: APIRequest<Application>
  saveModelStatus: APIRequest<boolean>
}

interface CustomProps {
  mode: string
}

const mapStateToProps = (state: any, extraProps: CustomProps) => (
  {
    application: state.fetchApplicationByIdReducer.applicationById,
    model: state.fetchModelByIdReducer.modelById,
    saveModelStatus: state.saveModelReducer.saveModel,
    ...state.form,
    ...extraProps
  }
)

export interface DispatchProps {
  fetchApplicationById: (params) => Promise<void>
  saveModel: (params) => Promise<void>
  addNotification: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchApplicationById: (params) => fetchApplicationByIdDispatcher(dispatch, params),
    saveModel: (params) => saveModelDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{applicationId: string, modelId?: string}> & CustomProps>(
    mapStateToProps, mapDispatchToProps
  )(SaveModel)
)
