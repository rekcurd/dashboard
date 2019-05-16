import * as React from 'react'
import { connect } from 'react-redux'
import { Card, CardBody, Button } from 'reactstrap'

import { Field, Form, Formik } from "formik";
import * as Yup from "yup";

import { FormikInput } from '@common/Field'


const KubernetesGitKeySchema = Yup.object().shape({
  gitIdRsa: Yup.string()
    .required('Required')
    .max(2048),
  config: Yup.string()
    .required('Required')
    .max(1024)
});

class KubernetesGitKeyForm extends React.Component<KubernetesGitKeyFormProps, KubernetesGitKeyFormCustomState> {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    const { onSubmit, onCancel, initialValues } = this.props

    return (
      <Formik
        initialValues={initialValues}
        validationSchema={KubernetesGitKeySchema}
        onSubmit={(values, {setSubmitting}) => {
          onSubmit(values).then(
            result => {
              setSubmitting(false)
            },
            errors => {
              setSubmitting(false)
            }
          )}
        }
        onReset={onCancel}>
        {({ isValid, isSubmitting, resetForm }) => (
          <Form>
            <div className='mb-2'>
              {this.renderDiscardButton(isValid, resetForm, initialValues)}
            </div>
            <Card className='mb-3'>
              <CardBody>
                <Field
                  name="gitIdRsa"
                  label="/root/.ssh/git_id_rsa"
                  component={FormikInput}
                  className="form-control"
                  type="textarea"
                  rows="6"
                  placeholder=""
                  required />
                <Field
                  name="config"
                  label="/root/.ssh/config"
                  component={FormikInput}
                  className="form-control"
                  type="textarea"
                  rows="6"
                  placeholder=""
                  required />
              </CardBody>
            </Card>
            {this.renderSubmitButtons(isValid, isSubmitting)}
          </Form>
        )}
      </Formik>
    )
  }

  renderDiscardButton = (isValid, resetForm, initialValues) => {
    const { canEdit, onCancel } = this.props

    if (!canEdit) {
      return null
    }
    if (isValid) {
      return (
        <Button outline color='danger' onClick={() => {onCancel(); resetForm(initialValues);}}>
          <i className={`fas fa-times fa-fw mr-2`}></i>
          Discard changes
        </Button>
      )
    } else {
      return null
    }
  }

  /**
   * Render submit button(s)
   *
   * Show delete button if selected targets exist
   * Show save button if editing deploy status
   */
  renderSubmitButtons(isValid, isSubmitting): JSX.Element {
    if (!isValid) {
      return null
    }

    // Submit button element(s)
    const buttons = (
      <div className='mb-2'>
        <Button
          color='success'
          className='mr-2'
          disabled={!isValid || isSubmitting}
          type='submit'
        >
          <i className={`fas fa-trash fa-fw mr-2`}></i>
          Save
        </Button>
      </div>
    )

    const submittingLoader = (
      <div>
        <div className='loader loader-primary loader-xs mr-2'/>
        Submitting...
      </div>
    )

    return isSubmitting ? submittingLoader : buttons
  }
}

const defaultInitialValues = {
  gitIdRsa:
    "-----BEGIN RSA PRIVATE KEY-----\n" +
    "YOUR-RSA-PRIVATE-KEY\n" +
    "-----END RSA PRIVATE KEY-----",
  config:
    "Host git.private.com\n" +
    "  User git\n" +
    "  Port 22\n" +
    "  HostName git.private.com\n" +
    "  IdentityFile /root/.ssh/git_id_rsa\n" +
    "  StrictHostKeyChecking no"
}

interface KubernetesGitKeyFormCustomProps {
  projectId: number
  applicationId: string
  canEdit: boolean
  initialValues?: {
    gitIdRsa: string
    config: string
  }
  onSubmit
  onCancel
}

interface KubernetesGitKeyFormCustomState {}

interface StateProps {}

const mapStateToProps = (state: any, extraProps: KubernetesGitKeyFormCustomProps) => {
  return {
    ...state.form,
    ...extraProps,
    initialValues: {
      ...defaultInitialValues,
      ...extraProps.initialValues
    }
  }
}

const mapDispatchToProps = (dispatch): {} => {
  return { }
}

type KubernetesGitKeyFormProps = StateProps & KubernetesGitKeyFormCustomProps

export default connect(mapStateToProps, mapDispatchToProps)(KubernetesGitKeyForm)
