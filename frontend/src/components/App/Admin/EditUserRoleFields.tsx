import * as React from 'react'
import { connect } from 'react-redux'
import { Field } from 'redux-form'

import { AccessControlList } from '@src/apis'
import { SingleFormField } from '@components/Common/Field/SingleFormField'
import { required } from '@components/Common/Field/Validateors'
import { role } from './constants'

class EditUserRoleFieldsImpl extends React.Component<EditUserRoleFieldsProps> {
  constructor(props: EditUserRoleFieldsProps) {
    super(props)
  }
  render() {
    const { target } = this.props
    if (!target) {
      return null
    }
    const roles = Object.values(role).map((roleName: string) => {
      return { label: roleName, value: roleName }
    })
    return (
      <Field
        label='Role'
        name='edit.user.role'
        component={SingleFormField} type='select'
        options={roles}
        className='form-control' id='userRole'
        validate={required}
        required
      />
    )
  }
}

interface CustomProps {
  target?: AccessControlList
}

type EditUserRoleFieldsProps = CustomProps

export const EditUserRoleFields =
  connect(
    (state: any, extraProps: CustomProps) => ({
      ...extraProps,
    })
  )(EditUserRoleFieldsImpl)
