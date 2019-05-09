import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps, Link } from 'react-router-dom'
import { Breadcrumb, BreadcrumbItem, Row, Col, Table, Button, Tooltip, Modal, ModalBody, ModalHeader } from 'reactstrap'

import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import { APIRequest, isAPIFailed, isAPISucceeded } from '@src/apis/Core'
import { Kubernetes, FetchKubernetesByIdParam, IdParam, UserInfo, Project } from '@src/apis'
import {
  fetchAllKubernetesDispatcher,
  deleteKubernetesDispatcher,
  addNotification,
 } from '@src/actions'

/**
 * Page for overview of Kubernetes hosts
 *
 * - List up existing Kubernetes hosts
 * - Move to a page for adding/editing hosts (`Host`)
 */
class Hosts extends React.Component<KubernetesProps, KubernetesState> {
  constructor(props, context) {
    super(props, context)
    this.state = {
      isDeleteModalOpen: false,
      tooltipOpen: {},
      deletionSubmitted: false,
      deletionNotified: false,
      deletionTarget: { id: null, displayName: null }
    }

    this.renderKubernetes = this.renderKubernetes.bind(this)
    this.changeDeletionTarget = this.changeDeletionTarget.bind(this)
    this.toggleTooltip = this.toggleTooltip.bind(this)
    this.toggleDeleteModal = this.toggleDeleteModal.bind(this)
  }

  componentDidMount() {
    this.props.fetchKubernetes({projectId: this.props.match.params.projectId})
  }

