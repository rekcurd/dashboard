import * as React from 'react'
import { connect } from 'react-redux'
import { Card, CardBody, Button } from 'reactstrap'

import { serviceLevel } from '@components/Common/Enum'
import { Model } from '@src/apis'

import * as Yup from "yup";
import { ErrorMessage, Field } from "formik";


export const SingleServiceSchema = {
  displayName: Yup.string()
    .required('Required')
    .max(128),
  description: Yup.string(),
  serviceLevel: Yup.string()
    .required('Required')
    .oneOf([serviceLevel.development.toString(), serviceLevel.staging.toString(),
            serviceLevel.production.toString(), serviceLevel.beta.toString(),
            serviceLevel.sandbox.toString()]),
  version: Yup.string()
    .required('Required')
    .oneOf(['v3']),
  serviceInsecureHost: Yup.string()
    .required('Required')
    .max(512),
  serviceInsecurePort: Yup.number()
    .required('Required')
    .positive()
    .integer(),
  serviceModelAssignment: Yup.number()
    .required('Required')
    .positive()
    .integer(),
}

class SingleServiceFormImpl extends React.Component<SingleServiceFormProps> {
  render() {
    const { models, errors, touched } = this.props

    const serviceLevels = Object.values(serviceLevel).map((serviceLevelName: string) => {
      return (
        <option value={serviceLevelName} label={serviceLevelName}>
          {serviceLevelName}
        </option>
      )
    })
    const versions = (
      <option value='v3' label='v3'>
        'v3'
      </option>
    )
    const serviceModelAssignments = models.map( (model: Model) => {
      return (
        <option value={model.modelId} label={model.modelId.toString()}>
          {model.modelId}-{model.description}
        </option>
      )
    })

    return (
      <Card className='mb-3'>
        <CardBody>
          <Field name="displayName" placeholder="Display Name"/>
          {errors.displayName && touched.displayName ? (
            <div>{errors.displayName}</div>
          ) : null}
          <ErrorMessage name="displayName" />
          <Field name="serviceLevel" component="select" className='form-control' id='serviceLevel'>
            {serviceLevels}
          </Field>
          {errors.serviceLevel && touched.serviceLevel ? (
            <div>{errors.serviceLevel}</div>
          ) : null}
          <ErrorMessage name="serviceLevel" />
          <Field name="version" component="select" className='form-control' id='version' placeholder="Rekcurd gRPC version">
            {versions}
          </Field>
          {errors.version && touched.version ? (
            <div>{errors.version}</div>
          ) : null}
          <ErrorMessage name="version" />
          <Field name="serviceInsecureHost" placeholder="Insecure Host"/>
          {errors.serviceInsecureHost && touched.serviceInsecureHost ? (
            <div>{errors.serviceInsecureHost}</div>
          ) : null}
          <ErrorMessage name="serviceInsecureHost" />
          <Field name="serviceInsecurePort" placeholder="Insecure Port"/>
          {errors.serviceInsecurePort && touched.serviceInsecurePort ? (
            <div>{errors.serviceInsecurePort}</div>
          ) : null}
          <ErrorMessage name="serviceInsecurePort" />
          <Field name="serviceModelAssignment" component="select" className='form-control' id='serviceModelAssignment'>
            {serviceModelAssignments}
          </Field>
          {errors.serviceModelAssignment && touched.serviceModelAssignment ? (
            <div>{errors.serviceModelAssignment}</div>
          ) : null}
          <ErrorMessage name="serviceModelAssignment" />
          <Field name="description" component="textarea" placeholder="Description"/>
          {errors.description && touched.description ? (
            <div>{errors.description}</div>
          ) : null}
          <ErrorMessage name="description" />
        </CardBody>
      </Card>
    )
  }
}

export const SingleServiceDefaultInitialValues = {
  displayName: null,
  description: '',
  serviceLevel: serviceLevel.development.toString(),
  version: 'v3',
  serviceInsecureHost: '[::]',
  serviceInsecurePort: 5000,
  serviceModelAssignment: null,
}

interface CustomProps {
  models: Model[]
  errors
  touched
}

type SingleServiceFormProps = CustomProps

export const SingleServiceForm = connect(
  (state: any, extraProps: CustomProps) => ({
    ...state.form,
    ...extraProps,
  })
)(SingleServiceFormImpl)
