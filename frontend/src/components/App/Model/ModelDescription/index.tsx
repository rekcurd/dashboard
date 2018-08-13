import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { Model, Application, } from '@src/apis'
import {
  saveModelDispatcher,
  addNotification,
  fetchModelDescriptionsDispatcher
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import { ModelDescriptionForm } from './ModelDescriptionForm'

/**
 * Page for adding model
 * You can create model ONLY when your application is deployed with Kubernetes.
 */
class ModelDescription extends React.Component<ModelDescriptionProps, ModelDescriptionState> {
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

  componentWillReceiveProps(nextProps: ModelDescriptionProps) {
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
        nextProps.addNotification({ color: 'success', message: 'Successfully saved model description' })
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
    const { modelId, applicationId } = this.props.match.params

    if (mode === 'edit') {
      this.props.fetchModelDescriptionById(
        {
          id: modelId,
          applicationId
        }
      )
    }
  }

  render() {
    const { fetchModelDescriptionByIdStatus, mode } = this.props
    const targetStatus = { model: fetchModelDescriptionByIdStatus }

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
      <ModelDescriptionForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        model={params.model[0]}
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
    const { saveModelDescription, mode } = this.props
    const { applicationId, modelId } = this.props.match.params

    const request = {
      ...parameters[mode].model,
      mode,
      id: modelId,
      applicationId,
      saveDescription: true
    }

    this.setState({ submitting: true, notified: false })
    return saveModelDescription(request)
  }

}

type ModelDescriptionProps =
  StateProps & DispatchProps
  & RouteComponentProps<{applicationId: string, modelId?: string}>
  & CustomProps

interface ModelDescriptionState {
  submitting: boolean
  notified: boolean
}

interface StateProps {
  application: APIRequest<Application>
  saveModelStatus: APIRequest<boolean>
  fetchModelDescriptionByIdStatus: APIRequest<Model>
}

interface CustomProps {
  mode: string
}

const mapStateToProps = (state: any, extraProps: CustomProps) => (
  {
    application: state.fetchApplicationByIdReducer.applicationById,
    saveModelStatus: state.saveModelReducer.saveModel,
    fetchModelDescriptionByIdStatus: state.fetchModelDescriptionsReducer.modelDescriptions,
    ...state.form,
    ...extraProps
  }
)

export interface DispatchProps {
  saveModelDescription: (params) => Promise<void>
  fetchModelDescriptionById: (params) => Promise<void>
  addNotification: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchModelDescriptionById: (params) => fetchModelDescriptionsDispatcher(dispatch, params),
    saveModelDescription: (params) => saveModelDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{applicationId: string, modelId?: string}> & CustomProps>(
    mapStateToProps, mapDispatchToProps
  )(ModelDescription)
)
