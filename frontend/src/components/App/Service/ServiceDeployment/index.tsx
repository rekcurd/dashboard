import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Alert, Card, CardBody, Button, Input, Label } from 'reactstrap'
import { Formik, Form } from 'formik'
import * as Yup from "yup";

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  Service, Model, FetchServiceByIdParam,
  FetchModelByIdParam, ServiceDeploymentParam, UpdateServiceParam, UserInfo
} from '@src/apis'
import {
  fetchServiceByIdDispatcher,
  fetchAllModelsDispatcher,
  saveServiceDeploymentDispatcher,
  updateServiceDispatcher,
  userInfoDispatcher,
  addNotification
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import * as ServiceDescriptionForm from './ServiceDescriptionForm'
import * as ServiceConfigForm from './ServiceConfigForm'
import * as ServiceDeploymentForm from './ServiceDeploymentForm'


const UpdateFlagSchema = {
  isUpdate: Yup.boolean()
    .required('Required')
}

const UpdateFlagInitialValues = {
  isUpdate: false
}

/**
 * Page for adding service
 * You can create service ONLY when your application is deployed with Kubernetes.
 */
class ServiceDeployment extends React.Component<SaveServiceProps, SaveServiceState> {
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
    this.props.fetchAllModels(this.props.match.params)
    if (this.props.method === 'patch') {
      this.props.fetchServiceById({
        isKubernetes: this.props.kubernetesMode,
        isOnlyDescription: false,
        serviceId: this.props.match.params.serviceId,
        ...this.props.match.params
      })
    }
  }

  static getDerivedStateFromProps(nextProps: SaveServiceProps, prevState: SaveServiceState){
    const { updateServiceStatus, saveServiceDeploymentStatus } = nextProps
    const { push } = nextProps.history
    const { projectId, applicationId } = nextProps.match.params
    const { submitting, notified } = prevState

    // Close modal when API successfully finished
    if (submitting && !notified) {
      const deploySucceeded: boolean = isAPISucceeded<boolean>(saveServiceDeploymentStatus) && saveServiceDeploymentStatus.result
      const deployFailed: boolean = (isAPISucceeded<boolean>(saveServiceDeploymentStatus) && !saveServiceDeploymentStatus.result) || isAPIFailed<boolean>(saveServiceDeploymentStatus)
      if (deploySucceeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully saved service' })
        push(`/projects/${projectId}/applications/${applicationId}`)
        return { submitting: false, notified: true }
      } else if (deployFailed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        return { submitting: false, notified: true }
      }

      const updateSucceeded: boolean = isAPISucceeded<boolean>(updateServiceStatus) && updateServiceStatus.result
      const updateFailed: boolean = (isAPISucceeded<boolean>(updateServiceStatus) && !updateServiceStatus.result) || isAPIFailed<boolean>(updateServiceStatus)
      if (updateSucceeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully updated service' })
        push(`/projects/${projectId}/applications/${applicationId}`)
        return { submitting: false, notified: true }
      } else if (updateFailed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        return { submitting: false, notified: true }
      }
    }
    return null
  }

  render() {
    const { method, fetchServiceByIdStatus, fetchAllModelsStatus, userInfoStatus, settings } = this.props
    const targetStatus: any = (method === 'patch') ?
      {service: fetchServiceByIdStatus, models: fetchAllModelsStatus} :
      {models: fetchAllModelsStatus}

    if (isAPISucceeded(settings) && settings.result.auth) {
      targetStatus.userInfoStatus = userInfoStatus
    }
    return(
      <APIRequestResultsRenderer
        render={this.renderForm}
        APIStatus={targetStatus}
        projectId={this.props.match.params.projectId}
        applicationId={this.props.match.params.applicationId}
      />
    )
  }

  renderForm(params, canEdit) {
    const { projectId, applicationId } = this.props.match.params
    const { kubernetesMode, method } = this.props

    if (!canEdit) {
      this.props.history.push(`/projects/${projectId}/applications/${applicationId}`)
      this.props.addNotification({ color: 'error', message: "You don't have a permission. Contact your Project admin." })
    }
    if (params.models.length === 0) {
      this.props.history.push(`/projects/${projectId}/applications/${applicationId}`)
      this.props.addNotification({ color: 'error', message: 'No models available. Please add your model firstly.' })
    }

    const ValidationSchema = this.setValidationSchema(kubernetesMode, method)
    const InitialValues = this.setInitialValues(kubernetesMode, method, params)
    const FormikContents = (
      <Formik
        initialValues={InitialValues}
        validationSchema={ValidationSchema}
        onSubmit={this.onSubmit}
        onReset={this.onCancel}>
        {({ isSubmitting, setFieldValue }) => (
          <Form>
            {this.setFormContent(kubernetesMode, method, params, isSubmitting, setFieldValue)}
            {this.renderButtons(isSubmitting)}
          </Form>
        )}
      </Formik>
    )

    return (
      <React.Fragment>
        { FormikContents }
      </React.Fragment>
    )
  }

  setValidationSchema(kubernetesMode, method) {
    if (kubernetesMode) {
      if (method === 'post') {
        return Yup.object().shape({
          ...ServiceDescriptionForm.ServiceDescriptionSchema,
          ...ServiceConfigForm.ServiceConfigSchema,
          ...ServiceDeploymentForm.ServiceDeploymentSchema
        })
      } else {
        return Yup.object().shape({
          ...ServiceDescriptionForm.ServiceDescriptionSchema,
          ...UpdateFlagSchema,
          ...ServiceConfigForm.ServiceConfigSchema,
          ...ServiceDeploymentForm.ServiceDeploymentSchema
        })
      }
    } else {
      if (method === 'post') {
        return Yup.object().shape({
          ...ServiceDescriptionForm.ServiceDescriptionSchema,
          ...ServiceConfigForm.ServiceConfigSchema,
        })
      } else {
        return Yup.object().shape({
          ...ServiceDescriptionForm.ServiceDescriptionSchema,
          ...UpdateFlagSchema,
          ...ServiceConfigForm.ServiceConfigSchema,
        })
      }
    }
  }

  setInitialValues(kubernetesMode, method, params) {
    if (kubernetesMode) {
      if (method === 'post') {
        return {
          ...ServiceDescriptionForm.ServiceDescriptionDefaultInitialValues,
          ...ServiceConfigForm.ServiceConfigDefaultInitialValues,
          ...ServiceDeploymentForm.ServiceDeploymentDefaultInitialValues
        }
      } else {
        return {
          ...UpdateFlagInitialValues,
          serviceModelAssignment: params.service.modelId,
          ...params.service
        }
      }
    } else {
      if (method === 'post') {
        return {
          ...ServiceDescriptionForm.ServiceDescriptionDefaultInitialValues,
          ...ServiceConfigForm.ServiceConfigDefaultInitialValues
        }
      } else {
        return {
          ...UpdateFlagInitialValues,
          serviceModelAssignment: params.service.modelId,
          ...params.service
        }
      }
    }
  }

  setFormContent(kubernetesMode, method, params, isSubmitting, setFieldValue) {
    const isPost = (method === 'post')
    if (kubernetesMode) {
      if (isPost) {
        return (
          <React.Fragment>
            <ServiceDescriptionForm.ServiceDescriptionForm />
            <ServiceConfigForm.ServiceConfigForm models={params.models}/>
            <ServiceDeploymentForm.ServiceDeploymentForm />
          </React.Fragment>
        )
      } else {
        return (
          <React.Fragment>
            <ServiceDescriptionForm.ServiceDescriptionForm />
            {this.renderUpdateButtons(isSubmitting, setFieldValue)}
            <ServiceConfigForm.ServiceConfigForm models={params.models}/>
            <ServiceDeploymentForm.ServiceDeploymentForm />
          </React.Fragment>
        )
      }
    } else {
      if (isPost) {
        return (
          <React.Fragment>
            <ServiceDescriptionForm.ServiceDescriptionForm />
            <ServiceConfigForm.ServiceConfigForm models={params.models}/>
          </React.Fragment>
        )
      } else {
        return (
          <React.Fragment>
            <ServiceDescriptionForm.ServiceDescriptionForm />
            {this.renderUpdateButtons(isSubmitting, setFieldValue)}
            <ServiceConfigForm.ServiceConfigForm models={params.models}/>
          </React.Fragment>
        )
      }
    }
  }

  /**
   * Render control buttons
   *
   * Put on footer of this modal
   */
  renderButtons(isSubmitting): JSX.Element {
    const { method, kubernetesMode } = this.props

    if (isSubmitting) {
      return (
        <div className='text-right mb-3'>
          <div className='loader loader-primary loader-xs mr-2' />
          Submitting...
        </div>
      )
    }

    return (
      <div className='text-right mb-3'>
        <Button color='success' type='submit'>
          <i className='fas fa-check fa-fw mr-2'></i>
          {method === 'post' ? 'Add New Service' : kubernetesMode ? 'Rolling Deploying' : 'Deploying'}
        </Button>
        {' '}
        <Button outline color='info' type='reset'>
          <i className='fas fa-ban fa-fw mr-2'></i>
          Reset
        </Button>
      </div>
    )
  }

  renderUpdateButtons(isSubmitting, setFieldValue): JSX.Element {
    if (isSubmitting) {
      return (
        <div className='text-right mb-3'>
          <div className='loader loader-primary loader-xs mr-2' />
          Submitting...
        </div>
      )
    }

    return (
      <div className='text-right mb-3'>
        <Input name="isUpdate" type="hidden" />
        <Button color='success' type='submit' onClick={()=>{setFieldValue('isUpdate', true)}}>
          <i className='fas fa-check fa-fw mr-2'></i>
          Update without deploying
        </Button>
        {' '}
        <Button outline color='info' type='reset'>
          <i className='fas fa-ban fa-fw mr-2'></i>
          Reset
        </Button>
      </div>
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

  onSubmit(parameters) {
    const { kubernetesMode, method } = this.props
    if (parameters["isUpdate"]) {
      this.onServiceInfoUpdateSubmit(parameters)
    } else if (!kubernetesMode && (method === 'patch')) {
      this.onServiceInfoUpdateSubmit(parameters)
    } else {
      this.onDeploymentSubmit(parameters)
    }
  }

  onServiceInfoUpdateSubmit(parameters) {
    const { updateServiceDeployment, method } = this.props
    const { projectId, applicationId, serviceId } = this.props.match.params

    const request: UpdateServiceParam = {
      projectId,
      applicationId,
      serviceId,
      method,
      ...parameters
    }

    this.setState({ submitting: true, notified: false })
    return updateServiceDeployment(request)
  }

  onDeploymentSubmit(parameters) {
    const { saveServiceDeployment, kubernetesMode, method } = this.props
    const { projectId, applicationId } = this.props.match.params

    const request: ServiceDeploymentParam = {
      projectId,
      applicationId,
      isKubernetes: kubernetesMode,
      method,
      ...parameters
    }

    this.setState({ submitting: true, notified: false })
    return saveServiceDeployment(request)
  }
}

type SaveServiceProps =
  StateProps & DispatchProps
  & RouteComponentProps<{projectId: number, applicationId: string, serviceId?: string}>
  & CustomProps

interface SaveServiceState {
  submitting: boolean
  notified: boolean
}

interface CustomProps {
  method: string
  kubernetesMode: boolean
}

interface StateProps {
  fetchServiceByIdStatus: APIRequest<Service>
  fetchAllModelsStatus: APIRequest<Model[]>
  saveServiceDeploymentStatus: APIRequest<boolean>
  updateServiceStatus: APIRequest<boolean>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state: any, extraProps: CustomProps) => (
  {
    fetchServiceByIdStatus: state.fetchServiceByIdReducer.fetchServiceById,
    fetchAllModelsStatus: state.fetchAllModelsReducer.fetchAllModels,
    saveServiceDeploymentStatus: state.saveServiceDeploymentReducer.saveServiceDeployment,
    updateServiceStatus: state.updateServiceReducer.updateService,
    userInfoStatus: state.userInfoReducer.userInfo,
    settings: state.settingsReducer.settings,
    ...state.form,
    ...extraProps
  }
)

export interface DispatchProps {
  fetchServiceById: (params: FetchServiceByIdParam) => Promise<void>
  fetchAllModels: (params: FetchModelByIdParam) => Promise<void>
  saveServiceDeployment: (params: ServiceDeploymentParam) => Promise<void>
  updateServiceDeployment: (params: UpdateServiceParam) => Promise<void>
  userInfo: () => Promise<void>
  addNotification: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchServiceById: (params: FetchServiceByIdParam) => fetchServiceByIdDispatcher(dispatch, params),
    fetchAllModels: (params: FetchModelByIdParam) => fetchAllModelsDispatcher(dispatch, params),
    saveServiceDeployment: (params: ServiceDeploymentParam) => saveServiceDeploymentDispatcher(dispatch, params),
    updateServiceDeployment: (params: UpdateServiceParam) => updateServiceDispatcher(dispatch, params),
    userInfo: () => userInfoDispatcher(dispatch),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, CustomProps & RouteComponentProps<{projectId: number, applicationId: string, serviceId?: string}> & CustomProps>(
    mapStateToProps, mapDispatchToProps
  )(ServiceDeployment)
)
