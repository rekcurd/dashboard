import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Formik, Form, ErrorMessage, Field } from 'formik'
import * as Yup from "yup";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap'

import { UserInfo, ApplicationAccessControlList, AccessControlParam } from '@src/apis'
import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  addNotification,
  AddNotificationAction,
  saveApplicationAccessControlDispatcher,
  fetchAllUsersDispatcher,
} from '@src/actions'
import { APIRequestResultsRenderer } from '@components/Common/APIRequestResultsRenderer'
import { applicationRole } from '@components/Common/Enum'

interface CustomProps {
  isModalOpen: boolean
  acl: ApplicationAccessControlList[]
  toggle: () => void
  reload: () => void
}

interface StateProps {
  fetchAllUsersStatus: APIRequest<UserInfo[]>
  saveApplicationAccessControlStatus: APIRequest<boolean>
}

interface DispatchProps {
  addNotification: (params) => AddNotificationAction
  fetchAllUsers: () => Promise<void>
  saveApplicationAccessControl: (params: AccessControlParam) => Promise<void>
}

type AddUserApplicationRoleModalProps = CustomProps & StateProps & DispatchProps & RouteComponentProps<{projectId: number, applicationId: string}>

interface AddUserApplicationRoleModalState {
  submitting: boolean
}

const UserRoleSchema = Yup.object().shape({
  uid: Yup.string()
    .required('Required'),
  role: Yup.string()
    .oneof([applicationRole.admin.toString(), applicationRole.editor.toString(), applicationRole.viewer.toString()])
    .required('Required'),
});

class AddUserApplicationRoleModal extends React.Component<AddUserApplicationRoleModalProps, AddUserApplicationRoleModalState> {
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
    props.acl.forEach((e: ApplicationAccessControlList) => {
      this.alreadyAdded.add(e.userUid)
    })
  }

  componentDidMount() {
    this.props.fetchAllUsers()
  }

  componentDidUpdate(prevProps, prevState) {
    const { isModalOpen } = prevProps
    const { saveApplicationAccessControlStatus, toggle, reload } = this.props
    const { submitting } = this.state

    if (isModalOpen && submitting) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveApplicationAccessControlStatus)
      const failed: any = isAPIFailed<boolean>(saveApplicationAccessControlStatus) && saveApplicationAccessControlStatus.error
      if (succeeded) {
        this.props.addNotification({ color: 'success', message: 'Successfully added user' })
        toggle()
        reload()
      }
      if (failed) {
        const message: string = failed.message || 'Something went wrong. Try again later'
        this.props.addNotification({ color: 'error', message })
      }
    }
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
    return (
      <Formik
        initialValues={{
          uid: '',
          role: applicationRole.viewer.toString(),
        }}
        validationSchema={UserRoleSchema}
        onSubmit={this.onSubmit}>
        {({ errors, touched }) => (
          <Form>
            <ModalHeader toggle={this.onCancel}>
              <i className='fas fa-user-plus fa-fw mr-2'></i>
              Add User
            </ModalHeader>
            <ModalBody>
              {this.renderUsers(results.fetchAllUsersStatus)}
              {errors.uid && touched.uid ? (
                <div>{errors.uid}</div>
              ) : null}
              <ErrorMessage name="uid" />
              {this.renderRoles()}
              {errors.role && touched.role ? (
                <div>{errors.role}</div>
              ) : null}
              <ErrorMessage name="role" />
            </ModalBody>
            <ModalFooter>
              <Button color='success' type='submit' disabled={this.state.submitting} >
                <i className='fas fa-check fa-fw mr-2'></i>
                Submit
              </Button>
              {' '}
              <Button outline color='info' onClick={this.onCancel}>
                <i className='fas fa-ban fa-fw mr-2'></i>
                Cancel
              </Button>
            </ModalFooter>
          </Form>
          )}
      </Formik>
    )
  }
  private renderUsers(userInfos: UserInfo[]) {
    const users = userInfos.map((v: UserInfo) => {
      return (
        <option value={v.user.userUid} label={v.user.userUid} disabled={this.alreadyAdded.has(v.user.userUid)}>
          {v.user.userUid}
        </option>
      )
    })
    return (
      <Field name="uid" component="select" className='form-control' id='userId'>
        {users}
      </Field>
    )
  }
  private renderRoles() {
    const roles = Object.values(applicationRole).map((roleName: string) => {
      return (
        <option value={roleName} label={roleName}>
          {roleName}
        </option>
      )
    })
    return (
      <Field name="role" component="select" className='form-control' id='userRole'>
        {roles}
      </Field>
    )
  }
  private onCancel() {
    const { toggle } = this.props
    toggle()
  }
  private onSubmit(params) {
    const { saveApplicationAccessControl, match } = this.props
    const projectId = match.params.projectId
    const applicationId = match.params.applicationId
    this.setState({ submitting: true })
    return saveApplicationAccessControl({
      projectId,
      applicationId,
      ...params,
      method: 'post'
    })
  }
}

const mapStateToProps = (state: any) => (
  {
    fetchAllUsersStatus: state.fetchAllUsersReducer.fetchAllUsers,
    saveApplicationAccessControlStatus: state.saveApplicationAccessControlReducer.saveApplicationAccessControl
  }
)

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    fetchAllUsers: () => fetchAllUsersDispatcher(dispatch),
    saveApplicationAccessControl: (params: AccessControlParam) => saveApplicationAccessControlDispatcher(dispatch, params)
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number,  applicationId: string}> & CustomProps>(
    mapStateToProps, mapDispatchToProps
  )(AddUserApplicationRoleModal)
)
