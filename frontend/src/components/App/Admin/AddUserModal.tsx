import * as React from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap'
import { Field, InjectedFormProps, reduxForm } from 'redux-form'
import { connect } from 'react-redux'

import { SingleFormField } from '@components/Common/Field/SingleFormField'
import { required } from '@components/Common/Field/Validateors'

interface AddUserFormCustomProps {
  isModalOpen: boolean
  toggle: () => void
}

type AddUserFormProps = AddUserFormCustomProps & InjectedFormProps<{}, AddUserFormCustomProps>

class AddUserModal extends React.Component<AddUserFormProps> {
  constructor(props) {
    super(props)
    this.onCancel = this.onCancel.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
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
    return (
      <ModalBody>
        <Field
          label='User ID'
          name='add.user.uid'
          component={SingleFormField} type='text'
          className='form-control' id='modelDescription'
        />
      </ModalBody>
    )
  }
  private renderFooterButtons() {
    return (
      <ModalFooter>
        <Button color='success' type='submit'>
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
  private onSubmit() {
    // TODO
  }
}

export default connect()(
  reduxForm<{}, AddUserFormCustomProps>({
    form: 'addUserForm'
  })(AddUserModal)
)
