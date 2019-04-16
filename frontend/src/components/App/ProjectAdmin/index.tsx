import * as React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Table, Row, Col, Button, Modal, ModalHeader, ModalBody } from 'reactstrap'

import {
  ProjectAccessControlList, Project, UserInfo, AccessControlParam, FetchProjectByIdParam
} from '@src/apis'
import {APIRequest, isAPIFailed, isAPISucceeded} from '@src/apis/Core'
import {
  addNotification,
  AddNotificationAction,
  saveProjectAccessControlDispatcher,
  fetchProjectAccessControlListDispatcher,
  fetchProjectByIdDispatcher,
  deleteProjectAccessControlDispatcher,
  userInfoDispatcher,
} from '@src/actions'

import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'

import AddUserProjectRoleModal from './AddUserProjectRoleModal'
import { EditUserProjectRoleModal } from './EditUserProjectRoleModal'

interface StateProps {
  saveProjectAccessControlStatus: APIRequest<boolean>
  fetchProjectAccessControlListStatus: APIRequest<ProjectAccessControlList[]>
  fetchProjectByIdStatus: APIRequest<Project>
  userInfoStatus: APIRequest<UserInfo>
  deleteProjectAccessControlStatus: APIRequest<boolean>
}

interface DispatchProps {
  addNotification: (params) => AddNotificationAction
  saveProjectAccessControl: (params: AccessControlParam) => Promise<void>
  fetchProjectAccessControlList: (params: AccessControlParam) => Promise<void>
  fetchProjectById: (params: FetchProjectByIdParam) => Promise<void>
  userInfo: () => Promise<void>
  deleteProjectAccessControl: (params: AccessControlParam) => Promise<void>
}

type ProjectAdminProps = StateProps & DispatchProps & RouteComponentProps<{projectId: number}>

interface ProjectAdminState {
  isAddUserProjectRoleModalOpen: boolean
  isEditUserProjectRoleModalOpen: boolean
  isRemoveUserProjectRoleModalOpen: boolean
  removeUserProjectRoleTarget?: string
  editUserProjectRoleTarget?: ProjectAccessControlList
  submitted: boolean
}

class ProjectAdmin extends React.Component<ProjectAdminProps, ProjectAdminState> {
  constructor(props: ProjectAdminProps) {
    super(props)
    this.renderProjectAccessControlList = this.renderProjectAccessControlList.bind(this)
    this.toggleAddUserProjectRoleModalOpen = this.toggleAddUserProjectRoleModalOpen.bind(this)
    this.toggleEditUserProjectRoleModalOpen = this.toggleEditUserProjectRoleModalOpen.bind(this)
    this.reload = this.reload.bind(this)
    this.state = {
      isAddUserProjectRoleModalOpen: false,
      isEditUserProjectRoleModalOpen: false,
      isRemoveUserProjectRoleModalOpen: false,
      submitted: false
    }
  }

  componentDidMount() {
    const params = {
      projectId: this.props.match.params.projectId,
    }
    this.props.fetchProjectAccessControlList(params)
    this.props.fetchProjectById(params)
  }

