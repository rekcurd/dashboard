import * as React from 'react'
import { connect } from 'react-redux'
import { Card, CardBody, CardTitle, Button } from 'reactstrap'

import { serviceLevel } from '@components/Common/Enum'
import { Model } from '@src/apis'

import * as Yup from "yup";
import { Field } from "formik";

import { FormikInput } from '@common/Field'


export const ServiceConfigSchema = {
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

class ServiceConfigFormImpl extends React.Component<ServiceConfigFormProps> {
  private renderServiceLevels() {
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
        required />
    )
  }

  private renderVersions() {
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
        required />
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
        onChange={()=>{}}
        required />
    )
  }

  render() {
    return (
      <Card className='mb-3'>
        <CardBody>
          <CardTitle>Service Configuration</CardTitle>
          <div className='form-row'>
            {this.renderServiceLevels()}
            {this.renderVersions()}
          </div>
          <div className='form-row'>
            <Field
              name="insecureHost"
              label="Insecure Host"
              component={FormikInput}
              className="form-control"
              groupClassName='col-md-6 pr-3'
              placeholder="Address accepted on your service. Default is all ('[::]')."
              required />
            <Field
              name="insecurePort"
              label="Insecure Port"
              component={FormikInput}
              className="form-control"
              groupClassName='col-md-6'
              placeholder="Port number accepted on your service. Default is '5000'"
              required />
          </div>
          {this.renderServiceModelAssignments()}
        </CardBody>
      </Card>
    )
  }
}

export const ServiceConfigDefaultInitialValues = {
  serviceLevel: serviceLevel.development.toString(),
  version: 'v2',
  insecureHost: '[::]',
  insecurePort: 5000,
  serviceModelAssignment: 0,
}

interface CustomProps {
  models: Model[]
}

type ServiceConfigFormProps = CustomProps

export const ServiceConfigForm = connect(
  (state: any, extraProps: CustomProps) => ({
    ...state.form,
    ...extraProps,
  })
)(ServiceConfigFormImpl)
