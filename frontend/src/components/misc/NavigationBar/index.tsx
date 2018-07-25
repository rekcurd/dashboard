import * as React from 'react'
import { withRouter, NavLink } from 'react-router-dom'
import {
  Collapse,
  Navbar, NavbarBrand, Nav, NavItem
} from 'reactstrap'

class NavigationBar extends React.Component<any> {
  render() {
    return (
      <Navbar className='flex-md-nowrap sticky-top' id='top-navigation-bar' tag='header'>
        <NavbarBrand className='px-3 text-info' href='/' id='navbrand'>Drucker manager</NavbarBrand>
        <Collapse isOpen={true} className='ml-5' navbar>
          <Nav>
            <NavItem>
              <NavLink className='text-info nav-link' to='/applications/'>
                <i className='fas fa-anchor fa-fw mr-1'></i>
                Applications
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink className='text-info nav-link' to='/settings/kubernetes'>
                <i className='fas fa-cog fa-fw mr-1'></i>
                Kubernetes
              </NavLink>
            </NavItem>
          </Nav>
        </Collapse>
      </Navbar>
    )
  }
}

export default withRouter(NavigationBar)
