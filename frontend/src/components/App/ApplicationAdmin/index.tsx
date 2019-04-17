import * as React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Table, Row, Col, Button, Modal, ModalHeader, ModalBody } from 'reactstrap'

import {
  ApplicationAccessControlList, Application, UserInfo, AccessControlParam, FetchApplicationByIdParam
} from '@src/apis'
import {APIRequest, isAPIFailed, isAPISucceeded} from '@src/apis/Core'
import {
  addNotification,
  AddNotificationAction,
  saveApplicationAccessControlDispatcher,
  fetchApplicationAccessControlListDispatcher,
  fetchApplicationByIdDispatcher,
  deleteApplicationAccessControlDispatcher,
  userInfoDispatcher,
} from '@src/actions'

import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'

import AddUserApplicationRoleModal from './AddUserApplicationRoleModal'
import { EditUserApplicationRoleModal } from './EditUserApplicationRoleModal'

interface StateProps {
  saveApplicationAccessControlStatus: APIRequest<boolean>
  fetchApplicationAccessControlListStatus: APIRequest<ApplicationAccessControlList[]>
  fetchApplicationByIdStatus: APIRequest<Application>
  userInfoStatus: APIRequest<UserInfo>
  deleteApplicationAccessControlStatus: APIRequest<boolean>
}

interface DispatchProps {
  addNotification: (params) => AddNotificationAction
  saveApplicationAccessControl: (params: AccessControlParam) => Promise<void>
  fetchApplicationAccessControlList: (params: AccessControlParam) => Promise<void>
  fetchApplicationById: (params: FetchApplicationByIdParam) => Promise<void>
  userInfo: () => Promise<void>
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
    this.props.fetchApplicationById(params)
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
    const { fetchApplicationByIdStatus, fetchApplicationAccessControlListStatus, userInfoStatus } = this.props
    const targetStatus = {fetchApplicationByIdStatus, fetchApplicationAccessControlListStatus, userInfoStatus}

    return (
      <APIRequestResultsRenderer
        APIStatus={targetStatus}
        render={this.renderApplicationAccessControlList}
        projectId={this.props.match.params.projectId}
        applicationId={this.props.match.params.applicationId}
      />
    )
  }
  renderApplicationAccessControlList(results, canEdit) {
    const application: Application = results.fetchApplicationByIdStatus
    const applicationAcl: ApplicationAccessControlList[] = results.fetchApplicationAccessControlListStatus
    const userInfo: UserInfo = results.userInfoStatus
    return this.renderContent(application, applicationAcl, userInfo, canEdit)
  }
  renderContent(application: Application, applicationAcl: ApplicationAccessControlList[],
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
        <Row className='align-items-center mb-5'>
          <Col xs='7'>
            <h1>
              <i className='fas fa-ship fa-fw mr-2'></i>
              {application.name}
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
          <i className='fas fa-unlock fa-fw mr-2'></i>
          Application Access Control List
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
      this.setState({ submitted: true })
      this.toggleRemoveUserModalOpen()
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
        saveApplicationAccessControlStatus: state.saveApplicationAccessControlReducer.saveApplicationAccessControl,
        fetchApplicationAccessControlListStatus: state.fetchApplicationAccessControlListReducer.fetchApplicationAccessControlList,
        fetchApplicationByIdStatus: state.fetchApplicationByIdReducer.fetchApplicationById,
        userInfoStatus: state.userInfoReducer.userInfo,
        deleteApplicationAccessControlStatus: state.deleteApplicationAccessControlReducer.deleteApplicationAccessControl
      }
    },
    (dispatch: Dispatch): DispatchProps => {
      return {
        addNotification: (params) => dispatch(addNotification(params)),
        saveApplicationAccessControl: (params: AccessControlParam) => saveApplicationAccessControlDispatcher(dispatch, params),
        fetchApplicationAccessControlList: (params: AccessControlParam) => fetchApplicationAccessControlListDispatcher(dispatch, params),
        fetchApplicationById: (params: FetchApplicationByIdParam) => fetchApplicationByIdDispatcher(dispatch, params),
        userInfo: () => userInfoDispatcher(dispatch),
        deleteApplicationAccessControl: (params: AccessControlParam) => deleteApplicationAccessControlDispatcher(dispatch, params)
      }
    }
  )(ApplicationAdmin)
)
