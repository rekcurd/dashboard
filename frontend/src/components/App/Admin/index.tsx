import * as React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Table, Row, Col, Button, Modal, ModalHeader, ModalBody } from 'reactstrap'

import { AccessControlList, Application, UserInfo, UserRole } from '@src/apis'
import { APIRequest, isAPISucceeded } from '@src/apis/Core'
import {
  addNotification,
  AddNotificationAction,
  fetchAccessControlListDispatcher,
  fetchApplicationByIdDispatcher,
  deleteAccessControlDispatcher,
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import AddUserModal from './AddUserModal'

interface StateProps {
  accessControlList: APIRequest<AccessControlList>
  application: APIRequest<Application>
  userInfoStatus: APIRequest<UserInfo>
  deleteAccessControlStatus: APIRequest<boolean>
}

interface DispatchProps {
  addNotification: (params) => AddNotificationAction
  fetchAccessControlList: (applicationId: string) => Promise<void>
  fetchApplicationById: (id: string) => Promise<void>
  deleteAccessControl: (applicaitonId: string, userUid: string) => Promise<void>
}

type AdminProps = StateProps & DispatchProps & RouteComponentProps<{applicationId: string}>

interface AdminState {
  isAddUserModalOpen: boolean
  isRemoveUserModalOpen: boolean
  removeTarget?: string
  submitted: boolean
}

class Admin extends React.Component<AdminProps, AdminState> {
  constructor(props: AdminProps) {
    super(props)
    this.renderAccessControlList = this.renderAccessControlList.bind(this)
    this.toggleAddUserModalOpen = this.toggleAddUserModalOpen.bind(this)
    this.reload = this.reload.bind(this)
    this.state = {
      isAddUserModalOpen: false,
      isRemoveUserModalOpen: false,
      submitted: false
    }
  }
  componentWillReceiveProps(nextProps: AdminProps) {
    const { deleteAccessControlStatus, fetchAccessControlList, match } = nextProps
    const { submitted } = this.state
    if (submitted) {
      if (isAPISucceeded<boolean>(deleteAccessControlStatus)) {
        nextProps.addNotification({ color: 'success', message: 'Successfully removed user' })
        fetchAccessControlList(match.params.applicationId)
      } else {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
      }
      this.setState({ submitted: false })
    }
  }
  componentWillMount() {
    const { fetchAccessControlList, fetchApplicationById, match } = this.props
    fetchAccessControlList(match.params.applicationId)
    fetchApplicationById(match.params.applicationId)
  }
  render() {
    const { accessControlList, application, userInfoStatus } = this.props
    return (
      <APIRequestResultsRenderer
        APIStatus={{ accessControlList, application, userInfoStatus }}
        render={this.renderAccessControlList}
      />
    )
  }
  renderAccessControlList(results) {
    const { applicationId } = this.props.match.params
    const application: Application = results.application
    const acl: AccessControlList[] = results.accessControlList
    const userInfo: UserInfo = results.userInfoStatus
    const isAdmin: boolean = userInfo.roles.some((role: UserRole) => {
      return applicationId === String(role.applicationId) && role.role === 'admin'
    })
    return this.renderContent(application.name, acl, isAdmin)
  }
  renderContent(applicationName: string, acl: AccessControlList[], isAdmin: boolean) {
    const { isAddUserModalOpen } = this.state
    const tableBody = acl.map((e: AccessControlList, i: number) => {
      return (
        <tr key={i}>
          <td>{e.userUid}</td>
          <td>{e.userName}</td>
          <td>{e.role.replace(/Role./, '')}</td>
          <td>
            <Button color='danger' size='sm' onClick={this.onClickRemoveButton(e)}>
              <i className={`fas fa-times fa-fw mr-2`}></i>
              Remove
            </Button>
          </td>
        </tr>
      )
    })
    let addUserButton
    if (isAdmin) {
      addUserButton = (
        <Col xs='5' className='text-right'>
          <Button
            color='primary'
            size='sm'
            onClick={this.toggleAddUserModalOpen}
          >
            <i className='fas fa-user-plus fa-fw mr-2'></i>
            Add User
          </Button>
        </Col>
      )
    }
    return (
      <div className='pb-5'>
        <Row className='align-items-center mb-5'>
          <Col xs='7'>
            <h1>
              <i className='fas fa-ship fa-fw mr-2'></i>
              {applicationName}
            </h1>
          </Col>
          {addUserButton}
        </Row>
        <AddUserModal
          isModalOpen={isAddUserModalOpen}
          toggle={this.toggleAddUserModalOpen}
          reload={this.reload}
        />
        {this.renderConfirmRemoveUserModal()}
        <h3>
          <i className='fas fa-unlock fa-fw mr-2'></i>
          Access Control List
        </h3>
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
    )
  }
  private renderConfirmRemoveUserModal(): JSX.Element {
    const { deleteAccessControl, match } = this.props
    const { isRemoveUserModalOpen, removeTarget } = this.state
    const cancel = this.toggleRemoveUserModalOpen.bind(this)
    const executeDeletion = () => {
      deleteAccessControl(match.params.applicationId, removeTarget)
      this.setState({ submitted: true })
      this.toggleRemoveUserModalOpen()
    }
    return (
      <Modal isOpen={isRemoveUserModalOpen} toggle={cancel} size='sm'>
        <ModalHeader toggle={cancel}>Remove User</ModalHeader>
        <ModalBody>
          Are you sure to remove {removeTarget}?
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
  private toggleAddUserModalOpen() {
    const { isAddUserModalOpen } = this.state
    this.setState({
      isAddUserModalOpen: !isAddUserModalOpen,
    })
  }
  private toggleRemoveUserModalOpen() {
    const { isRemoveUserModalOpen } = this.state
    this.setState({
      isRemoveUserModalOpen: !isRemoveUserModalOpen,
    })
  }
  private onClickRemoveButton(acl: AccessControlList) {
    return () => {
      this.setState({ removeTarget: acl.userUid })
      this.toggleRemoveUserModalOpen()
    }
  }
  private reload() {
    const { fetchAccessControlList, match } = this.props
    fetchAccessControlList(match.params.applicationId)
  }
}

export default withRouter(
  connect(
    (state: any): StateProps => {
      return {
        accessControlList: state.fetchAccessControlListReducer.accessControlList,
        application: state.fetchApplicationByIdReducer.applicationById,
        userInfoStatus: state.userInfoReducer.userInfo,
        deleteAccessControlStatus: state.deleteAccessControlReducer.deleteAccessControl
      }
    },
    (dispatch: Dispatch): DispatchProps => {
      return {
        addNotification: (params) => dispatch(addNotification(params)),
        fetchAccessControlList: (applicationId: string) => fetchAccessControlListDispatcher(dispatch, { applicationId }),
        fetchApplicationById: (id: string) => fetchApplicationByIdDispatcher(dispatch, { id }),
        deleteAccessControl: (applicationId: string, userUid: string) => deleteAccessControlDispatcher(dispatch, { applicationId, userUid })
      }
    }
  )(Admin)
)
