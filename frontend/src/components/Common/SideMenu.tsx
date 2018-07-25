import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { Nav, NavItem } from 'reactstrap'

export interface SideMenuParam {
  title: JSX.Element | string,
  id: string,
  contents: Array<
    {
      title: JSX.Element | string,
      items: Array<{text: string, path: string, icon: string}>
    }
  >
}

export class SideMenu extends React.Component<{params: SideMenuParam}> {
  render() {
    const { title, id, contents } = this.props.params

    const renderSubmenuItem = (subMenuItem) => (
      <NavItem className='mb-1' key={subMenuItem.path}>
        <NavLink className='nav-link text-info' to={subMenuItem.path}>
          <i className={`fas fa-${subMenuItem.icon} fa-fw mr-2`}></i>
          {subMenuItem.text}
        </NavLink>
      </NavItem>
    )

    const generatedMenu = contents.map(
      (subMenu) => (
        <NavItem key={subMenu.title}>
          { /* SubMenu title */ }
          <h4 className='navhead mb-2 pb-1 border-bottom border-secondary'>{subMenu.title}</h4>
          { /* SubMenu contents */ }
          <Nav className='mb-4'>
            { subMenu.items.map((subMenuItem) => renderSubmenuItem(subMenuItem)) }
          </Nav>
        </NavItem>
      )
    )
    /*
    <Col md='2'>
    */
    return (
      <nav id={id}>
        <div className='pt-4 pl-3 pr-3'>
          { /* Menu title */ }
          <h3 className='mb-4'>{title}</h3>
          { /* Whole menu*/ }
          <Nav vertical color='light'>
            {generatedMenu}
          </Nav>
        </div>
      </nav>
    )
  }
}
