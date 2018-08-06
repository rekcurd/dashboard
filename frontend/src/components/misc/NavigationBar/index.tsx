import * as React from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { withRouter, NavLink } from 'react-router-dom'
import {
  Collapse,
  Navbar, NavbarBrand, Nav, NavItem,
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap'
import { settingsDispatcher, userInfoDispatcher } from '@src/actions'
import { APIRequestResultsRenderer } from '@components/Common/APIRequestResultsRenderer'
import { JWT_TOKEN_KEY } from '@src/apis/Core'

interface Istate {
  dropdownOpen: boolean
}

interface Props {
  auth: boolean
}

class NavigationBar extends React.Component<NavigationBarProps, Istate> {
  constructor(props: NavigationBarProps) {
    super(props)
    this.state = {
      dropdownOpen: false
    }
  }
  componentDidMount() {
    const { fetchUserInfo, auth } = this.props
    if (auth) {
      fetchUserInfo()
    }
  }
  render() {
    const { userInfoStatus, auth } = this.props
    let user: React.ReactNode
    if (auth) {
      user = (
        <APIRequestResultsRenderer
          APIStatus={{ userInfo: userInfoStatus }}
          render={this.renderUserInfo.bind(this)}
          renderFailed={() => null}
        />
      )
    }
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
        {user}
      </Navbar>
    )
  }
  toggle() {
    this.setState((prevState) => {
      return {
        dropdownOpen: !prevState.dropdownOpen
      }
    })
  }
  renderUserInfo(result) {
    const { dropdownOpen } = this.state
    const userName: string = result.userInfo.user
    return (
      <Dropdown isOpen={dropdownOpen} toggle={this.toggle.bind(this)}>
        <DropdownToggle className='btn btn-sm btn-outline-secondary' caret>
          {userName}
        </DropdownToggle>
        <DropdownMenu className='dropdown-menu dropdown-menu-right'>
          <DropdownItem className='dropdown-item' onClick={this.onLogout.bind(this)}>
            Log out
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    )
  }
  onLogout(ev: Event) {
    ev.preventDefault()
    const { fetchUserInfo, history } = this.props
    window.localStorage.removeItem(JWT_TOKEN_KEY)
    history.push('/login')
    fetchUserInfo()
  }
}

interface StateProps {
  userInfoStatus
  settings
}

const mapStateToProps = (state): StateProps => {
  return {
    userInfoStatus: state.userInfoReducer.userInfo,
    settings: state.settingsReducer.settings
  }
}

interface DispatchProps {
  fetchUserInfo: () => Promise<void>
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => {
  return {
    fetchUserInfo: () => userInfoDispatcher(dispatch),
  }
}

type NavigationBarProps = RouteComponentProps<{}> & StateProps & DispatchProps & Props

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{}>>(
    mapStateToProps, mapDispatchToProps
  )(NavigationBar)
)
