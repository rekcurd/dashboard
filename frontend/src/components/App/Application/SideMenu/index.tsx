import * as React from 'react'
import { NavLink, withRouter, RouteComponentProps } from 'react-router-dom'
import { connect } from 'react-redux'
import { APIRequest, APIRequestStatusList } from '@src/apis/Core'
import { UserInfo, UserRole } from '@src/apis'

interface Props {
  applicationId: string
}

class SideMenu extends React.Component<SideMenuProps> {
  render() {
    const { userInfoStatus　} = this.props
    const { applicationId } = this.props.match.params
    const menuContents = [
      {
        title: 'Orchestration',
        items: [
          {
            text: 'Dashboard',
            path: 'dashboard',
            icon: 'ship'
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
        ]
      }
    ]
    if (userInfoStatus.status === APIRequestStatusList.success) {
      userInfoStatus.result.roles.forEach((e: UserRole) => {
        if (String(e.applicationId) === applicationId && e.role === 'admin') {
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

    const fullPath = (menuPath) => `/applications/${applicationId}/${menuPath}`

    const renderSubmenuItem = (subMenuItem) => {
      return (
        <li className='navbar-item mb-1' key={subMenuItem.path}>
          <NavLink exact className='nav-link text-info' to={fullPath(subMenuItem.path)}>
            <i className={`fas fa-${subMenuItem.icon} fa-fw mr-2`}></i>
            {subMenuItem.text}
          </NavLink>
        </li>
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
