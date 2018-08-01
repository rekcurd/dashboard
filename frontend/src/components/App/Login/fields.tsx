import * as React from 'react'
import { connect } from 'react-redux'
import { Field } from 'redux-form'
import { SingleFormField } from '@common/Field/SingleFormField'
import { required } from '@common/Field/Validateors'

class LoginFormFields extends React.Component<FormProps> {
  render() {
    const { formNamePrefix } = this.props
    const usernameField = (
      <Field
        label='User name'
        name={`${formNamePrefix}.username`}
        className='form-control'
        component={SingleFormField} type='text'
        validate={required}
        required
      />
    )
    const passwordField = (
      <Field
        label='Password'
        name={`${formNamePrefix}.password`}
        className='form-control'
        component={SingleFormField} type='password'
        validate={required}
        required
      />
    )
    return (
      <React.Fragment>
        {usernameField}
        {passwordField}
      </React.Fragment>
    )
  }
}

interface CustomProps {
  formNamePrefix: string
}

type FormProps = CustomProps

export default
  connect(
    (state: any, extraProps: CustomProps) => ({
      ...extraProps,
    })
  )(LoginFormFields)
