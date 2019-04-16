import * as React from 'react'
import { connect } from 'react-redux'
import { Field } from "formik";


class CheckboxImpl extends React.Component<CheckboxProps, CheckboxState> {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    return (
      <Field name={this.props.name}>
        {({ field, form }) => (
          <label>
            <input
              type="checkbox"
              checked={field.value.includes(this.props.value)}
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
            {this.props.label}
          </label>
        )}
      </Field>
    )
  }
}

type CheckboxProps = CustomProps

interface CheckboxState {}

interface CustomProps {
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