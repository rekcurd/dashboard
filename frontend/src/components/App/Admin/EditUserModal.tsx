import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Dispatch } from 'redux'
import { InjectedFormProps, reduxForm, Field } from 'redux-form'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap'

import { AccessControlList } from '@src/apis'
import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { saveAccessControlDispatcher, AddNotificationAction, addNotification } from '@src/actions'
import { SingleFormField } from '@components/Common/Field/SingleFormField'
import { required } from '@components/Common/Field/Validateors'
import { role } from './constants'

interface Props extends RouteComponentProps<{ applicationId: string }> {
  isModalOpen: boolean
  toggle: () => void
  reload: () => void
  target?: AccessControlList
}

interface StateProps {
  saveAccessControlStatus: APIRequest<boolean>
}

interface DispatchProps {
  addNotification: (params) => AddNotificationAction
  saveAccessControl: (params) => Promise<void>
}

type EditUserModalProps = Props & StateProps & DispatchProps & InjectedFormProps<{}, Props>

class EditUserModal extends React.Component<EditUserModalProps> {
  constructor(props: EditUserModalProps) {
    super(props)
    this.onCancel = this.onCancel.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }
  componentWillReceiveProps(nextProps: EditUserModalProps) {
    const { isModalOpen } = this.props
    const { saveAccessControlStatus, reset, toggle, reload, submitting } = nextProps
    if (isModalOpen && submitting) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveAccessControlStatus)
      const failed: boolean = isAPIFailed<boolean>(saveAccessControlStatus)
      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully updated user' })
        reset()
        toggle()
        reload()
      }
      if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
      }
    }
  }
  render() {
    const { isModalOpen, handleSubmit, target } = this.props
    if (!target) {
      return null
    }
    return (
      <Modal isOpen={isModalOpen} toggle={this.onCancel}>
        <form onSubmit={handleSubmit(this.onSubmit)}>
          <ModalHeader toggle={this.onCancel}>
            <i className='fas fa-user-plus fa-fw mr-2'></i>
            Edit User {target.userUid}
          </ModalHeader>
          {this.renderBodyForm(target)}
          {this.renderFooterButtons()}
        </form>
      </Modal>
    )
  }
  private renderBodyForm(target: AccessControlList) {
    const roles = Object.values(role).map((roleName: string) => {
      return { label: roleName, value: roleName }
    })
    return (
      <ModalBody>
        <Field
          label='Role'
          name='edit.user.role'
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
    const { saveAccessControl, match, target } = this.props
    const applicationId = match.params.applicationId
    this.setState({ submitting: true })
    return saveAccessControl({
      applicationId,
      ...params.edit.user,
      uid: target.userUid,
      mode: 'edit'
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
    (dispatch: Dispatch): DispatchProps => {
      return {
        addNotification: (params) => dispatch(addNotification(params)),
        saveAccessControl: (params) => saveAccessControlDispatcher(dispatch, params)
      }
    }
  )(reduxForm<{}, Props>({
    form: 'editUserForm'
  })(EditUserModal))
)
