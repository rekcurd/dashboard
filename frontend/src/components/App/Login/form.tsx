import * as React from 'react'
import { connect } from 'react-redux'
import { Button, Card, CardBody } from 'reactstrap'
import { Formik, Form, Field } from 'formik'
import * as Yup from "yup";

import { FormikInput } from '@common/Field'


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
          {() => (
            <Form>
              <Card className='mb-3'>
                <CardBody>
                  <Field
                    name="username"
                    label="Username"
                    component={FormikInput}
                    className="form-control"
                    placeholder=""
                    required />
                  <Field
                    name="password"
                    label="Password"
                    component={FormikInput}
                    type="password"
                    className="form-control"
                    placeholder=""
                    required />
                </CardBody>
              </Card>
              <div className='text-right mb-3'>
                <Button color='success' type='submit'>
                  <i className='fas fa-check fa-fw mr-2'></i>
                  Login
                </Button>
              </div>
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
