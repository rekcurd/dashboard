import * as React from 'react'
import { NavLink, RouteComponentProps, withRouter } from 'react-router-dom'
import { connect } from 'react-redux'

import { Application, FetchApplicationByIdParam, Project, UserInfo } from '@src/apis'
import { fetchApplicationByIdDispatcher } from '@src/actions'
import { APIRequest, APIRequestStatusList } from '@src/apis/Core'
import { serviceLevel } from '@components/Common/Enum'


class SideMenu extends React.Component<SideMenuProps, SideMenuState> {
  constructor(props, context) {
    super(props, context)
    this.state = {
      gitKeyDropdownOpen: false,
      routingDropdownOpen: false
    }

    this.gitKeyToggle = this.gitKeyToggle.bind(this)
    this.routingToggle = this.routingToggle.bind(this)
  }

  componentDidMount() {
    this.props.fetchApplicationById(this.props.match.params)
  }

  componentDidUpdate(prevProps: Readonly<SideMenuProps>, prevState: Readonly<SideMenuState>, snapshot?: any): void {
    if (this.props.match.params.applicationId !== prevProps.match.params.applicationId) {
      this.props.fetchApplicationById(this.props.match.params)
    }
  }

  render() {
    const { fetchProjectByIdStatus, application, userInfoStatus } = this.props
    const { projectId, applicationId } = this.props.match.params

    const mainContents = {
      title: 'Application',
      items: [
        {
          text: 'Dashboard',
          path: 'dashboard',
          icon: 'chart-line',
        },
        {
          text: 'Services',
          path: 'services',
          icon: 'server',
        },
        {
          text: 'Models',
          path: 'models',
          icon: 'database',
        },
      ]
    }

    let kubernetesContents: React.ReactNode
    if (fetchProjectByIdStatus.status === APIRequestStatusList.success && fetchProjectByIdStatus.result.useKubernetes) {
      const serviceLevels = (parentPath: string) => {
        const contents = Object.values(serviceLevel).map((serviceLevelName: string) => {
          const path = `${parentPath}/${serviceLevelName}`
          return (
            <li className='navbar-item mb-1' key={path}>
              <NavLink exact className='nav-link text-info pt-1 pb-1' to={this.fullPath(path)}>
                <span className="fa-fw pl-4">{serviceLevelName}</span>
              </NavLink>
            </li>
          )
        })
        return contents
      }

      const gitKeyPath = 'git_key'
      const gitKeyDropdown = (
        <li className='navbar-item mb-1' key={gitKeyPath}>
          <span className='nav-link text-info' onClick={this.gitKeyToggle}>
            <i className="fas fa-key fa-fw mr-2"></i>
            Git Key
            <i className="fa fa-caret-down fa-fw ml-1"></i>
          </span>
        </li>
      )
      const gitKeyContents = serviceLevels(gitKeyPath)
      const routingPath = 'routing'
      const routingDropdown = (
        <li className='navbar-item mb-1' key={routingPath}>
          <span className='nav-link text-info' onClick={this.routingToggle}>
            <i className="fas fa-route fa-fw mr-2"></i>
            Routing
            <i className="fa fa-caret-down fa-fw ml-1"></i>
          </span>
        </li>
      )
      const routingContents = serviceLevels(routingPath)

      const title = 'Kubernetes'
      kubernetesContents = (
        <li className='navbar-item' key={title}>
          { /* SubMenu */ }
          <h4 className='navhead mb-2 pb-1 border-bottom border-secondary'>{title}</h4>
          <ul className='nav flex-column mb-4'>
            {gitKeyDropdown}
            {this.state.gitKeyDropdownOpen ? gitKeyContents : null}
            {routingDropdown}
            {this.state.routingDropdownOpen ? routingContents : null}
          </ul>
        </li>
      )
    }

    let adminContents = null
    if (userInfoStatus.status === APIRequestStatusList.success) {
      adminContents = {
        title: 'Access Control',
        items: [
          {
            text: 'Admin',
            path: 'admin',
            icon: 'user-lock',
          }
        ]
      }
    }

    const renderSubmenuItem = (subMenuItem) => {
      return (
        <li className='navbar-item mb-1' key={subMenuItem.path}>
          <NavLink exact className='nav-link text-info' to={this.fullPath(subMenuItem.path)}>
            <i className={`fas fa-${subMenuItem.icon} fa-fw mr-2`}></i>
            {subMenuItem.text}
          </NavLink>
        </li>
      )
    }

    const generatedMenu = (subMenu) => (
      <li className='navbar-item' key={subMenu.title}>
        { /* SubMenu */ }
        <h4 className='navhead mb-2 pb-1 border-bottom border-secondary'>{subMenu.title}</h4>
        <ul className='nav flex-column mb-4'>
          { subMenu.items.map((subMenuItem) => renderSubmenuItem(subMenuItem)) }
        </ul>
      </li>
    )

    return (
      <nav className='col-md-2 border-right border-secondary position-fixed pt-5' id='application-side-menu'>
        <div className='pl-3 pr-3'>
          { /* Whole Menu*/ }
          <ul className='nav flex-column navbar-light'>
            {generatedMenu(mainContents)}
            {kubernetesContents ? kubernetesContents : null}
            {adminContents ? generatedMenu(adminContents) : null}
          </ul>
        </div>
      </nav>
    )
  }

  gitKeyToggle() {
    this.setState({
      gitKeyDropdownOpen: !this.state.gitKeyDropdownOpen
    });
  }
  routingToggle() {
    this.setState({
      routingDropdownOpen: !this.state.routingDropdownOpen
    });
  }
  private fullPath(menuPath: string) {
    const {projectId, applicationId} = this.props.match.params
    return `/projects/${projectId}/applications/${applicationId}/${menuPath}`
  }
}

type SideMenuProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string}>

interface SideMenuState {
  gitKeyDropdownOpen
  routingDropdownOpen
}

interface StateProps {
  fetchProjectByIdStatus: APIRequest<Project>
  application: APIRequest<Application>
  userInfoStatus: APIRequest<UserInfo>
}

const mapStateToProps = (state): StateProps => {
  return {
    fetchProjectByIdStatus: state.fetchProjectByIdReducer.fetchProjectById,
    application: state.fetchApplicationByIdReducer.fetchApplicationById,
    userInfoStatus: state.userInfoReducer.userInfo
  }
}

export interface DispatchProps {
  fetchApplicationById: (params: FetchApplicationByIdParam) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchApplicationById: (params: FetchApplicationByIdParam) => fetchApplicationByIdDispatcher(dispatch, params)
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string}>>(
    mapStateToProps, mapDispatchToProps
  )(SideMenu))
