import * as React from 'react'
import { connect } from 'react-redux'
import { CustomInput } from 'reactstrap'
import { Field } from "formik";


class CheckboxImpl extends React.Component<CheckboxProps, CheckboxState> {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    return (
      <Field name={this.props.name}>
        {({ field, form }) => (
          <CustomInput
            type='checkbox'
            checked={field.value.includes(this.props.value)}
            id={this.props.id}
            label={this.props.label}
            onChange={() => {
              if (field.value.includes(this.props.value)) {
                const nextValue = field.value.filter(
                  value => value !== this.props.value
                );
                form.setFieldValue(this.props.name, nextValue);
              } else {
                const nextValue = field.value.concat(this.props.value);
                form.setFieldValue(this.props.name, nextValue);
              }
            }}
          />
        )}
      </Field>
    )
  }
}

type CheckboxProps = CustomProps

interface CheckboxState {}

interface CustomProps {
  id: string
  name: string
  value
  label: string
}

export const Checkbox = connect(
  (state: any, props: CustomProps) => ({
    ...state.form,
    ...props,
  })
)(CheckboxImpl)