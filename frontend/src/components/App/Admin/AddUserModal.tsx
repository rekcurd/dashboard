import * as React from 'react'
import { connect } from 'react-redux'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap'
import { Dispatch } from 'redux'
import { Field, InjectedFormProps, reduxForm } from 'redux-form'

import { SingleFormField } from '@components/Common/Field/SingleFormField'
import { required } from '@components/Common/Field/Validateors'
import { saveAccessControlDispatcher } from '@src/actions'

interface AddUserFormCustomProps {
  applicationId: string
  isModalOpen: boolean
  toggle: () => void
}

interface DispathProps {
  saveAccessControl: (params) => Promise<void>
}

type AddUserModalProps = AddUserFormCustomProps & DispathProps & InjectedFormProps<{}, AddUserFormCustomProps>

interface AddUserModalState {
  submitting: boolean
}

class AddUserModal extends React.Component<AddUserModalProps, AddUserModalState> {
  constructor(props) {
    super(props)
    this.onCancel = this.onCancel.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.state = {
      submitting: false
    }
  }
  render() {
    const { isModalOpen, handleSubmit } = this.props
    return (
      <Modal isOpen={isModalOpen} toggle={this.onCancel}>
        <form onSubmit={handleSubmit(this.onSubmit)}>
          <ModalHeader toggle={this.onCancel}>
            <i className='fas fa-user-plus fa-fw mr-2'></i>
            Add User
          </ModalHeader>
          {this.renderBodyForm()}
          {this.renderFooterButtons()}
        </form>
      </Modal>
    )
  }
  private renderBodyForm() {
    const roles = [
      { label: 'view',  value: 'view'  },
      { label: 'edit',  value: 'edit'  },
      { label: 'admin', value: 'admin' }
    ]
    return (
      <ModalBody>
        <Field
          label='User ID'
          name='save.user.uid'
          component={SingleFormField} type='text'
          className='form-control' id='userId'
          validate={required}
          required
        />
        <Field
          label='Role'
          name='save.user.role'
          component={SingleFormField} type='select'
          options={roles}
          className='form-control' id='userRole'
          validate={required}
          required
        />
      </ModalBody>
    )
  }
  private renderFooterButtons() {
    const { submitting } = this.state
    return (
      <ModalFooter>
        <Button color='success' type='submit' disabled={submitting} >
          <i className='fas fa-check fa-fw mr-2'></i>
          Submit
        </Button>
        {' '}
        <Button outline color='info' onClick={this.onCancel}>
          <i className='fas fa-ban fa-fw mr-2'></i>
          Cancel
        </Button>
      </ModalFooter>
    )
  }
  private onCancel() {
    const { toggle } = this.props
    toggle()
  }
  private onSubmit(params) {
    const { saveAccessControl, applicationId } = this.props
    this.setState({ submitting: true })
    saveAccessControl({
      applicationId,
      ...params.save.user,
    })
  }
}

export default connect(
  (state: any) => {
    return {
      ...state.form,
    }
  },
  (dispatch: Dispatch): DispathProps => {
    return {
      saveAccessControl: (params) => saveAccessControlDispatcher(dispatch, params)
    }
  }
)(
  reduxForm<{}, AddUserFormCustomProps>({
    form: 'saveUserForm'
  })(AddUserModal)
)
