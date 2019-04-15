import * as React from 'react'
import { connect } from 'react-redux'
import { Card, CardBody, CardTitle, Button } from 'reactstrap'

import { serviceLevel } from '@components/Common/Enum'

import * as Yup from "yup";
import { Field } from "formik";

import { FormikInput } from '@common/Field'


export const ServiceDescriptionSchema = {
  displayName: Yup.string()
    .required('Required')
    .max(128),
  description: Yup.string()
}

class ServiceDescriptionFormImpl extends React.Component<ServiceDescriptionFormProps> {
  render() {
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
            required />
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

export const ServiceDescriptionDefaultInitialValues = {
  displayName: '',
  description: '',
  serviceLevel: serviceLevel.development.toString(),
  version: 'v2',
  insecureHost: '[::]',
  insecurePort: 5000,
  serviceModelAssignment: 0,
}

interface CustomProps {}

type ServiceDescriptionFormProps = CustomProps

export const ServiceDescriptionForm = connect(
  (state: any, extraProps: CustomProps) => ({
    ...state.form,
    ...extraProps,
  })
)(ServiceDescriptionFormImpl)
