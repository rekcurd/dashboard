import * as React from 'react'
import { connect } from 'react-redux'
import { Card, CardBody, Button, CardTitle, UncontrolledTooltip } from 'reactstrap'
import { dataServerMode } from '@components/Common/Enum'

import * as Yup from "yup";
import { ErrorMessage, Field, Form, Formik } from "formik";


const DataServerSchema = Yup.object().shape({
  dataServerMode: Yup.string()
    .oneof([dataServerMode.local.toString(), dataServerMode.ceph_s3.toString(), dataServerMode.aws_s3.toString()])
    .required('Required'),
  cephAccessKey: Yup.string()
    .max(128),
  cephSecretKey: Yup.string()
    .max(128),
  cephHost: Yup.string()
    .max(512),
  cephPort: Yup.number()
    .positive()
    .integer(),
  cephIsSecure: Yup.bool(),
  cephBucketName: Yup.string()
    .max(128),
  awsAccessKey: Yup.string()
    .max(128),
  awsSecretKey: Yup.string()
    .max(128),
  awsBucketName: Yup.string()
    .max(128)
});

class DataServerFormImpl extends React.Component<DataServerFormProps, DataServerState> {
  constructor(props, context) {
    super(props, context)
    this.state = {
      dataServerMode: this.props.initialValues.dataServerMode
    }

    this.onChange = this.onChange.bind(this)
  }

  onChange(event) {
    if (this.state.dataServerMode !== event.target) {
      this.setState({dataServerMode: event.target})
    }
  }

  private renderModes() {
    const modes = Object.values(dataServerMode).map((modeName: string) => {
      return (
        <option value={modeName} label={modeName}>
          {modeName}
        </option>
      )
    })
    return (
      <Field name="dataServerMode" component="select" className='form-control' id='dataServerMode' onChange={this.onChange}>
        {modes}
      </Field>
    )
  }

  render() {
    const { onSubmit, onCancel, method } = this.props
    const initialValues = {
      ...this.props.initialValues
    }
    let fields = null
    if (this.state.dataServerMode === dataServerMode.ceph_s3.toString()) {
      fields = (
        <Card className='mb-3'>
          <CardBody>
            <Field name="cephAccessKey" placeholder="Access Key"/>
            <Field name="cephSecretKey" placeholder="Secret Key"/>
            <Field name="cephHost" placeholder="Host"/>
            <Field name="cephPort" placeholder="Port"/>
            <Field name="cephIsSecure" placeholder="Use SSL?"/>
            <Field name="cephBucketName" placeholder="Bucket Name"/>
          </CardBody>
        </Card>
      )
    } else if (this.state.dataServerMode === dataServerMode.aws_s3.toString()) {
      fields = (
        <Card className='mb-3'>
          <CardBody>
            <Field name="awsAccessKey" placeholder="Access Key"/>
            <Field name="awsSecretKey" placeholder="Secret Key"/>
            <Field name="awsBucketName" placeholder="Bucket Name"/>
          </CardBody>
        </Card>
      )
    } else {
      fields = null
    }

    return (
      <div className='pt-3 pr-3 pl-3'>
        <h1>
          <i className='fas fa-plug fa-fw mr-2'></i>
          {method === 'post' ? 'Add' : 'Edit'} DataServer
        </h1>
        <Formik
          initialValues={initialValues}
          validationSchema={DataServerSchema}
          onSubmit={onSubmit}>
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <Card className='mb-3'>
                <CardBody>
                  {this.renderModes()}
                  {errors.dataServerMode && touched.dataServerMode ? (
                    <div>{errors.dataServerMode}</div>
                  ) : null}
                  <ErrorMessage name="dataServerMode" />
                </CardBody>
              </Card>

              {fields}
              {errors.cephAccessKey && touched.cephAccessKey ? (
                <div>{errors.cephAccessKey}</div>
              ) : null}
              <ErrorMessage name="cephAccessKey" />
              {errors.cephSecretKey && touched.cephSecretKey ? (
                <div>{errors.cephSecretKey}</div>
              ) : null}
              <ErrorMessage name="cephSecretKey" />
              {errors.cephHost && touched.cephHost ? (
                <div>{errors.cephHost}</div>
              ) : null}
              <ErrorMessage name="cephHost" />
              {errors.cephPort && touched.cephPort ? (
                <div>{errors.cephPort}</div>
              ) : null}
              <ErrorMessage name="cephPort" />
              {errors.cephIsSecure && touched.cephIsSecure ? (
                <div>{errors.cephIsSecure}</div>
              ) : null}
              <ErrorMessage name="cephIsSecure" />
              {errors.cephBucketName && touched.cephBucketName ? (
                <div>{errors.cephBucketName}</div>
              ) : null}
              <ErrorMessage name="cephBucketName" />
              {errors.awsAccessKey && touched.awsAccessKey ? (
                <div>{errors.awsAccessKey}</div>
              ) : null}
              <ErrorMessage name="awsAccessKey" />
              {errors.awsSecretKey && touched.awsSecretKey ? (
                <div>{errors.awsSecretKey}</div>
              ) : null}
              <ErrorMessage name="awsSecretKey" />
              {errors.awsBucketName && touched.awsBucketName ? (
                <div>{errors.awsBucketName}</div>
              ) : null}
              <ErrorMessage name="awsBucketName" />

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

type DataServerFormProps = CustomProps

interface DataServerState {
  dataServerMode: string
}

const defaultInitialValues = {
  dataServerMode: dataServerMode.local.toString(),
  cephAccessKey: null,
  cephSecretKey: null,
  cephHost: null,
  cephPort: null,
  cephIsSecure: null,
  cephBucketName: null,
  awsAccessKey: null,
  awsSecretKey: null,
  awsBucketName: null,
}

export interface CustomProps {
  onCancel
  onSubmit
  method: string
  initialValues?: {
    dataServerMode: string
    cephAccessKey: string
    cephSecretKey: string
    cephHost: string
    cephPort: number
    cephIsSecure: boolean
    cephBucketName: string
    awsAccessKey: string
    awsSecretKey: string
    awsBucketName: string
  }
}

export const DataServerForm = connect(
  (state: any, extraProps: CustomProps) => ({
    ...state.form,
    initialValues: {
      ...defaultInitialValues,
      ...extraProps.initialValues
    },
  })
)(DataServerFormImpl)
