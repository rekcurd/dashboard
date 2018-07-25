import * as React from 'react'
import { connect } from 'react-redux'
import { RouterProps } from 'react-router'
import { withRouter, RouteComponentProps, Link } from 'react-router-dom'
import { Row, Col, Table, Button, Tooltip, Modal, ModalBody, ModalHeader } from 'reactstrap'

import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import { APIRequest, isAPIFailed, isAPISucceeded } from '@src/apis/Core'
import { KubernetesHost } from '@src/apis'
import {
  fetchAllKubernetesHostsDispatcher,
  deleteKubernetesHostDispatcher,
  syncKubernetesStatusDispatcher,
  addNotification,
 } from '@src/actions'

/**
 * Page for overview of Kubernetes hosts
 *
 * - List up existing Kubernetes hosts
 * - Move to a page for adding/editing hosts (`Host`)
 */
class Hosts extends React.Component<StateProps & DispatchProps & RouterProps, any> {
  constructor(props, context) {
    super(props, context)
    this.state = {
      isDeleteModalOpen: false,
      tooltipOpen: {},
      deletionSubmitted: false,
      syncSubmitted: false,
      deletionNotified: false,
      syncNotified: false,
      deletionTargetHost: { id: null, displayName: null }
    }

    this.renderKubernetesHosts = this.renderKubernetesHosts.bind(this)
    this.changeDeletionTarget = this.changeDeletionTarget.bind(this)
    this.toggleTooltip = this.toggleTooltip.bind(this)
    this.toggleDeleteModal = this.toggleDeleteModal.bind(this)
  }

  toggleDeleteModal() {
    this.setState({
      isDeleteModalOpen: !this.state.isDeleteModalOpen
    })
  }

  changeDeletionTarget(id, name) {
    this.setState({
      deletionTargetHost: {
        id,
        displayName: name
      }
    })
  }

  deleteTargetHost(id) {
    this.toggleDeleteModal()
    this.changeDeletionTarget(null, null)
    this.props.deleteKubernetesHost({kubernetesId: id})
    this.setState({deletionSubmitted: true, deletionNotified: false})
  }

