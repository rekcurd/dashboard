import * as React from 'react'
import { connect } from 'react-redux'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Button } from 'reactstrap'

import { Project } from '@src/apis'

import * as Yup from "yup";
import { Field, Form, Formik } from "formik";

import { FormikInput, FileUpload } from '@common/Field'


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
    const { project, onSubmit, onCancel, method } = this.props
    const initialValues = {
      ...this.props.initialValues,
      configPath: null,
    }
    const isPost = (method === 'post')

    return (
      <div className='pt-3 pr-3 pl-3'>
        <Breadcrumb tag="nav" listTag="div">
          <BreadcrumbItem tag="a" href="/">Projects</BreadcrumbItem>
          <BreadcrumbItem active tag="span">{project.name}</BreadcrumbItem>
        </Breadcrumb>
        <h1>
          <i className='fas fa-ship fa-fw mr-2'></i>
          {isPost ? 'Add' : 'Edit'} Kubernetes Host
        </h1>
        <Formik
          initialValues={initialValues}
          validationSchema={isPost ? AddKubernetesSchema : EditKubernetesSchema}
          onSubmit={(values, {setSubmitting}) => {
            onSubmit(values).then(
              result => {
                setSubmitting(false)
              },
              errors => {
                setSubmitting(false)
              }
            )}
          }>
          {({ errors, touched, setFieldValue, isSubmitting }) => (
            <Form>
              <Card className='mb-3'>
                <CardBody>
                  <Field
                    name="displayName"
                    label="Display Name"
                    component={FormikInput}
                    className="form-control"
                    placeholder="Display Name"
                    required={isPost} />
                  <FileUpload
                    errors={errors}
                    touched={touched}
                    setFieldValue={setFieldValue}
                    name="configPath"
                    label="kubeconfig Filepath"
                    className="form-control"
                    placeholder="Generate your 'kubeconfig' file. Sometimes you can be available it on '$HOME/.kube/config'"
                    required={isPost} />
                  <Field
                    name="exposedHost"
                    label="Exposed Host"
                    component={FormikInput}
                    className="form-control"
                    placeholder="Exposed Host such as Gateway IP, Ingress IP and LoadBalancer IP."
                    required={isPost} />
                  <Field
                    name="exposedPort"
                    label="Exposed Port"
                    component={FormikInput}
                    className="form-control"
                    placeholder="Exposed Port. Istio default exposed port is '31380'."
                    required={isPost} />
                  <Field
                    name="description"
                    label="Description"
                    component={FormikInput}
                    className="form-control"
                    type="textarea"
                    placeholder="Description"/>
                </CardBody>
              </Card>

              <div className='text-right mb-3'>
                <Button color='success' type='submit' disabled={isSubmitting} >
                  <i className='fas fa-check fa-fw mr-2'></i>
                  {isPost ? 'Submit' : 'Update'}
                </Button>
                {' '}
                <Button outline color='info' onClick={onCancel}>
                  <i className='fas fa-ban fa-fw mr-2'></i>
                  Cancel
                </Button>
              </div>
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
  exposedHost: '127.0.0.1',
  exposedPort: 31380
}

export interface CustomProps {
  project: Project
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
