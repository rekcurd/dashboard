import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { Model, FetchModelByIdParam, UpdateModelParam } from '@src/apis'
import {
  addNotification,
  updateModelDispatcher,
  fetchModelByIdDispatcher
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

  componentDidMount(): void {
    const { method } = this.props
    const { modelId, applicationId } = this.props.match.params

    if (method === 'patch') {
      this.props.fetchModelById(this.props.match.params)
    }
  }

  static getDerivedStateFromProps(nextProps: ModelDescriptionProps, prevState: ModelDescriptionState){
    const { updateModelStatus } = nextProps
    const { push } = nextProps.history
    const { projectId, applicationId } = nextProps.match.params
    const { submitting, notified } = prevState

    // Close modal when API successfully finished
    if (submitting && !notified) {
      const succeeded: boolean = isAPISucceeded<boolean>(updateModelStatus) && updateModelStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(updateModelStatus) && !updateModelStatus.result) ||
        isAPIFailed<boolean>(updateModelStatus)
      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully saved model description' })
        push(`/projects/${projectId}/applications/${applicationId}`)
        return { notified: true }
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        return { notified: true }
      }
    }
  }

  render() {
    const { fetchModelByIdStatus, method } = this.props

    if (method === 'patch') {
      return(
        <APIRequestResultsRenderer
          render={this.renderForm}
          APIStatus={{model: fetchModelByIdStatus}}
        />
      )
    }
    return this.renderForm({})
  }

  renderForm(params) {
    return (
      <ModelDescriptionForm
        onSubmit={this.onSubmit}
        onCancel={this.onCancel}
        initialValues={...params.model}
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
    const { projectId, applicationId } = this.props.match.params
    push(`/projects/${projectId}/applications/${applicationId}`)
  }

  onSubmit(parameters): Promise<void> {
    const { updateModel, method } = this.props
    const { projectId, applicationId, modelId } = this.props.match.params

    const request = {
      ...parameters,
      method,
      projectId,
      applicationId,
      modelId,
      saveDescription: true
    }

    this.setState({ submitting: true, notified: false })
    return updateModel(request)
  }

}

type ModelDescriptionProps =
  StateProps & DispatchProps
  & RouteComponentProps<{projectId: number, applicationId: string, modelId: number}>
  & CustomProps

interface ModelDescriptionState {
  submitting: boolean
  notified: boolean
}

interface CustomProps {
  method: string
}

interface StateProps {
  fetchModelByIdStatus: APIRequest<Model>
  updateModelStatus: APIRequest<boolean>
}

const mapStateToProps = (state: any, extraProps: CustomProps) => (
  {
    fetchModelByIdStatus: state.fetchModelByIdReducer.fetchModelById,
    updateModelStatus: state.updateModelReducer.updateModel,
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
  )(ModelDescription)
)
