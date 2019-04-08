import * as React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import { Button, Table, Row } from 'reactstrap'
import { Formik, Form } from 'formik'

import { APIRequest } from '@src/apis/Core'
import { Service, Model } from '@src/apis'
import { ControlMode } from './index'
import { Checkbox, Radio } from '@common/Field'


class DashboardStatusForm extends React.Component<DashboardStatusFormProps, DashboardStatusFormState> {
  constructor(props, context) {
    super(props, context)

    this.handleDiscardChanges = this.handleDiscardChanges.bind(this)
    this.handleModeChanges = this.handleModeChanges.bind(this)
  }

  render() {
    const {
      onSubmit
    } = this.props

    return (
      <Formik
        initialValues={{
          status: this.props.initialValues.status,
          switch: this.props.initialValues.switch,
          delete_services: this.props.initialValues.delete.services,
          delete_models: this.props.initialValues.delete.models
        }}
        onSubmit={onSubmit}>
        {({ isInitialValid, isSubmitting }) => (
          <Form>
            {this.handleModeChanges(isInitialValid)}
            <div className='mb-2'>
              {this.renderSwitchModelsButton()}
            </div>
            <Table hover className='mb-3'>
              {this.renderTableHead()}
              {this.renderTableBody()}
            </Table>
            <hr />
            {this.renderSubmitButtons(isInitialValid, isSubmitting)}
          </Form>
        )}
      </Formik>
    )
  }

  renderSwitchModelsButton = () => {
    const { mode, changeMode, canEdit } = this.props

    if (!canEdit) {
      return null
    }
    switch (mode) {
      case ControlMode.EDIT_DEPLOY_STATUS:
      case ControlMode.SELECT_TARGETS:
        return (
          <Button outline color='danger' onClick={this.handleDiscardChanges}>
            <i className={`fas fa-times fa-fw mr-2`}></i>
            Discard changes
          </Button>
        )
      default:
        return (
          <div>
            <Button color='success'
              onClick={(event) => {changeMode(ControlMode.EDIT_DEPLOY_STATUS)}} >
              <i className={`fas fa-screwdriver fa-fw mr-2`}></i>
              Switch models
            </Button>
          </div>
        )
    }
  }

  /**
   * Render head row of the table
   *
   * Render Service names and label (`Models` and `Services`)
   * Each Service is rendered with a deploy check box on viewing/deleting mode
   * @param services Services to be shown (Currently show all, but should be filtered)
   */
  renderTableHead = () => {
    const { mode, projectId, applicationId, canEdit, services } = this.props

    // Button to delete Service (for deleting k8s services)
    const deleteCheckButton = (serviceName: string, serviceId: string) => {
      return (
        <Row>
          { canEdit ?
            <Checkbox name='delete_services' value={`service-${serviceId}`} label='' />
            : null }
          <Link className='text-info' to={`/projects/${projectId}/applications/${applicationId}/services/${serviceId}/edit`}>
            {serviceName}
          </Link>
        </Row>
      )
    }

    const renderButton = (serviceName, serviceId) => {
      const renderMap = {
        [ControlMode.VIEW_DEPLOY_STATUS] : deleteCheckButton(serviceName, serviceId),
        [ControlMode.SELECT_TARGETS] : deleteCheckButton(serviceName, serviceId),
        [ControlMode.EDIT_DEPLOY_STATUS]: <span>{serviceName}</span>
      }
      return renderMap[mode]
    }

    return (
      <thead>
      <tr className='bg-light'>
        <th scope='col' className='text-primary'>
          Models <span className='text-info'>\</span> Services
        </th>
        {/* Render services */}
        {services.map(
          (service: Service) => (
            <th key={service.name} scope='col'>
              {renderButton(service.name, service.serviceId)}
            </th>
          )
        )}
      </tr>
      </thead>
    )
  }

  /**
   * Render body of the table
   */
  renderTableBody = () => {
    const { models, projectId, applicationId, mode, canEdit } = this.props

    const deleteCheckButton = (modelName: string, modelId: string) => {
      const checkBox = (
        <Checkbox name='delete_models' value={modelId} label='' />
      )
      return (
        <Row>
          {canEdit ? checkBox : null}
          <Link className='text-info' to={`/projects/${projectId}/applications/${applicationId}/models/${modelId}/edit`}>
            {modelName}
          </Link>
        </Row>
      )
    }

    const renderButton = (modelName, modelId) => {
      const renderMap = {
        [ControlMode.VIEW_DEPLOY_STATUS] : deleteCheckButton(modelName, modelId),
        [ControlMode.SELECT_TARGETS] : deleteCheckButton(modelName, modelId),
        [ControlMode.EDIT_DEPLOY_STATUS]: <span>{modelName}</span>
      }
      return renderMap[mode]
    }

    return (
      <tbody>
      {
        models.map(
          (model: Model, index: number) => (
            <tr key={index}>
              <td>
                {renderButton(model.description, model.modelId)}
              </td>
              {this.renderStatusRow(model)}
            </tr>
          )
        )
      }
      </tbody>
    )
  }