  toggleTooltip(kubernetesId) {
    return () => {
      const nextTooltipOpen = {
        ...this.state.tooltipOpen,
        [kubernetesId]: !this.state.tooltipOpen[kubernetesId]
      }

      this.setState({
        tooltipOpen: nextTooltipOpen
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    const {
      deleteKubernetesHostStatus,
      syncAllKubernetesStatusStatus
    } = nextProps

    this.checkAndNotifyAPIResult(
      deleteKubernetesHostStatus,
      'deletionSubmitted', 'deletionNotified',
      'Successfully deleted host'
    )

    this.checkAndNotifyAPIResult(
      syncAllKubernetesStatusStatus,
      'syncSubmitted', 'syncNotified',
      'Successfully synced all hosts'
    )
  }

  checkAndNotifyAPIResult(status, submitted: string, notified: string, notificationText) {
    const submittedFlag: boolean = this.state[submitted]
    const notifiedFlag: boolean = this.state[notified]
    const { push } = this.props.history

    if (submittedFlag && !notifiedFlag) {
      const succeeded: boolean = isAPISucceeded<boolean>(status) && status.result
      const failed: boolean = (isAPISucceeded<boolean>(status) && !status.result) ||
        isAPIFailed<boolean>(status)

      if (succeeded) {
        this.setState({[submitted]: false, [notified]: true})
        push('/settings/kubernetes/hosts')
        this.props.fetchKubernetesHosts()
        this.props.addNotification({ color: 'success', message: notificationText })
      } else if (failed) {
        this.setState({[submitted]: false, [notified]: true})
        this.props.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
      }
    }
  }

  componentWillMount() {
    this.props.fetchKubernetesHosts()
  }

  render() {
    return (
      <APIRequestResultsRenderer
        APIStatus={{ hosts: this.props.fetchAllKubernetesHostsStatus }}
        render={this.renderKubernetesHosts}
      />
    )
  }

  renderKubernetesHosts(status) {
    const kubernetesHosts: KubernetesHost[] = status.hosts
    const { deletionSubmitted, syncSubmitted } = this.state
    const submitted = deletionSubmitted || syncSubmitted
    const { push } = this.props.history
    const submitSync = () => {
      this.setState({syncSubmitted: true, syncNotified: false})
      this.props.syncAllKubernetesStatus({})
    }

    const title = (
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h1>
          <i className='fas fa-plug fa-fw mr-3'></i>
          Hosts
        </h1>
        <div>
          <Button color='primary' size='sm' onClick={() => { push('/settings/kubernetes/hosts/add') }} disabled={submitted}>
            <i className='fas fa-plus fa-fw mr-2'></i>
            Add Host
          </Button>
          {` `}
          <Button color='success' size='sm' onClick={submitSync} disabled={submitted}>
            <i className='fas fa-sync-alt fa-fw mr-2'></i>
            Sync All
          </Button>
        </div>
      </div>
    )

    return (
      <Row className='justify-content-center'>
        <Col xs='10' className='pt-5'>
          {title}
          {this.renderKubernetesHostListTable(kubernetesHosts)}
        </Col>
      </Row>
    )
  }

  /**
   * Render table to show KubernetesCollections
   * each cell has link to move detailed application page
   *
   * @param hosts List of applications
   */
  renderKubernetesHostListTable(hosts: KubernetesHost[]) {
    const { push } = this.props.history
    const kubernetesHostListTableBody = (
      hosts.map(
        (value: KubernetesHost) => (
          <tr key={value.id}>
            <td>
              <Link
                to={`/settings/kubernetes/hosts/${value.id}/edit`}
                className='text-info'
              >
                {value.displayName}
              </Link>
            </td>
            <td>
              {value.description}
            </td>
            <td>
              {value.dnsName}
            </td>
            <td>
              {value.registeredDate.toUTCString()}
            </td>
            <td>
              <i
                className='fas fa-trash-alt fa-lg text-danger'
                id={`k8shost-delete-${value.id}`}
                onClick={() => { this.changeDeletionTarget(value.id, value.displayName); this.toggleDeleteModal() }}
              ></i>
              <Tooltip placement='top' isOpen={this.state.tooltipOpen[`delete-${value.id}`]}
                target={`k8shost-delete-${value.id}`} toggle={this.toggleTooltip(`delete-${value.id}`)}>
                Delete host
              </Tooltip>
            </td>
          </tr>
        )
      )
    )

    return (
      <Table hover id='application-list'>
        <thead>
          <tr className='bg-light text-primary'>
            <th>Name</th><th>Description</th><th>DNS</th><th>Date</th><th></th>
          </tr>
        </thead>
        <tbody>
          {kubernetesHostListTableBody}
        </tbody>
        {this.renderConfirmDeleteHostModal()}
      </Table>
    )
  }

  renderConfirmDeleteHostModal() {
    const { isDeleteModalOpen, deletionTargetHost } = this.state
    const { id, displayName } = deletionTargetHost

    const cancel = () => {
      this.toggleDeleteModal()
      this.changeDeletionTarget(null, null)
    }

    return (
      <Modal isOpen={isDeleteModalOpen} toggle={cancel} size='sm'>
        <ModalHeader toggle={cancel}>Delete Kubernetes Host</ModalHeader>
        <ModalBody>
          Are you sure to delete {displayName} ?
        </ModalBody>
        <div className='d-flex flex-row mt-3'>
          <Button color='danger' size='lg' className='rounded-0 flex-1' onClick={() => this.deleteTargetHost(id)}>
            <i className='fas fa-exclamation-circle mr-3' />
            Delete
          </Button>
          {' '}
          <Button outline color='info' size='lg' className='rounded-0 flex-1' onClick={cancel}>
            <i className='fas fa-ban mr-3' />
            Cancel
          </Button>
        </div>
      </Modal>
    )
  }

}

interface StateProps {
  fetchAllKubernetesHostsStatus: APIRequest<KubernetesHost[]>
  deleteKubernetesHostStatus: APIRequest<boolean>
  syncAllKubernetesStatusStatus: APIRequest<boolean>
}

const mapStateToProps = (state): StateProps => {
  return {
    fetchAllKubernetesHostsStatus: state.fetchAllKubernetesHostsReducer.kubernetesHosts,
    deleteKubernetesHostStatus: state.deleteKubernetesHostReducer.deleteKubernetesHost,
    syncAllKubernetesStatusStatus: state.syncKubernetesStatusReducer.syncKubernetesStatus
  }
}

interface DispatchProps {
  fetchKubernetesHosts: () => Promise<void>
  deleteKubernetesHost: (params) => Promise<void>
  syncAllKubernetesStatus: (params) => Promise<void>
  addNotification
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchKubernetesHosts: () => fetchAllKubernetesHostsDispatcher(dispatch),
    deleteKubernetesHost: (params) => deleteKubernetesHostDispatcher(dispatch, params),
    syncAllKubernetesStatus: () => syncKubernetesStatusDispatcher(dispatch, {}),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(connect<StateProps, DispatchProps, RouteComponentProps<{}>>(mapStateToProps, mapDispatchToProps)(Hosts))
