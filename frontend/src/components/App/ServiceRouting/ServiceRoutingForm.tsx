import * as React from 'react'
import { connect } from 'react-redux'
import { Button, Table, Row } from 'reactstrap'
import { Link } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from "yup";

import { ServiceRouting, ServiceRoutingWeight } from '@src/apis'


const ServiceRoutingSchema = Yup.object().shape({
  serviceWeights: Yup.array()
    .required('Required')
    .of(Yup.object().shape({
      serviceId: Yup.string()
        .required('Required')
        .max(32),
      serviceWeight: Yup.number()
        .required('Required')
        .integer()
        .min(0)
        .max(100)
    }))
});

class ServiceRoutingForm extends React.Component<ServiceRoutingFormProps, ServiceRoutingFormCustomState> {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    const { onSubmit, onCancel, routings } = this.props

    let initialValues = {serviceWeights: []}
    routings.serviceWeights.map((serviceWeight: ServiceRoutingWeight) => {
      initialValues["serviceWeights"].push({
        serviceId: serviceWeight.serviceId, serviceWeight: serviceWeight.serviceWeight
      })
    })

    return (
      <Formik
        initialValues={initialValues}
        validationSchema={ServiceRoutingSchema}
        onSubmit={onSubmit}
        onReset={onCancel}>
        {({ isValid, isSubmitting, resetForm, values }) => (
          <Form>
            <div className='mb-2'>
              {this.renderDiscardButton(isValid, resetForm, initialValues)}
            </div>
            <Table hover className='mb-3'>
              {this.renderTableHead()}
              {this.renderTableBody()}
              {this.renderTableFoot(values)}
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
        <th>Service Name</th>
        <th>Weight</th>
      </tr>
      </thead>
    )
  }

  /**
   * Render body of the table
   *
   * Render Model names
   * Each Model is rendered with a deploy check box on viewing/deleting mode
   * @param models Models to be shown (Currently show all, but should be filtered)
   */
  renderTableBody = () => {
    const { projectId, applicationId, canEdit, routings } = this.props

    return (
      <tbody>
      {routings.serviceWeights.map(
        (weight: ServiceRoutingWeight, index: number) => (
          <tr key={index}>
            <td key={weight.serviceId} scope='col'>
              <Link className='text-info' to={`/projects/${projectId}/applications/${applicationId}/services/${weight.serviceId}/edit`}>
                {weight.displayName}
              </Link>
            </td>
            <td>
              <Field
                name={`serviceWeights[${index}]['serviceId']`}
                type='hidden' />
              <Field
                name={`serviceWeights[${index}]['serviceWeight']`}
                readOnly={!canEdit} />
              <ErrorMessage name={`serviceWeights[${index}]['serviceWeight']`}>
                {msg => <div style={{color: 'red'}}>{msg}</div>}
              </ErrorMessage>
            </td>
          </tr>
        )
      )}
      </tbody>
    )
  }

  renderTableFoot = (values) => {
    const sumWeight = Number(values.serviceWeights.map((serviceWeight) => serviceWeight.serviceWeight).reduce((a: number, v: number) => a + v, 0))
    const warningMessage = (sumWeight !== 100) ? (<div style={{color: 'red'}}>Total weight must be "100"</div>) : null
    return (
      <tfoot>
        <tr>
          <td>Total</td>
          <td>{sumWeight} {warningMessage}</td>
        </tr>
      </tfoot>
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
          color='success'
          className='mr-2'
          disabled={!isValid || isSubmitting}
          type='submit'
        >
          <i className={`fas fa-trash fa-fw mr-2`}></i>
          Update Weight
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

interface ServiceRoutingFormCustomProps {
  projectId: number
  applicationId: string
  canEdit: boolean
  routings: ServiceRouting
  onSubmit
  onCancel
}

interface ServiceRoutingFormCustomState {}

interface StateProps {}

const mapStateToProps = (state: any, extraProps: ServiceRoutingFormCustomProps) => {
  return {
    ...state.form,
    ...extraProps
  }
}

const mapDispatchToProps = (dispatch): {} => {
  return { }
}

type ServiceRoutingFormProps = StateProps & ServiceRoutingFormCustomProps

export default connect(mapStateToProps, mapDispatchToProps)(ServiceRoutingForm)
