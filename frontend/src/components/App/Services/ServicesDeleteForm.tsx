import * as React from 'react'
import { connect } from 'react-redux'
import { Button, Table, Row } from 'reactstrap'
import { Link } from 'react-router-dom'
import { Formik, Form } from 'formik'

import { Service } from '@src/apis'
import { Checkbox } from '@common/Field'


class ServicesDeleteForm extends React.Component<ServicesDeleteFormProps, ServiceDeleteFormCustomState> {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    const { onSubmit, onCancel } = this.props
    const initialValues = {
      delete_services: this.props.initialValues.delete.services
    }

    return (
      <Formik
        initialValues={initialValues}
        onSubmit={(values, {setSubmitting}) => {
          onSubmit(values).then(
            result => {
              setSubmitting(false)
            },
            errors => {
              setSubmitting(false)
            }
          )}
        }
        onReset={onCancel} >
        {({ isValid, isSubmitting, resetForm }) => (
          <Form>
            <div className='mb-2'>
              {this.renderDiscardButton(isValid, resetForm, initialValues)}
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
        <th>Host</th>
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
            <Checkbox id={serviceId} name='delete_services' value={serviceId} label='' />
            : null }
          <Link className='text-info' to={`/projects/${projectId}/applications/${applicationId}/services/${serviceId}/edit`}>
            {serviceName}
          </Link>
        </Row>
      )
    }

    const modelLink = (modelId: number) => (
      <Link className='text-info' to={`/projects/${projectId}/applications/${applicationId}/models/${modelId}/edit`}>
        {modelId}
      </Link>
    )

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
              {modelLink(service.modelId)}
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

  renderDiscardButton = (isValid, resetForm, initialValues) => {
    const { canEdit, onCancel } = this.props

    if (!canEdit) {
      return null
    }
    if (isValid) {
      return (
        <Button outline color='danger' onClick={() => {onCancel(); resetForm(initialValues);}}>
          <i className={`fas fa-times fa-fw mr-2`}></i>
          Discard changes
        </Button>
      )
    } else {
      return null
    }
  }

  /**
   * Render submit button(s)
   *
   * Show delete button if selected targets exist
   * Show save button if editing deploy status
   */
  renderSubmitButtons(isValid, isSubmitting): JSX.Element {
    if (!isValid) {
      return null
    }

    // Submit button element(s)
    const buttons = (
      <div className='mb-2'>
        <Button
          color='danger'
          className='mr-2'
          disabled={!isValid || isSubmitting}
          type='submit'>
          <i className={`fas fa-trash fa-fw mr-2`}></i>
          Delete Services
        </Button>
      </div>
    )

    const submittingLoader = (
      <div>
        <div className='loader loader-primary loader-xs mr-2'/>
        Submitting...
      </div>
    )

    return isSubmitting ? submittingLoader : buttons
  }
}

interface ServicesDeleteFormCustomProps {
  projectId
  applicationId
  services: Service[]
  canEdit: boolean
  onSubmit
  onCancel
}

interface ServiceDeleteFormCustomState {}

interface StateProps {
  initialValues: {
    delete
  }
}

const mapStateToProps = (state: any, extraProps: ServicesDeleteFormCustomProps) => {
  return {
    initialValues: {
      delete: {
        services: []
      }
    }
  }
}

const mapDispatchToProps = (dispatch): {} => {
  return { }
}

type ServicesDeleteFormProps = StateProps & ServicesDeleteFormCustomProps

export default connect(mapStateToProps, mapDispatchToProps)(ServicesDeleteForm)
