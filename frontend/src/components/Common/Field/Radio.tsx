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
                checked={field.value[this.props.id] === this.props.value}
                onChange={() => {
                  const nextValue = {}
                  Object.entries(field.value).map(([key, val]) => {
                    if (key === this.props.id) {
                      nextValue[key] = this.props.value
                    } else {
                      nextValue[key] = val
                    }
                    return null
                  })
                  form.setFieldValue(this.props.name, nextValue)
                }}
              />
              {this.props.label}
            </label>
          )
        }
      </Field>
    )
  }
}

type RadioProps = CustomProps

interface RadioState {}

interface CustomProps {
  name: string
  id
  value
  label: string
}

export const Radio = connect(
  (state: any, props: CustomProps) => ({
    ...state.form,
    ...props,
  })
)(RadioImpl)