import * as React from 'react'
import { connect } from 'react-redux'
import { reduxForm, InjectedFormProps, Field } from 'redux-form'
import { Card, CardBody, Form, Button } from 'reactstrap'

import { Service } from '@src/apis'
import { SingleFormField } from '@common/Field/SingleFormField'
import { required } from '@common/Field/Validateors'

class ServiceDescriptionFormImpl extends React.Component<ServiceDescriptionFormProps> {
  render() {
    const { handleSubmit, onSubmit } = this.props
    const serviceSpeicificForm = this.renderServiceSpecificForm()

    return (
      <React.Fragment>
        <Card className='mb-3'>
          <Form onSubmit={handleSubmit(onSubmit)}>
            {serviceSpeicificForm}
            {this.renderButtons()}
          </Form>
        </Card>
      </React.Fragment>
    )
  }

  /**
   *
   *
   * @param applicationType Type of application to set up
   * @returns {JSX.Element} Config fields
   */
  renderServiceSpecificForm(): JSX.Element {

    return (
      <CardBody>
        <Field
          name='edit.service.displayName'
          label='Display Name'
          component={SingleFormField} type='text'
          className='form-control' id='displayName'
          formText='Display name shown in the table'
          validate={required}
          required
        />
        <Field
          name='edit.service.description'
          label='Description'
          component={SingleFormField} type='textarea'
          className='form-control' id='descriptionB'
          formText='Description shown in the table'
        />
      </CardBody>
    )
  }

  /**
   * Render control buttons
   *
   * Put on footer of this modal
   */
  renderButtons(): JSX.Element {
    const { submitting, reset } = this.props

    if (submitting) {
      return (
        <CardBody>
          <div className='loader loader-primary loader-xs mr-2' />
          Submitting...
        </CardBody>
      )
    }

    return (
        <CardBody className='text-right'>
          <Button color='success' type='submit'>
            <i className='fas fa-check fa-fw mr-2'></i>
            Update Service Description
          </Button>
          {' '}
          <Button outline color='info' onClick={reset}>
            <i className='fas fa-ban fa-fw mr-2'></i>
            Reset
          </Button>
        </CardBody>
    )
  }
}

interface CustomProps {
  onCancel
  onSubmit
  service?: Service
}

interface StateProps {
  initialValues
}

type ServiceDescriptionFormProps =
  CustomProps
  & StateProps
  & InjectedFormProps<{}, CustomProps>

const generateInitialValues = (props: CustomProps) => (
  {
    edit: {
      service: {
        ...props.service,
      }
    }
  }
)

/**
 * Description form
 * Shown only when description
 */
export const ServiceDescriptionForm =
  connect(
    (state: any, extraProps: CustomProps) => ({
      initialValues: generateInitialValues(extraProps),
      ...extraProps,
      ...state.form
    })
  )(reduxForm<{}, CustomProps>({
    form: 'serviceDescriptionForm',
    touchOnChange: true,
    enableReinitialize: true
  })(ServiceDescriptionFormImpl))
