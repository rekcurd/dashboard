import * as React from 'react'
import { connect } from 'react-redux'
import { Card, CardBody, Button, CardTitle, UncontrolledTooltip } from 'reactstrap'

import * as Yup from "yup";
import { ErrorMessage, Field, Form, Formik } from "formik";


const AddKubernetesSchema = Yup.object().shape({
  displayName: Yup.string()
    .required('Required')
    .max(128),
  description: Yup.string(),
  exposedHost: Yup.string()
    .required('Required')
    .max(512),
  exposedPort: Yup.number()
    .required('Required')
    .positive()
    .integer(),
  configPath: Yup.mixed()
    .required('Required')
});

const EditKubernetesSchema = Yup.object().shape({
  displayName: Yup.string()
    .max(128),
  description: Yup.string(),
  exposedHost: Yup.string()
    .max(512),
  exposedPort: Yup.number()
    .positive()
    .integer(),
  configPath: Yup.mixed()
});

class HostFormImpl extends React.Component<HostFormProps> {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    const { onSubmit, onCancel, method } = this.props
    const initialValues = {
      ...this.props.initialValues,
      configPath: null,
    }

    return (
      <div className='pt-3 pr-3 pl-3'>
        <h1>
          <i className='fas fa-plug fa-fw mr-2'></i>
          {method === 'post' ? 'Add' : 'Edit'} Kubernetes Host
        </h1>
        <Formik
          initialValues={initialValues}
          validationSchema={method === 'post' ? AddKubernetesSchema : EditKubernetesSchema}
          onSubmit={onSubmit}>
          {({ errors, touched, setFieldValue, isSubmitting }) => (
            <Form>
              <Card className='mb-3'>
                <CardBody>
                  <Field name="displayName" placeholder="Display Name"/>
                  {errors.displayName && touched.displayName ? (
                    <div>{errors.displayName}</div>
                  ) : null}
                  <ErrorMessage name="displayName" />
                  <input name="configPath" type="file" onChange={(event) => {
                    setFieldValue("configPath", event.currentTarget.files[0]);
                  }} />
                  {errors.configPath && touched.configPath ? (
                    <div>{errors.configPath}</div>
                  ) : null}
                  <ErrorMessage name="configPath" />
                  <Field name="description" component="textarea" placeholder="Description"/>
                  {errors.description && touched.description ? (
                    <div>{errors.description}</div>
                  ) : null}
                  <ErrorMessage name="description" />
                  <Field name="exposedHost" placeholder="Exposed Host"/>
                  {errors.exposedHost && touched.exposedHost ? (
                    <div>{errors.exposedHost}</div>
                  ) : null}
                  <ErrorMessage name="exposedHost" />
                  <Field name="exposedPort" placeholder="Exposed Port"/>
                  {errors.exposedPort && touched.exposedPort ? (
                    <div>{errors.exposedPort}</div>
                  ) : null}
                  <ErrorMessage name="exposedPort" />
                </CardBody>
              </Card>

              <Card>
                <CardBody className='text-right'>
                  <Button color='success' type='submit' disabled={isSubmitting} >
                    <i className='fas fa-check fa-fw mr-2'></i>
                    {method === 'post' ? 'Submit' : 'Update'}
                  </Button>
                  {' '}
                  <Button outline color='info' onClick={onCancel}>
                    <i className='fas fa-ban fa-fw mr-2'></i>
                    Cancel
                  </Button>
                </CardBody>
              </Card>
            </Form>
          )}
        </Formik>
      </div>
    )
  }
}

type HostFormProps = CustomProps

const defaultInitialValues = {
  displayName: '',
  description: '',
  exposedHost: 'localhost',
  exposedPort: 31380
}

export interface CustomProps {
  onCancel
  onSubmit
  method: string
  initialValues?: {
    displayName: string
    description: string
    exposedHost: string
    exposedPort: number
  }
}

export const HostForm = connect(
  (state: any, extraProps: CustomProps) => ({
    ...state.form,
    initialValues: {
      ...defaultInitialValues,
      ...extraProps.initialValues
    },
  })
)(HostFormImpl)
