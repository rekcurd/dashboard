import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Breadcrumb, BreadcrumbItem, Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  UserInfo, ServiceRouting,
  FetchServiceRoutingParam, ServiceRoutingParam, Project, Application
} from '@src/apis'
import {
  addNotification,
  fetchServiceRoutingDispatcher,
  updateServiceRoutingDispatcher
} from '@src/actions'
import {APIRequestResultsRenderer} from "@common/APIRequestResultsRenderer";

import ServiceRoutingForm from "./ServiceRoutingForm"


type ServiceRoutingProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string, serviceLevel: string}>

interface ServiceRoutingState {
  serviceLevel: string
  submitted: boolean
  notified: boolean
}

class ServiceRoutingImpl extends React.Component<ServiceRoutingProps, ServiceRoutingState> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      serviceLevel: this.props.match.params.serviceLevel,
      submitted: false,
      notified: false
    }

    this.renderContent = this.renderContent.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)
  }

  componentDidMount(): void {
    this.props.fetchServiceRouting(this.props.match.params)
  }

  static getDerivedStateFromProps(nextProps: ServiceRoutingProps, nextState: ServiceRoutingState){
    const { updateServiceRoutingStatus, routings } = nextProps
    const { submitted, notified } = nextState

    if (submitted && !notified) {
      const succeeded: boolean = isAPISucceeded<boolean>(updateServiceRoutingStatus) && updateServiceRoutingStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(updateServiceRoutingStatus) && !updateServiceRoutingStatus.result) || isAPIFailed<boolean>(updateServiceRoutingStatus)
      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully saved host' })
        nextProps.fetchServiceRouting(nextProps.match.params)
        return { submitted: false, notified: true }
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: updateServiceRoutingStatus['error']['message'] })
        return { submitted: false, notified: true }
      }
    }
    if (nextState.serviceLevel != nextProps.match.params.serviceLevel) {
      nextProps.fetchServiceRouting(nextProps.match.params)
      return { serviceLevel: nextProps.match.params.serviceLevel, notified: false }
    }
    if (isAPIFailed(routings) && !notified) {
      nextProps.addNotification({ color: 'error', message: 'No service available. Please Deploy your service firstly.' })
      return { notified: true }
    }
    return null
  }

  render(): JSX.Element {
    const { project, application, routings, userInfoStatus, settings } = this.props
    const statuses: any = { project, application }
    if (isAPISucceeded(settings) && settings.result.auth) {
      statuses.userInfoStatus = userInfoStatus
    }
    if (isAPISucceeded(routings)) {
      statuses.routings = routings
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={statuses}
        render={this.renderContent}
      />
    )
  }

  renderContent(fetchedResults, canEdit) {
    const {projectId, applicationId, serviceLevel} = this.props.match.params
    const project: Project = fetchedResults.project
    const application = fetchedResults.application
    const routings = fetchedResults.routings

    if (routings) {
      return (
        <React.Fragment>
          <Breadcrumb tag="nav" listTag="div">
            <BreadcrumbItem tag="a" href="/">Projects</BreadcrumbItem>
            <BreadcrumbItem tag="a" href={`/projects/${project.projectId}`}>{project.name}</BreadcrumbItem>
            <BreadcrumbItem tag="a" href={`/projects/${project.projectId}/applications`}>Applications</BreadcrumbItem>
            <BreadcrumbItem tag="a" href={`/projects/${project.projectId}/applications/${application.applicationId}`}>{application.name}</BreadcrumbItem>
            <BreadcrumbItem active tag="span">Routing</BreadcrumbItem>
          </Breadcrumb>
          <Row className='align-items-center mb-5'>
            <Col xs='7'>
              <h1>
                <i className='fas fa-route fa-fw mr-2'></i>
                Routing
              </h1>
            </Col>
          </Row>
          <h3>
            Traffic Weight ({serviceLevel})
          </h3>
          <hr />
          <ServiceRoutingForm
            projectId={projectId}
            applicationId={applicationId}
            canEdit={canEdit}
            routings={routings}
            onSubmit={this.onSubmit}
            onCancel={this.onCancel} />
        </React.Fragment>
      )
    } else {
      return (<div>Nothing to show.</div>)
    }
  }

  onSubmit(params) {
    const serviceWeights = params.serviceWeights.map((serviceWeight) => {
      return {
        serviceId: serviceWeight.serviceId,
        serviceWeight: Number(serviceWeight.serviceWeight)
      }
    })
    const apiParams = {
      ...this.props.match.params,
      serviceWeights: serviceWeights
    }

    this.props.updateServiceRouting(apiParams)
    this.setState({ submitted: true, notified: false })
  }

  onCancel() {}
}

export interface StateProps {
  project: APIRequest<Project>
  application: APIRequest<Application>
  routings: APIRequest<ServiceRouting>
  updateServiceRoutingStatus: APIRequest<boolean>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state): StateProps => {
  const props = {
    project: state.fetchProjectByIdReducer.fetchProjectById,
    application: state.fetchApplicationByIdReducer.fetchApplicationById,
    routings: state.fetchServiceRoutingReducer.fetchServiceRouting,
    updateServiceRoutingStatus: state.updateServiceRoutingReducer.updateServiceRouting,
    userInfoStatus: state.userInfoReducer.userInfo,
    settings: state.settingsReducer.settings
  }
  return props
}

export interface DispatchProps {
  addNotification
  fetchServiceRouting: (params: FetchServiceRoutingParam) => Promise<void>
  updateServiceRouting: (params: ServiceRoutingParam) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    fetchServiceRouting: (params: FetchServiceRoutingParam) => fetchServiceRoutingDispatcher(dispatch, params),
    updateServiceRouting: (params: ServiceRoutingParam) => updateServiceRoutingDispatcher(dispatch, params),
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string, serviceLevel: string}>>(
    mapStateToProps, mapDispatchToProps
  )(ServiceRoutingImpl))
