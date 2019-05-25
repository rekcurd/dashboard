import * as React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Breadcrumb, BreadcrumbItem, Table, Row, Col, Button, Modal, ModalHeader, ModalBody } from 'reactstrap'

import {
  ApplicationAccessControlList, Application, UserInfo, AccessControlParam, Project
} from '@src/apis'
import { APIRequest, isAPIFailed, isAPISucceeded } from '@src/apis/Core'
import {
  addNotification,
  AddNotificationAction,
  saveApplicationAccessControlDispatcher,
  fetchApplicationAccessControlListDispatcher,
  deleteApplicationAccessControlDispatcher,
} from '@src/actions'

import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'

import AddUserApplicationRoleModal from './AddUserApplicationRoleModal'
import { EditUserApplicationRoleModal } from './EditUserApplicationRoleModal'

interface StateProps {
  project: APIRequest<Project>
  saveApplicationAccessControlStatus: APIRequest<boolean>
  fetchApplicationAccessControlListStatus: APIRequest<ApplicationAccessControlList[]>
  application: APIRequest<Application>
  userInfoStatus: APIRequest<UserInfo>
  deleteApplicationAccessControlStatus: APIRequest<boolean>
}

interface DispatchProps {
  addNotification: (params) => AddNotificationAction
  saveApplicationAccessControl: (params: AccessControlParam) => Promise<void>
  fetchApplicationAccessControlList: (params: AccessControlParam) => Promise<void>
  deleteApplicationAccessControl: (params: AccessControlParam) => Promise<void>
}

type ApplicationAdminProps = StateProps & DispatchProps & RouteComponentProps<{projectId: number, applicationId: string}>

interface ApplicationAdminState {
  isAddUserApplicationRoleModalOpen: boolean
  isEditUserApplicationRoleModalOpen: boolean
  isRemoveUserApplicationRoleModalOpen: boolean
  removeUserApplicationRoleTarget?: string
  editUserApplicationRoleTarget?: ApplicationAccessControlList
  submitted: boolean
}

class ApplicationAdmin extends React.Component<ApplicationAdminProps, ApplicationAdminState> {
  constructor(props: ApplicationAdminProps) {
    super(props)
    this.renderApplicationAccessControlList = this.renderApplicationAccessControlList.bind(this)
    this.toggleAddUserApplicationRoleModalOpen = this.toggleAddUserApplicationRoleModalOpen.bind(this)
    this.toggleEditUserApplicationRoleModalOpen = this.toggleEditUserApplicationRoleModalOpen.bind(this)
    this.reload = this.reload.bind(this)
    this.state = {
      isAddUserApplicationRoleModalOpen: false,
      isEditUserApplicationRoleModalOpen: false,
      isRemoveUserApplicationRoleModalOpen: false,
      submitted: false
    }
  }

  componentDidMount() {
    const params = {
      projectId: this.props.match.params.projectId,
      applicationId: this.props.match.params.applicationId
    }
    this.props.fetchApplicationAccessControlList(params)
  }

