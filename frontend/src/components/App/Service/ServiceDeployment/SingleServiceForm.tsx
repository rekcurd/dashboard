import * as React from 'react'
import { connect } from 'react-redux'
import { Card, CardBody, CardTitle, Button } from 'reactstrap'

import { serviceLevel } from '@components/Common/Enum'
import { Model } from '@src/apis'

import * as Yup from "yup";
import { Field } from "formik";

import { FormikInput } from '@common/Field'


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
    .oneOf(['v2']),
  insecureHost: Yup.string()
    .required('Required')
    .max(512),
  insecurePort: Yup.number()
    .required('Required')
    .positive()
    .integer(),
  serviceModelAssignment: Yup.number()
    .required('Required')
    .integer(),
}

class SingleServiceFormImpl extends React.Component<SingleServiceFormProps> {
  private renderServiceLevels(isPost) {
    const serviceLevels = Object.values(serviceLevel).map((serviceLevelName: string) => {
      return {
        value: serviceLevelName,
        label: serviceLevelName
      }
    })
    return (
      <Field
        name="serviceLevel"
        label="Service Level"
        component={FormikInput}
        type="select"
        className='form-control'
        groupClassName='col-md-6 pr-3'
        placeholder="Service level of your service."
        options={serviceLevels}
        onChange={()=>{}}
        required={isPost} />
    )
  }

  private renderVersions(isPost) {
    const versions = [{value: 'v2', label: 'v2'}]
    return (
      <Field
        name="version"
        label="Rekcurd gRPC version"
        component={FormikInput}
        type="select"
        className='form-control'
        groupClassName='col-md-6'
        placeholder="Rekcurd gRPC version."
        options={versions}
        onChange={()=>{}}
        required={isPost} />
    )
  }

  private renderServiceModelAssignments() {
    const serviceModelAssignments = this.props.models.map( (model: Model) => {
      return {
        value: model.modelId,
        label: `ID ${model.modelId}: ${model.description}`
      }
    })
    return (
      <Field
        name="serviceModelAssignment"
        label="Model Assignment"
        component={FormikInput}
        type="select"
        className='form-control'
        placeholder="Model assignment of this service."
        options={serviceModelAssignments}
        onChange={()=>{}} />
    )
  }

  render() {
    const { isPost } = this.props

    return (
      <Card className='mb-3'>
        <CardBody>
          <CardTitle>Basic Info</CardTitle>
          <Field
            name="displayName"
            label="Display Name"
            component={FormikInput}
            className="form-control"
            placeholder="e.g. 'development-01'"
            required={isPost} />
          <div className='form-row'>
            {this.renderServiceLevels(isPost)}
            {this.renderVersions(isPost)}
          </div>
          <div className='form-row'>
            <Field
              name="insecureHost"
              label="Insecure Host"
              component={FormikInput}
              className="form-control"
              groupClassName='col-md-6 pr-3'
              placeholder="Address accepted on your service. Default is all ('[::]')."
              required={isPost} />
            <Field
              name="insecurePort"
              label="Insecure Port"
              component={FormikInput}
              className="form-control"
              groupClassName='col-md-6'
              placeholder="Port number accepted on your service. Default is '5000'"
              required={isPost} />
          </div>
          {this.renderServiceModelAssignments()}
          <Field
            name="description"
            label="Description"
            component={FormikInput}
            className="form-control"
            type="textarea"
            placeholder="Description"/>
        </CardBody>
      </Card>
    )
  }
}

export const SingleServiceDefaultInitialValues = {
  displayName: '',
  description: '',
  serviceLevel: serviceLevel.development.toString(),
  version: 'v2',
  insecureHost: '[::]',
  insecurePort: 5000,
  serviceModelAssignment: 0,
}

interface CustomProps {
  isPost: boolean
  models: Model[]
}

type SingleServiceFormProps = CustomProps

export const SingleServiceForm = connect(
  (state: any, extraProps: CustomProps) => ({
    ...state.form,
    ...extraProps,
  })
)(SingleServiceFormImpl)
