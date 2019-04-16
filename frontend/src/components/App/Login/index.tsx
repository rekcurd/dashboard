import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouterProps } from 'react-router'
import { Row, Col } from 'reactstrap'

import { loginDispatcher, userInfoDispatcher, addNotification } from '@src/actions'

import { LoginForm } from './form'
import { isAPISucceeded, APIRequest, APIStatusSuccess, JWT_TOKEN_KEY, isAPIFailed, isAPIUnauthorized } from '@src/apis/Core'
import { AuthToken, LoginParam } from '@src/apis'

class Login extends React.Component<LoginProps, LoginState> {
  constructor(props, context) {
      super(props, context)
      this.onSubmit = this.onSubmit.bind(this)
      this.state = {
        submitting: false
      }
  }

  onSubmit(parameters) {
    const { submitLogin } = this.props
    this.setState({ submitting: true })
    return submitLogin({ ...parameters })
  }

  componentWillReceiveProps(nextProps: LoginProps) {
    const { loginStatus, history, fetchUserInfo } = nextProps
    const { submitting } = this.state
    if (submitting) {
      const succeeded: boolean = isAPISucceeded<AuthToken>(loginStatus)
      const failed: boolean = isAPIFailed<AuthToken>(loginStatus) || isAPIUnauthorized<AuthToken>(loginStatus)
      if (succeeded) {
        const { result } = loginStatus as APIStatusSuccess<AuthToken>
        nextProps.addNotification({
          color: 'success',
          message: 'Successfully logged in'
        })
        window.localStorage.setItem(JWT_TOKEN_KEY, result.jwt)
        history.push('/')
        fetchUserInfo()
      }
      if (failed) {
        nextProps.addNotification({
          color: 'error',
          message: 'Login failed'
        })
      }
    }
  }

  render() {
    return (
      <Row className='justify-content-center'>
        <Col md='10' className='pt-5'>
          <LoginForm
            onSubmit={this.onSubmit}
          />
        </Col>
      </Row>
    )
  }
}

interface StateProps {
  loginStatus: APIRequest<AuthToken>
}

type LoginProps = StateProps & DispatchProps & RouterProps

interface LoginState {
  submitting: boolean
}

const mapStateToProps = (state) => {
    return {
    loginStatus: state.loginReducer.login
  }
}

interface DispatchProps {
  fetchUserInfo: () => Promise<void>
  submitLogin: (params: LoginParam) => Promise<void>
  addNotification: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchUserInfo: () => userInfoDispatcher(dispatch),
    submitLogin: (params: LoginParam) => loginDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, any>(
    mapStateToProps, mapDispatchToProps
  )(Login)
)
