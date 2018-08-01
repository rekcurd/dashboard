import * as React from 'react'
import { connect } from 'react-redux'
import { reduxForm, InjectedFormProps } from 'redux-form'
import { Button, Card, CardBody, Form } from 'reactstrap'
import LoginFormFields from './fields'

class LoginFormImpl extends React.Component<LoginFormProps> {
  render() {
    const { handleSubmit, onSubmit } = this.props
    const loginForm = this.renderLoginForm()
    return (
      <React.Fragment>
        <h1 className='mb-3'>
          <i className='fas fa-sign-in-alt fa-fw mr-2'></i>
          Login
        </h1>
        <Form onSubmit={handleSubmit(onSubmit)}>
          {loginForm}
        </Form>
      </React.Fragment>
    )
  }

  renderLoginForm() {
    return (
      <Card className='mb-3'>
        <CardBody>
          <LoginFormFields
            formNamePrefix='login'
          />
        </CardBody>
        <CardBody className='text-right'>
          <Button color='success' type='submit'>
            <i className='fas fa-check fa-fw mr-2'></i>
            Login
          </Button>
        </CardBody>
      </Card>
    )
  }
}

interface LoginFormCustomProps {
  onSubmit
}

type LoginFormProps = LoginFormCustomProps & InjectedFormProps<{}, LoginFormCustomProps>

export const LoginForm =
  connect(
    (state: any, extraProps: any) => ({
    })
  )(reduxForm<{}, LoginFormCustomProps>({
    form: 'loginForm',
  })(LoginFormImpl))
