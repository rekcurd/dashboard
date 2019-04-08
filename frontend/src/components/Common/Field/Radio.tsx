import * as React from 'react'
import { connect } from 'react-redux'
import { Field } from "formik";


class RadioImpl extends React.Component<RadioProps, RadioState> {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    return (
      <Field name={this.props.name}>
        {({ field, form }) => (
          <label>
            <input
              type="radio"
              {...this.props}
              checked={field.value === this.props.value}
              onChange={() => {
                form.setFieldValue(this.props.name, this.props.value)
              }}
            />
            {this.props.label}
          </label>
        )}
      </Field>
    )
  }
}

type RadioProps = CustomProps

interface RadioState {}

interface CustomProps {
  name: string
  value
  label: string
}

export const Radio = connect(
  (state: any, props: CustomProps) => ({
    ...state.form,
    ...props,
  })
)(RadioImpl)