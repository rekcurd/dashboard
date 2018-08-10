import * as React from 'react'
import { NavLink } from 'react-router-dom'

class SideMenu extends React.Component<any> {
  render() {
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
      },
    ]

    const { applicationId　} = this.props
    const fullPath = (menuPath) => `/applications/${applicationId}/${menuPath}`

    const renderSubmenuItem = (subMenuItem) => (
      <li className='navbar-item mb-1' key={subMenuItem.path}>
        <NavLink exact className='nav-link text-info' to={fullPath(subMenuItem.path)}>
          <i className={`fas fa-${subMenuItem.icon} fa-fw mr-2`}></i>
          {subMenuItem.text}
        </NavLink>
      </li>
    )

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

export default SideMenu
