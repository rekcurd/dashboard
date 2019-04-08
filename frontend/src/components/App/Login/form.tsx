import * as React from 'react'
import { connect } from 'react-redux'
import { Button, Card, CardBody } from 'reactstrap'
import { Formik, Form, ErrorMessage, Field } from 'formik'
import * as Yup from "yup";


const LoginSchema = Yup.object().shape({
  username: Yup.string()
    .required('Required')
    .max(512),
  password: Yup.string()
    .required('Required'),
});

class LoginFormImpl extends React.Component<LoginFormProps> {
  render() {
    const { onSubmit } = this.props
    return (
      <React.Fragment>
        <h1 className='mb-3'>
          <i className='fas fa-sign-in-alt fa-fw mr-2'></i>
          Login
        </h1>
        <Formik
          initialValues={{
            username: '',
            password: '',
          }}
          validationSchema={LoginSchema}
          onSubmit={onSubmit}>
          {({ errors, touched }) => (
            <Form>
              <Card className='mb-3'>
                <CardBody>
                  <Field name="username" placeholder="User name"/>
                  {errors.username && touched.username ? (
                    <div>{errors.username}</div>
                  ) : null}
                  <ErrorMessage name="username" />
                  <Field name="password" placeholder="Password"/>
                  {errors.password && touched.password ? (
                    <div>{errors.password}</div>
                  ) : null}
                  <ErrorMessage name="password" />
                </CardBody>
              </Card>
              <Card className='mb-3'>
                <CardBody className='text-right'>
                  <Button color='success' type='submit'>
                    <i className='fas fa-check fa-fw mr-2'></i>
                    Login
                  </Button>
                </CardBody>
              </Card>
            </Form>
          )}
        </Formik>
      </React.Fragment>
    )
  }
}

interface LoginFormCustomProps {
  onSubmit
}

type LoginFormProps = LoginFormCustomProps

export const LoginForm =
  connect(
    (state: any, extraProps: any) => ({
    })
  )(LoginFormImpl)