  static getDerivedStateFromProps(nextProps: KubernetesProps, prevState: KubernetesState){
    const { deleteKubernetesStatus } = nextProps
    const { deletionSubmitted, deletionNotified } = prevState

    if (deletionSubmitted && !deletionNotified) {
      const succeeded: boolean = isAPISucceeded<boolean>(deleteKubernetesStatus) && deleteKubernetesStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(deleteKubernetesStatus) && !deleteKubernetesStatus.result) || isAPIFailed<boolean>(deleteKubernetesStatus)

      if (succeeded) {
        nextProps.fetchKubernetes({projectId: nextProps.match.params.projectId})
        nextProps.addNotification({ color: 'success', message: 'Successfully deleted host' })
        return {deletionSubmitted: false, deletionNotified: true}
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        return {deletionSubmitted: false, deletionNotified: true}
      }
    }
    return null
  }

  toggleDeleteModal() {
    this.setState({
      isDeleteModalOpen: !this.state.isDeleteModalOpen
    })
  }

  changeDeletionTarget(id, name) {
    this.setState({
      deletionTarget: {
        id: id,
        displayName: name
      }
    })
  }

  deleteTarget(id) {
    this.toggleDeleteModal()
    this.changeDeletionTarget(null, null)
    this.props.deleteKubernetes({projectId: this.props.match.params.projectId, kubernetesId: id})
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

  render() {
    const { fetchProjectByIdStatus, fetchAllKubernetesStatus, userInfoStatus, settings } = this.props
    const targetStatus: any = { project: fetchProjectByIdStatus, hosts: fetchAllKubernetesStatus }

    if (isAPISucceeded(settings) && settings.result.auth) {
      targetStatus.userInfoStatus = userInfoStatus
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={targetStatus}
        render={this.renderKubernetes}
      />
    )
  }

  renderKubernetes(status, canEdit) {
    const project: Project = status.project
    const kubernetesHosts: Kubernetes[] = status.hosts
    const { deletionSubmitted } = this.state
    const submitted = deletionSubmitted
    const { push } = this.props.history
    const { projectId } = this.props.match.params

    const addButton = canEdit ? (
      <div>
        <Button color='primary' size='sm' onClick={() => { push(`/projects/${projectId}/kubernetes/add`) }} disabled={submitted}>
          <i className='fas fa-plus fa-fw mr-2'></i>
          Add New Kubernetes
        </Button>
      </div>
    ) : null

    const title = (
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h1>
          <i className='fas fa-ship fa-fw mr-3'></i>
          Kubernetes
        </h1>
        {addButton}
      </div>
    )

    return (
      <Row className='justify-content-center'>
        <Col xs='10' className='pt-5'>
          <Breadcrumb tag="nav" listTag="div">
            <BreadcrumbItem tag="a" href="/">Projects</BreadcrumbItem>
            <BreadcrumbItem active tag="span">{project.name}</BreadcrumbItem>
          </Breadcrumb>
          {title}
          {this.renderKubernetesHostListTable(kubernetesHosts, canEdit)}
        </Col>
      </Row>
    )
  }

  /**
   * Render table to show KubernetesCollections
   * each cell has link to move detailed application page
   *
   * @param hosts List of kubernetes
   */
  renderKubernetesHostListTable(hosts: Kubernetes[], canEdit) {
    const kubernetesHostListTableBody = (
      hosts.map(
        (value: Kubernetes) => (
          <tr key={value.kubernetesId}>
            <td>
              {canEdit ?
                <Link to={`/projects/${value.projectId}/kubernetes/${value.kubernetesId}`}
                      className='text-info'>
                  {value.displayName}
                </Link> : <span>{value.displayName}</span>}
            </td>
            <td>
              {value.description}
            </td>
            <td>
              {value.exposedHost}:{value.exposedPort}
            </td>
            <td>
              {value.registerDate.toUTCString()}
            </td>
            {canEdit ?
              <td>
                <i
                  className='fas fa-trash-alt fa-lg text-danger'
                  id={`k8shost-delete-${value.kubernetesId}`}
                  onClick={() => { this.changeDeletionTarget(value.kubernetesId, value.displayName); this.toggleDeleteModal() }}
                ></i>
                <Tooltip placement='top' isOpen={this.state.tooltipOpen[`delete-${value.kubernetesId}`]}
                target={`k8shost-delete-${value.kubernetesId}`} toggle={this.toggleTooltip(`delete-${value.kubernetesId}`)}>
                  Delete this host
                </Tooltip>
              </td>: null
            }
          </tr>
        )
      )
    )

    return (
      <Table hover id='application-list'>
        <thead>
          <tr className='bg-light text-primary'>
            <th>Name</th><th>Description</th><th>Exposed Host</th><th>Registered Date</th>
            {canEdit ? <th></th> : null}
          </tr>
        </thead>
        <tbody>
          {kubernetesHostListTableBody}
        </tbody>
        {this.renderConfirmDeleteHostModal(canEdit)}
      </Table>
    )
  }

  renderConfirmDeleteHostModal(canEdit) {
    if (!canEdit) {
      return null
    }

    const { isDeleteModalOpen, deletionTarget } = this.state
    const { id, displayName } = deletionTarget

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
          <Button color='danger' size='lg' className='rounded-0 flex-1' onClick={() => this.deleteTarget(id)}>
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

type KubernetesProps = StateProps & DispatchProps & RouteComponentProps<{projectId: number}>

interface KubernetesState {
  isDeleteModalOpen: boolean,
  tooltipOpen: {},
  deletionSubmitted: boolean,
  deletionNotified: boolean,
  deletionTarget: { id: string, displayName: string }
}

interface StateProps {
  fetchProjectByIdStatus: APIRequest<Project>
  fetchAllKubernetesStatus: APIRequest<Kubernetes[]>
  deleteKubernetesStatus: APIRequest<boolean>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state): StateProps => {
  return {
    fetchProjectByIdStatus: state.fetchProjectByIdReducer.fetchProjectById,
    fetchAllKubernetesStatus: state.fetchAllKubernetesReducer.fetchAllKubernetes,
    deleteKubernetesStatus: state.deleteKubernetesReducer.deleteKubernetes,
    userInfoStatus: state.userInfoReducer.userInfo,
    settings: state.settingsReducer.settings,
  }
}

interface DispatchProps {
  fetchKubernetes: (params: FetchKubernetesByIdParam) => Promise<void>
  deleteKubernetes: (params: IdParam) => Promise<void>
  addNotification
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchKubernetes: (params: FetchKubernetesByIdParam) => fetchAllKubernetesDispatcher(dispatch, params),
    deleteKubernetes: (params: IdParam) => deleteKubernetesDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number}>>(mapStateToProps, mapDispatchToProps)(Hosts))