  renderStatusRow = (model: Model) => (
    this.props.services.map(
      (service, index) => (
        <td key={index} className='transition-cell'>
          {this.renderStatusCell(service.serviceId, model)}
        </td>
      )
    )
  )

  renderStatusCell = (serviceId: string, model: Model) => {
    const { mode, deployStatus } = this.props

    if (mode !== ControlMode.VIEW_DEPLOY_STATUS) {
      return (
        <Radio name='switch' value={model.modelId} label='' />
      )
    }

    // View mode (Not able to change)
    if (deployStatus[serviceId] === model.modelId) {
      return (
        <i className='fas fa-check fa-fw text-success mr-2'></i>
      )
    }
    return (<div></div>)
  }

  /**
   * Render submit button(s)
   *
   * Show delete button if selected targets exist
   * Show save button if editing deploy status
   */
  renderSubmitButtons(isInitialValid, isSubmitting): JSX.Element {
    const { mode } = this.props

    const showSubmitButton: boolean = mode !== ControlMode.VIEW_DEPLOY_STATUS

    if (!showSubmitButton) {
      return null
    }

    const paramsMap = {
      [ControlMode.SELECT_TARGETS]: { color: 'danger', icon: 'trash', text: 'Delete Services/Models' },
      [ControlMode.EDIT_DEPLOY_STATUS]: { color: 'success', icon: 'save', text: 'Save Changes' }
    }

    // Submit button element(s)
    const buttons = (params) => (
      <div className='mb-2'>
        <Button
          color={params.color}
          className='mr-2'
          disabled={isInitialValid || isSubmitting}
          type='submit'
        >
          <i className={`fas fa-${params.icon} fa-fw mr-2`}></i>
          {params.text}
        </Button>
      </div>
    )

    const submittingLoader = (
      <div>
        <div className='loader loader-primary loader-xs mr-2'/>
        Submitting...
      </div>
    )

    return isSubmitting ? submittingLoader : buttons(paramsMap[mode])
  }

  // Handle event methods

  handleDiscardChanges(event): void {
    const { changeMode } = this.props
    changeMode(ControlMode.VIEW_DEPLOY_STATUS)
  }

  handleModeChanges(isInitialValid): void {
    const { mode, changeMode } = this.props
    if (mode === ControlMode.VIEW_DEPLOY_STATUS && !isInitialValid) {
      changeMode(ControlMode.SELECT_TARGETS)
    } else if (mode === ControlMode.SELECT_TARGETS && isInitialValid) {
      changeMode(ControlMode.VIEW_DEPLOY_STATUS)
    }
  }
}

interface DashboardStatusFormCustomProps {
  projectId
  applicationId
  mode: ControlMode
  services: Service[]
  models: Model[]
  deployStatus
  canEdit: boolean
  onSubmit: (e) => Promise<void>
  changeMode: (mode: ControlMode) => void
}

interface StateProps {
  switchModelsStatus: APIRequest<boolean[]>
  initialValues: {
    status
    switch
    delete
  }
}

const mapStateToProps = (state: any, extraProps: DashboardStatusFormCustomProps) => {
  // Map of service ID to delete flag
  const initialServiceStatus: { [x: string]: boolean } =
    extraProps.services
    .map((service) => ({[service.serviceId]: false}))
    .reduce((l, r) => Object.assign(l, r), {})
  const initialModelStatus: { [x: string]: boolean } =
    extraProps.models
      .map((model) => ({[model.modelId]: false}))
      .reduce((l, r) => Object.assign(l, r), {})

  return {
    ...state.form,
    initialValues: {
      status: extraProps.deployStatus,
      switch: extraProps.deployStatus,
      delete: {
        services: initialServiceStatus,
        models: initialModelStatus
      }
    }
  }
}

const mapDispatchToProps = (dispatch): {} => {
  return { }
}

type DashboardStatusFormProps　= StateProps & DashboardStatusFormCustomProps

interface DashboardStatusFormState {}

export default connect(mapStateToProps, mapDispatchToProps)(DashboardStatusForm)
