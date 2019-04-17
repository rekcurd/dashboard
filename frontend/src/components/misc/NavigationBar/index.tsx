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
import { userInfoDispatcher } from '@src/actions'
import { APIRequestResultsRenderer } from '@components/Common/APIRequestResultsRenderer'
import { UserInfo } from '@src/apis'
import { JWT_TOKEN_KEY, APIRequest } from '@src/apis/Core'

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
    const { projectId } = this.props.match.params

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

    let projectMenu: React.ReactNode
    if (projectId) {
      const applicationslink = `/projects/${projectId}/applications`
      const adminlink = `/projects/${projectId}/admin`
      const kubelink = `/projects/${projectId}/kubernetes`
      const dataserverlink = `/projects/${projectId}/data_servers`
      projectMenu = (
        <React.Fragment>
          <NavItem>
            <NavLink className='text-info nav-link' exact to={applicationslink}>
              <i className='fas fa-plug fa-fw mr-1'></i>
              Applications
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink className='text-info nav-link' to={adminlink}>
              <i className='fas fa-users-cog fa-fw mr-1'></i>
              Admin
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink className='text-info nav-link' to={kubelink}>
              <i className='fas fa-ship fa-fw mr-1'></i>
              Kubernetes
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink className='text-info nav-link' to={dataserverlink}>
              <i className='fas fa-archive fa-fw mr-1'></i>
              Data Servers
            </NavLink>
          </NavItem>
        </React.Fragment>
      )
    }

    return (
      <Navbar className='flex-md-nowrap sticky-top' id='top-navigation-bar' tag='header'>
        <NavbarBrand className='px-3 text-info' href='/' id='navbrand'>Rekcurd Dashboard</NavbarBrand>
        <Collapse isOpen={true} className='ml-5' navbar>
          <Nav>
            {projectMenu}
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
    const userInfo: UserInfo = result.userInfo
    const userName: string = userInfo.user.userName
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
  userInfoStatus: APIRequest<UserInfo>,
  settings,
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

type NavigationBarProps =
  RouteComponentProps<{ projectId?: number }> & StateProps & DispatchProps & Props

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{ projectId?: number }>>(
    mapStateToProps, mapDispatchToProps
  )(NavigationBar)
)
