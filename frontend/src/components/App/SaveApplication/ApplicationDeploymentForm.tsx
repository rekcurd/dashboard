import * as React from 'react'
import { connect } from 'react-redux'
import { Card, CardBody, Button } from 'reactstrap'
import { Formik, Form, ErrorMessage, Field } from 'formik'
import * as Yup from "yup";


const ApplicationSchema = Yup.object().shape({
  application_name: Yup.string()
    .required('Required')
    .max(128),
  description: Yup.string(),
});

class ApplicationDeploymentFormImpl extends React.Component<AddApplicationFormProps> {
  /**
   * Render form bodies to add application
   *
   */
  render() {
    const { onSubmit } = this.props

    return (
      <React.Fragment>
        <h1 className='mb-3'>
          <i className='fas fa-anchor fa-fw mr-2'></i>
          Add Application
        </h1>

        <Formik
          initialValues={{
            application_name: '',
            description: '',
          }}
          validationSchema={ApplicationSchema}
          onSubmit={onSubmit}>
          {({ errors, touched }) => (
            <Form>
              <Card className='mb-3'>
                <CardBody>
                  <Field name="application_name" placeholder="Display name"/>
                  {errors.application_name && touched.application_name ? (
                    <div>{errors.application_name}</div>
                  ) : null}
                  <ErrorMessage name="application_name" />
                  <Field name="description" component="textarea" placeholder="Description"/>
                  {errors.description && touched.description ? (
                    <div>{errors.description}</div>
                  ) : null}
                  <ErrorMessage name="description" />
                </CardBody>
              </Card>
              {this.renderButtons()}
            </Form>
          )}
        </Formik>
      </React.Fragment>
    )
  }

  /**
   * Render control buttons
   *
   * Put on footer of this modal
   */
  renderButtons() {
    const { onSubmit, onCancel, submitting } = this.props
    if (submitting) {
      return (
        <Card className='mb-3'>
          <CardBody>
            <div className='loader loader-primary loader-xs mr-2' />
            Submitting...
          </CardBody>
        </Card>
      )
    }

    return (
      <Card className='mb-3'>
        <CardBody className='text-right'>
          <Button color='success' onClick={onSubmit}>
            <i className='fas fa-check fa-fw mr-2'></i>
            Create Application
          </Button>
          {' '}
          <Button outline color='info' onClick={onCancel}>
            <i className='fas fa-ban fa-fw mr-2'></i>
            Reset
          </Button>
        </CardBody>
      </Card>
    )
  }
}

export interface FormCustomProps {
  submitting
  onCancel
  onSubmit
}

type AddApplicationFormProps = FormCustomProps

export const ApplicationDeloymentForm =
  connect(
    (state: any, extraProps: FormCustomProps) => ({
      ...extraProps,
      ...state.form
    })
  )(ApplicationDeploymentFormImpl)
