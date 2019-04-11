import * as React from 'react'
import { NavLink, withRouter, RouteComponentProps } from 'react-router-dom'
import { connect } from 'react-redux'

import { UserInfo, UserApplicationRole } from '@src/apis'
import { APIRequest, APIRequestStatusList } from '@src/apis/Core'
import { applicationRole, serviceLevel } from '@components/Common/Enum'

interface Props {
  projectId: number
  applicationId: string
}

class SideMenu extends React.Component<SideMenuProps> {
  render() {
    const { userInfoStatus, projectId, applicationId　} = this.props
    const serviceLevels = Object.values(serviceLevel).map((serviceName: string) => {
      return {
        text: serviceName,
        path: `routing/${serviceName}`
      }
    })
    const menuContents = [
      {
        title: 'Orchestration',
        items: [
          {
            text: 'Dashboard',
            path: 'dashboard',
            icon: 'chart-line'
          },
          {
            text: 'Services',
            path: 'services',
            icon: 'server'
          },
          {
            text: 'Models',
            path: 'models',
            icon: 'database'
          },
          {
            text: 'Routing',
            path: 'routing',
            icon: 'route',
            items: serviceLevels
          },
        ]
      }
    ]
    if (userInfoStatus.status === APIRequestStatusList.success) {
      userInfoStatus.result.applicationRoles.forEach((e: UserApplicationRole) => {
        if (String(e.applicationId) === applicationId && e.role === applicationRole.admin) {
          menuContents.push({
            title: '',
            items: [
              {
                text: 'Admin',
                path: 'admin',
                icon: 'user-lock'
              }
            ]
          })
        }
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
  userInfoStatus: APIRequest<UserInfo>,
}

type SideMenuProps = StateProps & Props & RouteComponentProps<any>

export default withRouter(connect(
  (state: any): StateProps => {
    return {
      userInfoStatus: state.userInfoReducer.userInfo
    }
  }
)(SideMenu))
