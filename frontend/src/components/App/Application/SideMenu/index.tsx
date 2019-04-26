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

    const menuContents = [
      {
        title: 'Application',
        items: [
          {
            text: 'Dashboard',
            path: 'dashboard',
            icon: 'chart-line',
            items: []
          },
          {
            text: 'Services',
            path: 'services',
            icon: 'server',
            items: []
          },
          {
            text: 'Models',
            path: 'models',
            icon: 'database',
            items: []
          },
        ]
      }
    ]
    if (fetchProjectByIdStatus.status === APIRequestStatusList.success && fetchProjectByIdStatus.result.useKubernetes) {
      const serviceLevels = (parentPath: string) => {
        const contents = Object.values(serviceLevel).map((serviceLevelName: string) => {
          return {
            text: serviceLevelName,
            path: `${parentPath}/${serviceLevelName}`
          }
        })
        return contents
      }
      menuContents.push({
        title: 'Kubernetes',
        items: []
      })
      menuContents[1]['items'].push({
        text: 'Git Key',
        path: 'git_key',
        icon: 'key',
        items: serviceLevels('git_key')
      })
      menuContents[1]['items'].push({
        text: 'Routing',
        path: 'routing',
        icon: 'route',
        items: serviceLevels('routing')
      })
    }
    if (userInfoStatus.status === APIRequestStatusList.success) {
      menuContents.push({
        title: 'Access Control',
        items: [
          {
            text: 'Admin',
            path: 'admin',
            icon: 'user-lock',
            items: []
          }
        ]
      })
    }

    const fullPath = (menuPath) => `/projects/${projectId}/applications/${applicationId}/${menuPath}`

    const renderSubmenuItem = (subMenuItem) => {
      let children = null
      if (subMenuItem.items) {
        const child = subMenuItem.items.map((subsubMenuItem) => {
          return (
            <li key={subsubMenuItem.text}>
              <NavLink exact className='nav-link text-info' to={fullPath(subsubMenuItem.path)}>
                {subsubMenuItem.text}
              </NavLink>
            </li>
          )
        })
        children = (
          <li key={subMenuItem.path + '-subsubmenu'}>
            <ul style={{listStyleType: "none"}}>
              {child}
            </ul>
          </li>
        )
      }
      return (
        <React.Fragment key={subMenuItem.path}>
          <li className='navbar-item mb-1' key={subMenuItem.path}>
            <NavLink exact className='nav-link text-info' to={fullPath(subMenuItem.path)}>
              <i className={`fas fa-${subMenuItem.icon} fa-fw mr-2`}></i>
              {subMenuItem.text}
            </NavLink>
          </li>
          {children}
        </React.Fragment>
      )
    }

    const generatedMenu = menuContents.map(
      (subMenu) => (
        <li className='navbar-item' key={subMenu.title}>
          { /* SubMenu */ }
          <h4 className='navhead mb-2 pb-1 border-bottom border-secondary'>{subMenu.title}</h4>
          <ul className='nav flex-column mb-4'>
            { subMenu.items.map((subMenuItem) => renderSubmenuItem(subMenuItem)) }
          </ul>
        </li>
      )
    )

    return (
      <nav className='col-md-2 border-right border-secondary position-fixed pt-5' id='application-side-menu'>
        <div className='pl-3 pr-3'>
          { /* Whole Menu*/ }
          <ul className='nav flex-column navbar-light'>
            {generatedMenu}
          </ul>
        </div>
      </nav>
    )
  }
}

type SideMenuProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string}>

interface SideMenuState {}

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
