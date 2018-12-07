import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Dispatch } from 'redux'
import { Field, InjectedFormProps, reduxForm } from 'redux-form'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap'

import { UserInfo, AccessControlList } from '@src/apis'
import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { saveAccessControlDispatcher, addNotification, AddNotificationAction, fetchAllUsersDispatcher } from '@src/actions'
import { SingleFormField } from '@components/Common/Field/SingleFormField'
import { required } from '@components/Common/Field/Validateors'
import { APIRequestResultsRenderer } from '@components/Common/APIRequestResultsRenderer'
import { role } from './constants'

interface Props extends RouteComponentProps<{ applicationId: string }> {
  isModalOpen: boolean
  acl: AccessControlList[]
  toggle: () => void
  reload: () => void
}

interface StateProps {
  fetchAllUsersStatus: APIRequest<UserInfo[]>
  saveAccessControlStatus: APIRequest<boolean>
}

interface DispatchProps {
  addNotification: (params) => AddNotificationAction
  fetchAllUsers: () => Promise<void>
  saveAccessControl: (params) => Promise<void>
}

type AddUserModalProps = Props & StateProps & DispatchProps & InjectedFormProps<any, any>

class AddUserModal extends React.Component<AddUserModalProps> {
  private alreadyAdded: Set<string>
  constructor(props) {
    super(props)
    this.onCancel = this.onCancel.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.renderForm = this.renderForm.bind(this)
    this.state = {
      submitting: false
    }
    this.alreadyAdded = new Set<string>()
    props.acl.forEach((e: AccessControlList) => {
      this.alreadyAdded.add(e.userUid)
    })
  }
  componentWillReceiveProps(nextProps: AddUserModalProps) {
    const { isModalOpen } = this.props
    const { saveAccessControlStatus, reset, toggle, reload, submitting } = nextProps
    if (isModalOpen && submitting) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveAccessControlStatus)
      const failed: boolean = isAPIFailed<boolean>(saveAccessControlStatus)
      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully added user' })
        reset()
        toggle()
        reload()
      }
      if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
      }
    }
  }
  componentWillMount() {
    const { fetchAllUsers } = this.props
    fetchAllUsers()
  }
  render() {
    const { fetchAllUsersStatus, isModalOpen } = this.props
    return (
      <Modal isOpen={isModalOpen} toggle={this.onCancel}>
        <APIRequestResultsRenderer
          APIStatus={{ fetchAllUsersStatus }}
          render={this.renderForm}
        />
      </Modal>
    )
  }
  private renderForm(results) {
    const { handleSubmit } = this.props
    return (
      <form onSubmit={handleSubmit(this.onSubmit)}>
        <ModalHeader toggle={this.onCancel}>
          <i className='fas fa-user-plus fa-fw mr-2'></i>
          Add User
        </ModalHeader>
        {this.renderBodyForm(results.fetchAllUsersStatus)}
        {this.renderFooterButtons()}
      </form>
    )
  }
  private renderBodyForm(userInfos: UserInfo[]) {
    const roles = Object.values(role).map((roleName: string) => {
      return { label: roleName, value: roleName }
    })
    const users = userInfos.map((v: UserInfo) => {
      return {
        label: v.user.userUid,
        value: v.user.userUid,
        disabled: this.alreadyAdded.has(v.user.userUid)
      }
    })
    return (
      <ModalBody>
        <Field
          label='User ID'
          name='save.user.uid'
          component={SingleFormField} type='select'
          options={users}
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
      mode: 'add'
    })
  }
}

export default withRouter(
  connect(
    (state: any): StateProps => {
      return {
        ...state.form,
        fetchAllUsersStatus: state.fetchAllUsersStatusReducer.allUsers,
        saveAccessControlStatus: state.saveAccessControlReducer.saveAccessControl
      }
    },
    (dispatch: Dispatch): DispatchProps => {
      return {
        addNotification: (params) => dispatch(addNotification(params)),
        fetchAllUsers: () => fetchAllUsersDispatcher(dispatch),
        saveAccessControl: (params) => saveAccessControlDispatcher(dispatch, params)
      }
    }
  )(reduxForm<{}, Props>({
    form: 'saveUserForm'
  })(AddUserModal))
)
