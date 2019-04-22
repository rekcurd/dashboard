import * as React from 'react'
import { connect } from 'react-redux'
import { Card, CardBody, Button } from 'reactstrap'
import { Formik, Form, Field } from 'formik'
import * as Yup from "yup";

import { FormikInput } from '@common/Field'


const ProjectSchema = Yup.object().shape({
  displayName: Yup.string()
    .required('Required')
    .max(128),
  useKubernetes: Yup.boolean()
    .required('Required'),
  description: Yup.string(),
});

class ProjectDeploymentFormImpl extends React.Component<SaveProjectFormProps> {
  /**
   * Render form bodies to add project
   *
   */
  render() {
    const { onSubmit, onCancel } = this.props
    const yesno = [{value: true, label: "Yes"}, {value: false, label: "No"}]

    return (
      <React.Fragment>
        <h1 className='mb-3'>
          <i className='fas fa-anchor fa-fw mr-2'></i>
          Add Project
        </h1>

        <Formik
          initialValues={{
            displayName: '',
            useKubernetes: false,
            description: '',
          }}
          validationSchema={ProjectSchema}
          onSubmit={onSubmit}
          onReset={onCancel}>
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <Card className='mb-3'>
                <CardBody>
                  <Field
                    name="displayName"
                    label="Display Name"
                    component={FormikInput}
                    className='form-control'
                    placeholder="Display name"
                    required />
                  <Field
                    name="useKubernetes"
                    label="Do you use Kubernetes?"
                    component={FormikInput}
                    type="select"
                    className="form-control"
                    placeholder="If you use Kubernetes, then choose 'Yes'."
                    options={yesno}
                    onChange={()=>{}}
                    required />
                  <Field
                    name="description"
                    label="Description"
                    className='form-control'
                    component={FormikInput}
                    type="textarea"
                    placeholder="Description" />
                </CardBody>
              </Card>
              {this.renderButtons(isSubmitting)}
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
  renderButtons(isSubmitting) {
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
          Create Project
        </Button>
        {' '}
        <Button outline color='info' type='reset'>
          <i className='fas fa-ban fa-fw mr-2'></i>
          Reset
        </Button>
      </div>
    )
  }
}

export interface FormCustomProps {
  onCancel
  onSubmit
}

type SaveProjectFormProps = FormCustomProps

export const ProjectDeloymentForm =
  connect(
    (state: any, extraProps: FormCustomProps) => ({
      ...extraProps,
      ...state.form
    })
  )(ProjectDeploymentFormImpl)