  static getDerivedStateFromProps(nextProps: ApplicationAdminProps, prevState: ApplicationAdminState){
    const { submitted } = prevState
    const { deleteApplicationAccessControlStatus } = nextProps

    if (submitted) {
      const succeeded: boolean = isAPISucceeded<boolean>(deleteApplicationAccessControlStatus) && deleteApplicationAccessControlStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(deleteApplicationAccessControlStatus) && !deleteApplicationAccessControlStatus.result) || isAPIFailed<boolean>(deleteApplicationAccessControlStatus)
      if (succeeded) {
        nextProps.addNotification({color: 'success', message: 'Successfully removed user'})
        nextProps.fetchApplicationAccessControlList(nextProps.match.params)
        return { submitted: false }
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        return { submitted: false }
      }
    }
    return null
  }

  render() {
    const { project, application, fetchApplicationAccessControlListStatus, userInfoStatus } = this.props
    const targetStatus = {project, application, fetchApplicationAccessControlListStatus, userInfoStatus}

    return (
      <APIRequestResultsRenderer
        APIStatus={targetStatus}
        render={this.renderApplicationAccessControlList}
      />
    )
  }
  renderApplicationAccessControlList(results, canEdit) {
    const project: Project = results.project
    const application: Application = results.application
    const applicationAcl: ApplicationAccessControlList[] = results.fetchApplicationAccessControlListStatus
    const userInfo: UserInfo = results.userInfoStatus
    return this.renderContent(project, application, applicationAcl, userInfo, canEdit)
  }
  renderContent(project: Project, application: Application, applicationAcl: ApplicationAccessControlList[],
                userInfo: UserInfo, canEdit: boolean) {
    const { match, saveApplicationAccessControl } = this.props
    const {
      isAddUserApplicationRoleModalOpen, isEditUserApplicationRoleModalOpen, editUserApplicationRoleTarget
    } = this.state
    const tableBody = applicationAcl.map((e: ApplicationAccessControlList, i: number) => {
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
            {canEdit ?
              <div
                className={isMyself ? '' : 'text-info'}
                style={isMyself ? {} : {cursor: 'pointer'}}
                onClick={isMyself ? null : this.onClickEditUser(e)}>
                {e.userUid}
              </div> : <div>{e.userUid}</div>
            }
          </td>
          <td>{e.userName}</td>
          <td>{typeof e.role === "boolean" ? null : e.role.replace(/ApplicationRole./, '')}</td>
          {(!canEdit || isMyself) ? null : <td>{removeButton}</td>}
        </tr>
      )
    })
    return (
      <div className='pb-5'>
        <Breadcrumb tag="nav" listTag="div">
          <BreadcrumbItem tag="a" href="/">Projects</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}`}>{project.name}</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}/applications`}>Applications</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}/applications/${application.applicationId}`}>{application.name}</BreadcrumbItem>
          <BreadcrumbItem active tag="span">Admin</BreadcrumbItem>
        </Breadcrumb>
        <Row className='align-items-center mb-5'>
          <Col xs='7'>
            <h1>
              <i className='fas fa-user-lock fa-fw mr-2'></i>
              Application Admin
            </h1>
          </Col>
          {canEdit ?
            <Col xs='5' className='text-right'>
              <Button
                color='primary'
                size='sm'
                onClick={this.toggleAddUserApplicationRoleModalOpen}
              >
                <i className='fas fa-user-plus fa-fw mr-2'></i>
                Add User
              </Button>
            </Col> : null
          }
        </Row>
        {canEdit ?
          <React.Fragment>
            <AddUserApplicationRoleModal
              isModalOpen={isAddUserApplicationRoleModalOpen}
              toggle={this.toggleAddUserApplicationRoleModalOpen}
              reload={this.reload}
              acl={applicationAcl}
            />
            <EditUserApplicationRoleModal
              projectId={match.params.projectId}
              applicationId={match.params.applicationId}
              isModalOpen={isEditUserApplicationRoleModalOpen}
              toggle={this.toggleEditUserApplicationRoleModalOpen}
              reload={this.reload}
              target={editUserApplicationRoleTarget}
              saveApplicationAccessControl={saveApplicationAccessControl}
              saveApplicationAccessControlStatus={this.props.saveApplicationAccessControlStatus}
              addNotification={this.props.addNotification}
            />
            {this.renderConfirmRemoveUserModal()}
          </React.Fragment> : null
        }
        <h3>
          Access Control List
        </h3>
        <hr />
        <Table hover className='mb-3'>
          <thead>
          <tr className='bg-light text-primary'>
            <th>ID</th><th>Name</th><th>Role</th>
            {canEdit ? <th></th> : null}
          </tr>
          </thead>
          <tbody>{tableBody}</tbody>
        </Table>
      </div>
    )
  }

  private renderConfirmRemoveUserModal(): JSX.Element {
    const { deleteApplicationAccessControl, match } = this.props
    const { isRemoveUserApplicationRoleModalOpen, removeUserApplicationRoleTarget } = this.state
    const cancel = this.toggleRemoveUserModalOpen.bind(this)
    const executeDeletion = () => {
      deleteApplicationAccessControl({
        projectId: match.params.projectId,
        applicationId: match.params.applicationId,
        uid: removeUserApplicationRoleTarget
      })
      this.toggleRemoveUserModalOpen()
      this.setState({ submitted: true })
    }
    return (
      <Modal isOpen={isRemoveUserApplicationRoleModalOpen} toggle={cancel} size='sm'>
        <ModalHeader toggle={cancel}>Remove User</ModalHeader>
        <ModalBody>
          Are you sure to remove {removeUserApplicationRoleTarget}?
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
  private toggleAddUserApplicationRoleModalOpen() {
    const { isAddUserApplicationRoleModalOpen } = this.state
    this.setState({
      isAddUserApplicationRoleModalOpen: !isAddUserApplicationRoleModalOpen,
    })
  }
  private toggleEditUserApplicationRoleModalOpen() {
    const { isEditUserApplicationRoleModalOpen } = this.state
    this.setState({
      isEditUserApplicationRoleModalOpen: !isEditUserApplicationRoleModalOpen,
    })
  }
  private toggleRemoveUserModalOpen() {
    const { isRemoveUserApplicationRoleModalOpen } = this.state
    this.setState({
      isRemoveUserApplicationRoleModalOpen: !isRemoveUserApplicationRoleModalOpen,
    })
  }
  private onClickRemoveButton(acl: ApplicationAccessControlList) {
    return () => {
      this.setState({ removeUserApplicationRoleTarget: acl.userUid })
      this.toggleRemoveUserModalOpen()
    }
  }
  private onClickEditUser(acl: ApplicationAccessControlList) {
    return () => {
      this.toggleEditUserApplicationRoleModalOpen()
      this.setState({ editUserApplicationRoleTarget: acl })
    }
  }
  private reload() {
    const { fetchApplicationAccessControlList, match } = this.props
    fetchApplicationAccessControlList({projectId: match.params.projectId, applicationId: match.params.applicationId})
  }
}

export default withRouter(
  connect(
    (state: any): StateProps => {
      return {
        project: state.fetchProjectByIdReducer.fetchProjectById,
        saveApplicationAccessControlStatus: state.saveApplicationAccessControlReducer.saveApplicationAccessControl,
        fetchApplicationAccessControlListStatus: state.fetchApplicationAccessControlListReducer.fetchApplicationAccessControlList,
        application: state.fetchApplicationByIdReducer.fetchApplicationById,
        userInfoStatus: state.userInfoReducer.userInfo,
        deleteApplicationAccessControlStatus: state.deleteApplicationAccessControlReducer.deleteApplicationAccessControl
      }
    },
    (dispatch: Dispatch): DispatchProps => {
      return {
        addNotification: (params) => dispatch(addNotification(params)),
        saveApplicationAccessControl: (params: AccessControlParam) => saveApplicationAccessControlDispatcher(dispatch, params),
        fetchApplicationAccessControlList: (params: AccessControlParam) => fetchApplicationAccessControlListDispatcher(dispatch, params),
        deleteApplicationAccessControl: (params: AccessControlParam) => deleteApplicationAccessControlDispatcher(dispatch, params)
      }
    }
  )(ApplicationAdmin)
)
