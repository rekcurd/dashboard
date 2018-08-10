import * as React from 'react'
import { connect } from 'react-redux'
import { reduxForm, InjectedFormProps } from 'redux-form'
import { Card, CardBody, Form, Button } from 'reactstrap'

import { KubernetesHost } from '@src/apis'
import DeploymentSettingFormFields, { kubernetesDeploymentDefultSettings } from '@components/misc/Forms/DeploymentSettingFormFields'

class ApplicationDeploymentFormImpl extends React.Component<AddApplicationFormProps> {
  /**
   * Render form bodies to add application
   * Switch depending on whether plain or Kubernetes app
   *
   */
  render() {
    const { selectedApplicationType, handleSubmit, onSubmit } = this.props
    const applicationSpeicificForm = this.renderApplicationSpecificForm(selectedApplicationType)

    return (
      <React.Fragment>
        <h1 className='mb-3'>
          <i className='fas fa-anchor fa-fw mr-2'></i>
          Add Application
        </h1>
        <Form onSubmit={handleSubmit(onSubmit)}>
          {applicationSpeicificForm}
          {applicationSpeicificForm ? this.renderButtons() : null}
        </Form>
      </React.Fragment>
    )
  }

  /**
   *
   * Render form fields to setup application specific
   * options. The options depend on given `applicationType`
   * (simple or Kubernetes).
   *
   * @param applicationType Type of application to set up
   */
  renderApplicationSpecificForm(applicationType) {
    return (
      <Card className='mb-3'>
        <CardBody>
          <DeploymentSettingFormFields
            formNamePrefix='add.application'
            kubernetesHosts={this.props.kubernetesHosts}
            resource='application'
            applicationType={applicationType}
            onChangeApplicationType={this.props.onChangeApplicationType}
            mode='add'
            models={[]}
          />
        </CardBody>
      </Card>
    )
  }

  /**
   * Render control buttons
   *
   * Put on footer of this modal
   */
  renderButtons() {
    const { submitting, reset, selectedApplicationType } = this.props

    if (!selectedApplicationType) {
      return null
    }

    if (submitting) {
      return (
        <Card className='mb-3'>
          <CardBody>
            <div className='loader loader-primary loader-xs mr-2' />
            Submitting...
          </CardBody>
        </Card>
      )
    }

    return (
      <Card className='mb-3'>
        <CardBody className='text-right'>
          <Button color='success' type='submit'>
            <i className='fas fa-check fa-fw mr-2'></i>
            Create Application
          </Button>
          {' '}
          <Button outline color='info' onClick={reset}>
            <i className='fas fa-ban fa-fw mr-2'></i>
            Reset
          </Button>
        </CardBody>
      </Card>
    )
  }
}

export interface FormCustomProps {
  onCancel
  onSubmit
  onChangeApplicationType
  selectedApplicationType: string
  kubernetesHosts?: KubernetesHost[]
}

type AddApplicationFormProps =
  FormCustomProps
  & InjectedFormProps<{}, FormCustomProps>

export const ApplicationDeloymentForm =
  connect(
    (state: any, extraProps: FormCustomProps) => ({
      initialValues: {
        add: {
          application: {
            ...kubernetesDeploymentDefultSettings,
            dbType: extraProps.selectedApplicationType === 'kubernetes' ? 'mysql' : null,
            applicationType: extraProps.selectedApplicationType
          }
        }
      },
      ...extraProps,
      ...state.form
    })
  )(reduxForm<{}, FormCustomProps>({
    form: 'applicationForm',
    touchOnChange: true,
    enableReinitialize: true
  })(ApplicationDeploymentFormImpl))
