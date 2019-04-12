import * as React from 'react'
import { FormGroup, Label, Input, FormFeedback, FormText } from 'reactstrap'


/**
 * General single form field component with validation message
 *
 *
 */
export const FormikInput = (
  {
    options = [] as Array<{label: string, value: string, disabled: boolean}>,
    required,
    placeholder,
    groupClassName,
    field: {...fields},
    form: {touched, errors, setFieldValue, ...rest},
    ...props
  }) => {
  const margin = 'mb-3'
  const renderOptionElements = () => ([{label: '', value: '', disabled: false}].concat(options)).map((v) => {
    return (
      <option value={v.value} key={v.label} disabled={v.disabled}>
        {v.label}
      </option>
    )
  })
  const requiredClass = required ? 'required' : ''

  return (
    <FormGroup className={`${groupClassName || ''} ${margin}`}>
      <Label for={props.id} className={`${requiredClass} text-info`}>{props.label}</Label>
      <Input
        {...props}
        {...fields}
        onChange={(event) => {setFieldValue(fields.name, event.target.value); props.onChange ? props.onChange(event) : null;}}
        invalid={Boolean(touched[fields.name] && errors[fields.name])} >
        {options.length > 0 ? renderOptionElements() : null}
      </Input>
      <FormText>{placeholder}</FormText>
      {touched[fields.name] && errors[fields.name] ? <FormFeedback>{errors[fields.name]}</FormFeedback> : ''}
    </FormGroup>
  )
}
