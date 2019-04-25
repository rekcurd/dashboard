import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Formik, Form, Field } from 'formik'
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
import { FormikInput } from '@common/Field'


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
    .oneOf([projectRole.admin.toString(), projectRole.member.toString()])
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
          onSubmit={(values, {setSubmitting}) => {
            this.onSubmit(values).then(
              result => {
                setSubmitting(false)
              },
              errors => {
                setSubmitting(false)
              }
            )}
          }>
          {({ isSubmitting }) => (
            <Form>
              <ModalHeader toggle={this.onCancel}>
                <i className='fas fa-user-plus fa-fw mr-2'></i>
                Add User
              </ModalHeader>
              <ModalBody>
                {this.renderUsers(results.fetchAllUsersStatus)}
                {this.renderRoles()}
              </ModalBody>
              <ModalFooter>
                <Button color='success' type='submit' disabled={isSubmitting} >
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
      const disabled = this.alreadyAdded.has(v.user.userUid)
      return {
        value: v.user.userUid,
        label: v.user.userUid,
        disabled: disabled
      }
    })
    return (
      <Field
        name="uid"
        label="UserID"
        component={FormikInput}
        type="select"
        className='form-control'
        placeholder=""
        options={users}
        onChange={() => {}}
        required />
    )
  }
  private renderRoles() {
    const roles = Object.values(projectRole).map((roleName: string) => {
      return {
        value: roleName,
        label: roleName
      }
    })
    return (
      <Field
        name="role"
        label="Project Role"
        component={FormikInput}
        type="select"
        className='form-control'
        placeholder=""
        options={roles}
        onChange={() => {}}
        required />
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