  static getDerivedStateFromProps(nextProps: ProjectAdminProps, prevState: ProjectAdminState){
    const { submitted } = prevState
    const { deleteProjectAccessControlStatus } = nextProps

    if (submitted) {
      const succeeded: boolean = isAPISucceeded<boolean>(deleteProjectAccessControlStatus) && deleteProjectAccessControlStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(deleteProjectAccessControlStatus) && !deleteProjectAccessControlStatus.result) || isAPIFailed<boolean>(deleteProjectAccessControlStatus)
      if (succeeded) {
        nextProps.addNotification({color: 'success', message: 'Successfully removed user'})
        nextProps.fetchProjectAccessControlList(nextProps.match.params)
        return { submitted: false }
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        return { submitted: false }
      }
    }
    return null
  }

  render() {
    const {
      fetchProjectByIdStatus,
      fetchProjectAccessControlListStatus,
      userInfoStatus } = this.props
    return (
      <APIRequestResultsRenderer
        APIStatus={{
          fetchProjectByIdStatus, fetchProjectAccessControlListStatus,
          userInfoStatus
        }}
        render={this.renderProjectAccessControlList}
      />
    )
  }
  renderProjectAccessControlList(results) {
    const project: Project = results.fetchProjectByIdStatus
    const projectAcl: ProjectAccessControlList[] = results.fetchProjectAccessControlListStatus
    const userInfo: UserInfo = results.userInfoStatus
    return this.renderContent(project, projectAcl, userInfo)
  }
  renderContent(project: Project, projectAcl: ProjectAccessControlList[],
                userInfo: UserInfo) {
    const { match, saveProjectAccessControl } = this.props
    const {
      isAddUserProjectRoleModalOpen, isEditUserProjectRoleModalOpen, editUserProjectRoleTarget
    } = this.state
    const tableBody = projectAcl.map((e: ProjectAccessControlList, i: number) => {
      const isMyself: boolean = e.userUid === userInfo.user.userUid
      const removeButton = (
        <Button color='danger' size='sm' onClick={this.onClickRemoveButton(e)}>
          <i className={`fas fa-times fa-fw mr-2`}></i>
          Remove
        </Button>
      )
      return (
        <tr key={i}>
          <td>
            <div
              className={isMyself ? '' : 'text-info'}
              style={isMyself ? {} : { cursor: 'pointer' }}
              onClick={isMyself ? null : this.onClickEditUser(e)}>
              {e.userUid}
            </div>
          </td>
          <td>{e.userName}</td>
          <td>{typeof e.role === "boolean" ? null : e.role.replace(/ProjectRole./, '')}</td>
          <td>{isMyself ? null : removeButton}</td>
        </tr>
      )
    })
    return (
      <div className='row justify-content-center'>
        <div className='col-10 pt-5'>
          <div className='d-flex justify-content-between align-items-center mb-4'>
            <h1>
              <i className='fas fa-unlock fa-fw mr-2'></i>
              Project Access Control List
            </h1>
            <div>
              <Button
                color='primary'
                size='sm'
                onClick={this.toggleAddUserProjectRoleModalOpen} >
                <i className='fas fa-user-plus fa-fw mr-2'></i>
                Add User
              </Button>
            </div>
          </div>
          <AddUserProjectRoleModal
            isModalOpen={isAddUserProjectRoleModalOpen}
            toggle={this.toggleAddUserProjectRoleModalOpen}
            reload={this.reload}
            acl={projectAcl}
          />
          <EditUserProjectRoleModal
            projectId={match.params.projectId}
            isModalOpen={isEditUserProjectRoleModalOpen}
            toggle={this.toggleEditUserProjectRoleModalOpen}
            reload={this.reload}
            target={editUserProjectRoleTarget}
            saveProjectAccessControl={saveProjectAccessControl}
            saveProjectAccessControlStatus={this.props.saveProjectAccessControlStatus}
            addNotification={this.props.addNotification}
          />
          {this.renderConfirmRemoveUserModal()}
          <hr />
          <Table hover className='mb-3'>
            <thead>
            <tr className='bg-light text-primary'>
              <th>ID</th><th>Name</th><th>Role</th><th></th>
            </tr>
            </thead>
            <tbody>{tableBody}</tbody>
          </Table>
        </div>
      </div>
    )
  }

  private renderConfirmRemoveUserModal(): JSX.Element {
    const { deleteProjectAccessControl, match } = this.props
    const { isRemoveUserProjectRoleModalOpen, removeUserProjectRoleTarget } = this.state
    const cancel = this.toggleRemoveUserModalOpen.bind(this)
    const executeDeletion = () => {
      deleteProjectAccessControl({
        projectId: match.params.projectId,
        uid: removeUserProjectRoleTarget
      })
      this.setState({ submitted: true })
      this.toggleRemoveUserModalOpen()
    }
    return (
      <Modal isOpen={isRemoveUserProjectRoleModalOpen} toggle={cancel} size='sm'>
        <ModalHeader toggle={cancel}>Remove User</ModalHeader>
        <ModalBody>
          Are you sure to remove {removeUserProjectRoleTarget}?
        </ModalBody>
        <div className='d-flex flex-row mt-3'>
          <Button
            color='danger'
            size='lg'
            className='rounded-0 flex-1'
            onClick={executeDeletion}
          >
            <i className='fas fa-exclamation-circle mr-3' />
            Remove
          </Button>
          <Button
            color='secondary'
            size='lg'
            className='rounded-0 flex-1'
            onClick={cancel}
          >
            <i className='fas fa-ban mr-3' />
            Cancel
          </Button>
        </div>
      </Modal>
    )
  }
  private toggleAddUserProjectRoleModalOpen() {
    const { isAddUserProjectRoleModalOpen } = this.state
    this.setState({
      isAddUserProjectRoleModalOpen: !isAddUserProjectRoleModalOpen,
    })
  }
  private toggleEditUserProjectRoleModalOpen() {
    const { isEditUserProjectRoleModalOpen } = this.state
    this.setState({
      isEditUserProjectRoleModalOpen: !isEditUserProjectRoleModalOpen,
    })
  }
  private toggleRemoveUserModalOpen() {
    const { isRemoveUserProjectRoleModalOpen } = this.state
    this.setState({
      isRemoveUserProjectRoleModalOpen: !isRemoveUserProjectRoleModalOpen,
    })
  }
  private onClickRemoveButton(acl: ProjectAccessControlList) {
    return () => {
      this.setState({ removeUserProjectRoleTarget: acl.userUid })
      this.toggleRemoveUserModalOpen()
    }
  }
  private onClickEditUser(acl: ProjectAccessControlList) {
    return () => {
      this.toggleEditUserProjectRoleModalOpen()
      this.setState({ editUserProjectRoleTarget: acl })
    }
  }
  private reload() {
    const { fetchProjectAccessControlList, match } = this.props
    fetchProjectAccessControlList({projectId: match.params.projectId})
  }
}

export default withRouter(
  connect(
    (state: any): StateProps => {
      return {
        saveProjectAccessControlStatus: state.saveProjectAccessControlReducer.saveProjectAccessControl,
        fetchProjectAccessControlListStatus: state.fetchProjectAccessControlListReducer.fetchProjectAccessControlList,
        fetchProjectByIdStatus: state.fetchProjectByIdReducer.fetchProjectById,
        userInfoStatus: state.userInfoReducer.userInfo,
        deleteProjectAccessControlStatus: state.deleteProjectAccessControlReducer.deleteProjectAccessControl
      }
    },
    (dispatch: Dispatch): DispatchProps => {
      return {
        addNotification: (params) => dispatch(addNotification(params)),
        saveProjectAccessControl: (params: AccessControlParam) => saveProjectAccessControlDispatcher(dispatch, params),
        fetchProjectAccessControlList: (params: AccessControlParam) => fetchProjectAccessControlListDispatcher(dispatch, params),
        fetchProjectById: (params: FetchProjectByIdParam) => fetchProjectByIdDispatcher(dispatch, params),
        userInfo: () => userInfoDispatcher(dispatch),
        deleteProjectAccessControl: (params: AccessControlParam) => deleteProjectAccessControlDispatcher(dispatch, params)
      }
    }
  )(ProjectAdmin)
)
