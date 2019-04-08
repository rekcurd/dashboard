import * as React from 'react'
import { connect } from 'react-redux'
import { Button, Table, Row } from 'reactstrap'
import { Link } from 'react-router-dom'
import { Formik, Form } from 'formik'

import { Service } from '@src/apis'
import { ControlMode } from './index'
import { Checkbox } from '@common/Field'


class ServicesDeleteForm extends React.Component<ServicesDeleteFormProps, ServiceDeleteFormCustomState> {
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
          delete_services: this.props.initialValues.delete.services
        }}
        onSubmit={onSubmit}>
        {({ isInitialValid, isSubmitting }) => (
          <Form>
            {this.handleModeChanges(isInitialValid)}
            <div className='mb-2'>
              {this.renderDiscardButton()}
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

  /**
   * Render head row of the table
   */
  renderTableHead = () => {
    return (
      <thead>
      <tr className='bg-light text-primary'>
        <th>Name</th>
        <th>Service Level</th>
        <th>Version</th>
        <th>Model ID</th>
        <th>Description</th>
        <th>Host:Port</th>
        <th>Registered Date</th>
      </tr>
      </thead>
    )
  }

  /**
   * Render body of the table
   *
   * Render Service names
   * Each Service is rendered with a deploy check box on viewing/deleting mode
   * @param services Services to be shown (Currently show all, but should be filtered)
   */
  renderTableBody = () => {
    const { projectId, applicationId, canEdit, services } = this.props

    // Button to delete Service (for deleting k8s services)
    const deleteCheckButton = (serviceName: string, serviceId: string) => {
      return (
        <Row>
          { canEdit ?
            <Checkbox name='delete_services' value={serviceId} label='' />
            : null }
          <Link className='text-info' to={`/projects/${projectId}/applications/${applicationId}/services/${serviceId}/edit`}>
            {serviceName}
          </Link>
        </Row>
      )
    }

    return (
      <tbody>
      {services.map(
        (service: Service, index: number) => (
          <tr key={index}>
            <td key={service.name} scope='col'>
              {deleteCheckButton(service.name, service.serviceId)}
            </td>
            <td>
              {service.serviceLevel}
            </td>
            <td>
              {service.version}
            </td>
            <td>
              {service.modelId}
            </td>
            <td>
              {service.description}
            </td>
            <td>
              {service.insecureHost}:{service.insecurePort}
            </td>
            <td>
              {service.registerDate.toUTCString()}
            </td>
          </tr>
        )
      )}
      </tbody>
    )
  }

  renderDiscardButton = () => {
    const { mode } = this.props

    switch (mode) {
      case ControlMode.SELECT_TARGETS:
        return (
          <Button outline color='danger' onClick={this.handleDiscardChanges}>
            <i className={`fas fa-times fa-fw mr-2`}></i>
            Discard changes
          </Button>
        )
      default:
        return null
    }
  }

  /**
   * Render submit button(s)
   *
   * Show delete button if selected targets exist
   * Show save button if editing deploy status
   */
  renderSubmitButtons(isInitialValid, isSubmitting): JSX.Element {
    const { mode } = this.props

    const showSubmitButton: boolean = mode !== ControlMode.VIEW_SERVICES_STATUS

    if (!showSubmitButton) {
      return null
    }

    const paramsMap = {
      [ControlMode.SELECT_TARGETS]: { color: 'danger', icon: 'trash', text: 'Delete Services' },
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
    changeMode(ControlMode.VIEW_SERVICES_STATUS)
  }

  handleModeChanges(isInitialValid): void {
    const { mode, changeMode } = this.props
    if (mode === ControlMode.VIEW_SERVICES_STATUS && !isInitialValid) {
      changeMode(ControlMode.SELECT_TARGETS)
    } else if (mode === ControlMode.SELECT_TARGETS && isInitialValid) {
      changeMode(ControlMode.VIEW_SERVICES_STATUS)
    }
  }
}

interface ServicesDeleteFormCustomProps {
  projectId
  applicationId
  mode: ControlMode
  services: Service[]
  canEdit: boolean
  onSubmit: (e) => void
  changeMode: (mode: ControlMode) => void
}

interface ServiceDeleteFormCustomState {}

interface StateProps {
  initialValues: {
    status
    delete
  }
}

const mapStateToProps = (state: any, extraProps: ServicesDeleteFormCustomProps) => {
  // Map of service ID to delete flag
  const initialDeleteStatus: { [x: string]: boolean } =
    extraProps.services
    .map((service) => ({[service.serviceId]: false}))
    .reduce((l, r) => Object.assign(l, r), {})

  return {
    ...state.form,
    initialValues: {
      delete: {
        services: initialDeleteStatus
      }
    }
  }
}

const mapDispatchToProps = (dispatch): {} => {
  return { }
}

type ServicesDeleteFormProps = StateProps & ServicesDeleteFormCustomProps

export default connect(mapStateToProps, mapDispatchToProps)(ServicesDeleteForm)
