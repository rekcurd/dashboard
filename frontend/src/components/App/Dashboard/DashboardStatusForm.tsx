import * as React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import { Button, Table, Row } from 'reactstrap'
import { Formik, Form } from 'formik'

import { APIRequest } from '@src/apis/Core'
import { Service, Model } from '@src/apis'
import { Checkbox, Radio } from '@common/Field'


class DashboardStatusForm extends React.Component<DashboardStatusFormProps, DashboardStatusFormState> {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    const { onSubmit } = this.props
    const initialValues = {
      status: this.props.initialValues.switch,
      switch: this.props.initialValues.switch,
      delete_services: this.props.initialValues.delete.services,
      delete_models: this.props.initialValues.delete.models
    }

    return (
      <Formik
        initialValues={initialValues}
        onSubmit={onSubmit} >
        {({ isValid, isSubmitting, resetForm }) => (
          <Form>
            <div className='mb-2'>
              {this.renderTopButton(isValid, resetForm, initialValues)}
            </div>
            <Table hover className='mb-3'>
              {this.renderTableHead()}
              {this.renderTableBody()}
            </Table>
            <hr />
            {this.renderSubmitButtons(isValid, isSubmitting)}
          </Form>
        )}
      </Formik>
    )
  }

  renderTopButton = (isValid, resetForm, initialValues) => {
    const { canEdit, isSwitchMode, toggleSwitchMode, onCancel } = this.props

    if (!canEdit) {
      return null
    }
    if (isValid || isSwitchMode) {
      return (
        <Button outline color='danger' onClick={() => {onCancel(); resetForm(initialValues);}}>
          <i className={`fas fa-times fa-fw mr-2`}></i>
          Discard changes
        </Button>
      )
    } else {
      return (
        <Button color='success'
                type='button'
                onClick={toggleSwitchMode} >
          <i className={`fas fa-screwdriver fa-fw mr-2`}></i>
          Switch models
        </Button>
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
    const { projectId, applicationId, canEdit, isSwitchMode, services } = this.props

    // Button to delete Service (for deleting k8s services)
    const deleteCheckButton = (serviceName: string, serviceId: string) => {
      return (
        <Row>
          { canEdit && !isSwitchMode ?
            <Checkbox name='delete_services' value={serviceId} label='' />
            : null }
          <Link className='text-info' to={`/projects/${projectId}/applications/${applicationId}/services/${serviceId}/edit`}>
            {serviceName}
          </Link>
        </Row>
      )
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
              {deleteCheckButton(service.name, service.serviceId)}
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
    const { models, projectId, applicationId, canEdit, isSwitchMode } = this.props

    const deleteCheckButton = (modelName: string, modelId: string) => {
      const checkBox = (
        <Checkbox name='delete_models' value={modelId} label='' />
      )
      return (
        <Row>
          {canEdit && !isSwitchMode ? checkBox : null}
          <Link className='text-info' to={`/projects/${projectId}/applications/${applicationId}/models/${modelId}/edit`}>
            {`${modelId}: ${modelName}`}
          </Link>
        </Row>
      )
    }

    return (
      <tbody>
      {
        models.map(
          (model: Model, index: number) => (
            <tr key={index}>
              <td>
                {deleteCheckButton(model.description, model.modelId.toString())}
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
    const { isSwitchMode, deployStatus } = this.props

    if (isSwitchMode) {
      return (
        <Radio name='switch' id={serviceId} value={model.modelId} label='' />
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
  renderSubmitButtons(isValid, isSubmitting): JSX.Element {
    const { isSwitchMode } = this.props

    if (!isValid) {
      return null
    }

    const paramsMap = [
      { color: 'danger', icon: 'trash', text: 'Delete Services/Models' },
      { color: 'success', icon: 'save', text: 'Switch Models' }
    ]

    // Submit button element(s)
    const buttons = (params) => (
      <div className='mb-2'>
        <Button
          color={params.color}
          className='mr-2'
          disabled={!isValid || isSubmitting}
          type='submit'>
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

    return isSubmitting ? submittingLoader : isSwitchMode ? buttons(paramsMap[1]) : buttons(paramsMap[0])
  }
}

interface DashboardStatusFormCustomProps {
  projectId
  applicationId
  services: Service[]
  models: Model[]
  deployStatus
  canEdit: boolean
  isSwitchMode: boolean
  toggleSwitchMode
  onSubmit
  onCancel
}

interface StateProps {
  switchModelsStatus: APIRequest<boolean[]>
  initialValues: {
    switch
    delete
  }
}

const mapStateToProps = (state: any, extraProps: DashboardStatusFormCustomProps) => {
  return {
    ...state.form,
    ...extraProps,
    initialValues: {
      switch: extraProps.deployStatus,
      delete: {
        services: [],
        models: []
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
