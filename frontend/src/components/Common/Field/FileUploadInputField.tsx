import * as React from 'react'
import { FormFeedback, FormText, FormGroup } from 'reactstrap'
import { WrappedFieldProps } from 'redux-form'

const adaptFileEventToValue = (delegate) => (e) => {
  delegate(e.target.files[0])
}

interface CustomFormFieldProps {
  id: string
  fileName: string
  placeholder: string
  required?: boolean
  formText?: string | JSX.Element
}

export type FileUploadInputFieldProps = CustomFormFieldProps & WrappedFieldProps

/* https://github.com/erikras/redux-form/issues/3686 */
export const FileUploadInputField = ({
  input: {
    value: omitValue,
    onChange,
    onBlur,
    ...inputProps
  },
  meta: { touched, error, warning, submitting },
  fileName,
  id,
  label,
  placeholder,
  required,
  formText,
  ...props
}: FileUploadInputFieldProps) => {
  const errorMessage =
    error && <FormFeedback className='d-block'>{error}</FormFeedback>
  const warningMessage =
    warning && <FormFeedback className='d-block'>{warning}</FormFeedback>
  const validMessage = <FormFeedback valid className='d-block'>OK</FormFeedback>
  const isValid = (!error) && (!warning)
  const formValidClass = touched ? (isValid ? 'is-valid' : 'is-invalid') : ''
  const margin = 'mb-3'
  const requiredClass = required ? 'required' : ''
  const formTextElement =
    formText
    ? (<FormText color='muted'>{formText}</FormText>)
    : null

  return (
    <FormGroup className={`${margin}`}>
      <label htmlFor={id} className={`${requiredClass} text-info`}>{label}</label>
      <div className={`custom-file`}>
        <input
          onChange={(e) => onChange(e)}
          onBlur={adaptFileEventToValue(onBlur)}
          type='file'
          id={id}
          className={`custom-file-input ${formValidClass}`}
          disabled={submitting}
          {...inputProps}
          {...props}
        />
        <label className='custom-file-label' htmlFor={id}>
          {fileName || placeholder}
        </label>
      </div>
      {formTextElement}
      {touched &&
        (errorMessage || warningMessage || validMessage)}
    </FormGroup>
  )
}
