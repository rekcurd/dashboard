import * as React from 'react'
import { FormGroup, Label, Input, FormFeedback, FormText } from 'reactstrap'
import { WrappedFieldProps } from 'redux-form'

/**
 * General single form field component with validation message
 *
 *
 */
interface CustomFormFieldProps {
  placeholder?: string,
  id: string,
  type: string,
  className: string,
  groupClassName?: string,
  disable?: boolean,
  options?: Array<{label: string, value: string, disabled: boolean}>
  required?: boolean
  formText?: string | JSX.Element
}

export type FormFieldProps = CustomFormFieldProps & WrappedFieldProps

export const SingleFormField = ({
  input,
  label,
  placeholder,
  id,
  type,
  className,
  groupClassName,
  disable,
  options = [] as Array<{label: string, value: string, disabled: boolean}>,
  meta: { touched, error, warning, submitting },
  required,
  formText
}: FormFieldProps) => {
  const errorMessage =
    error && <FormFeedback>{error}</FormFeedback>
  const warningMessage =
    warning && <FormFeedback>{warning}</FormFeedback>
  const validMessage = <FormFeedback valid>OK</FormFeedback>
  const isValid = (!error) && (!warning)
  const margin = 'mb-3'
  const renderOptionElements =
    () => ([{label: '', value: '', disabled: false}].concat(options)).map(
      (value, index) =>
        (<option value={value.value} key={value.label} disabled={value.disabled}>{value.label}</option>)
      )
  const requiredClass = required ? 'required' : ''
  const formTextElement =
    formText
    ? (<FormText color='muted'>{formText}</FormText>)
    : null

  return (
    <FormGroup className={`${groupClassName || ''} ${margin}`}>
      <Label for={id} className={`${requiredClass} text-info`}>{label}</Label>
      <Input
        {...input}
        placeholder={placeholder}
        type={type}
        id={id}
        className={`${className}`}
        valid={touched && isValid}
        invalid={touched && !isValid}
        disabled={submitting || disable}
      >
        {options.length > 0 ? renderOptionElements() : null}
      </Input>
      {formTextElement}
      {touched &&
        (errorMessage || warningMessage || validMessage)}
    </FormGroup>
  )
}
