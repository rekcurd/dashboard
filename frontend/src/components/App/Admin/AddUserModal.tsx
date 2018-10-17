import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Dispatch } from 'redux'
import { Field, InjectedFormProps, reduxForm } from 'redux-form'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap'

import { SingleFormField } from '@components/Common/Field/SingleFormField'
import { required } from '@components/Common/Field/Validateors'
import { saveAccessControlDispatcher } from '@src/actions'
import { APIRequest, isAPISucceeded } from '@src/apis/Core'

interface Props extends RouteComponentProps<{ applicationId: string }> {
  isModalOpen: boolean
  toggle: () => void
  reload: () => void
}

interface StateProps {
  saveAccessControlStatus: APIRequest<boolean>
}

interface DispathProps {
  saveAccessControl: (params) => Promise<void>
}

type AddUserModalProps = Props & StateProps & DispathProps & InjectedFormProps<any, any>

class AddUserModal extends React.Component<AddUserModalProps> {
  constructor(props) {
    super(props)
    this.onCancel = this.onCancel.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.state = {
      submitting: false
    }
  }
  componentWillReceiveProps(nextProps: AddUserModalProps) {
    const { isModalOpen } = this.props
    const { saveAccessControlStatus, reset, toggle, reload, submitting } = nextProps
    if (isModalOpen && submitting) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveAccessControlStatus)
      if (succeeded) {
        reset()
        toggle()
        reload()
      }
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
    const { submitting } = this.props
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
    const { saveAccessControl, match } = this.props
    const applicationId = match.params.applicationId
    this.setState({ submitting: true })
    return saveAccessControl({
      applicationId,
      ...params.save.user,
    })
  }
}

export default withRouter(
  connect(
    (state: any): StateProps => {
      return {
        ...state.form,
        saveAccessControlStatus: state.saveAccessControlReducer.saveAccessControl
      }
    },
    (dispatch: Dispatch): DispathProps => {
      return {
        saveAccessControl: (params) => saveAccessControlDispatcher(dispatch, params)
      }
    }
  )(reduxForm<{}, Props>({
    form: 'saveUserForm'
  })(AddUserModal))
)
