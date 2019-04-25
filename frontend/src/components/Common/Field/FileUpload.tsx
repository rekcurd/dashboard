import * as React from 'react'
import { FormGroup, Label, Input, FormFeedback, FormText } from 'reactstrap'


/**
 * General single form field component with validation message
 *
 *
 */
export const FileUpload = (
  {
    name,
    label,
    className,
    placeholder,
    required,
    touched,
    errors,
    setFieldValue
  }) => {
  const margin = 'mb-3'
  const requiredClass = required ? 'required' : ''

  return (
    <FormGroup className={`${margin}`}>
      <Label for={name} className={`${requiredClass} text-info`}>{label}</Label>
      <Input
        name={name}
        className={className}
        type="file"
        onChange={(event)=>{setFieldValue(name, event.currentTarget.files[0]);}}
        invalid={Boolean(touched[name] && errors[name])} >
      </Input>
      <FormText>
        {placeholder}
      </FormText>
      {touched[name] && errors[name] ? <FormFeedback>{errors[name]}</FormFeedback> : ''}
    </FormGroup>
  )
}
