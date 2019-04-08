import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Formik, Form, ErrorMessage, Field } from 'formik'
import * as Yup from "yup";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap'

import { UserInfo, ProjectAccessControlList, AccessControlParam } from '@src/apis'
import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  addNotification,
  AddNotificationAction,
  saveProjectAccessControlDispatcher,
  fetchAllUsersDispatcher,
} from '@src/actions'
import { APIRequestResultsRenderer } from '@components/Common/APIRequestResultsRenderer'
import { projectRole } from '@components/Common/Enum'


interface CustomProps {
  isModalOpen: boolean
  acl: ProjectAccessControlList[]
  toggle: () => void
  reload: () => void
}

interface StateProps {
  fetchAllUsersStatus: APIRequest<UserInfo[]>
  saveProjectAccessControlStatus: APIRequest<boolean>
}

interface DispatchProps {
  addNotification: (params) => AddNotificationAction
  fetchAllUsers: () => Promise<void>
  saveProjectAccessControl: (params: AccessControlParam) => Promise<void>
}

type AddUserProjectRoleModalProps = CustomProps & StateProps & DispatchProps & RouteComponentProps<{projectId: number}>

interface AddUserProjectRoleModalState {
  submitting: boolean
}

const UserRoleSchema = Yup.object().shape({
  uid: Yup.string()
    .required('Required'),
  role: Yup.string()
    .oneof([projectRole.admin.toString(), projectRole.member.toString()])
    .required('Required'),
});

class AddUserProjectRoleModal extends React.Component<AddUserProjectRoleModalProps, AddUserProjectRoleModalState> {
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
    props.acl.forEach((e: ProjectAccessControlList) => {
      this.alreadyAdded.add(e.userUid)
    })
  }

  componentDidMount() {
    this.props.fetchAllUsers()
  }

  componentDidUpdate(prevProps, prevState) {
    const { isModalOpen } = prevProps
    const { saveProjectAccessControlStatus, toggle, reload } = this.props
    const { submitting } = this.state

    if (isModalOpen && submitting) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveProjectAccessControlStatus)
      const failed: any = isAPIFailed<boolean>(saveProjectAccessControlStatus) && saveProjectAccessControlStatus.error
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
      <React.Fragment>
        <Formik
          initialValues={{
            uid: '',
            role: projectRole.member.toString(),
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
      </React.Fragment>
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
    const roles = Object.values(projectRole).map((roleName: string) => {
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
    const { saveProjectAccessControl, match } = this.props
    const projectId = match.params.projectId
    this.setState({ submitting: true })
    return saveProjectAccessControl({
      projectId,
      ...params,
      method: 'post'
    })
  }
}

const mapStateToProps = (state: any) => (
  {
    fetchAllUsersStatus: state.fetchAllUsersReducer.fetchAllUsers,
    saveProjectAccessControlStatus: state.saveProjectAccessControlReducer.saveProjectAccessControl
  }
)

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    fetchAllUsers: () => fetchAllUsersDispatcher(dispatch),
    saveProjectAccessControl: (params: AccessControlParam) => saveProjectAccessControlDispatcher(dispatch, params)
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number}> & CustomProps>(
    mapStateToProps, mapDispatchToProps
  )(AddUserProjectRoleModal)
)
