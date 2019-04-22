import * as React from 'react'
import { NavLink, withRouter, RouteComponentProps } from 'react-router-dom'
import { connect } from 'react-redux'

import { Project, UserInfo } from '@src/apis'
import { APIRequest, APIRequestStatusList } from '@src/apis/Core'
import { serviceLevel } from '@components/Common/Enum'

interface Props {
  projectId: number
  applicationId: string
}

class SideMenu extends React.Component<SideMenuProps> {
  render() {
    const { fetchProjectByIdStatus, userInfoStatus, projectId, applicationId　} = this.props

    const menuContents = [
      {
        title: 'Orchestration',
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
      const serviceLevels = Object.values(serviceLevel).map((serviceLevelName: string) => {
        return {
          text: serviceLevelName,
          path: `routing/${serviceLevelName}`
        }
      })
      menuContents[0]['items'].push({
        text: 'Routing',
        path: 'routing',
        icon: 'route',
        items: serviceLevels
      })
    }
    if (userInfoStatus.status === APIRequestStatusList.success) {
      menuContents.push({
        title: 'Application',
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

interface StateProps {
  fetchProjectByIdStatus: APIRequest<Project>
  userInfoStatus: APIRequest<UserInfo>
}

type SideMenuProps = StateProps & Props & RouteComponentProps<any>

export default withRouter(connect(
  (state: any): StateProps => {
    return {
      fetchProjectByIdStatus: state.fetchProjectByIdReducer.fetchProjectById,
      userInfoStatus: state.userInfoReducer.userInfo
    }
  }
)(SideMenu))
