import * as React from 'react'
import { connect } from 'react-redux'
import { reduxForm, InjectedFormProps } from 'redux-form'
import { Card, CardBody, Form, Button } from 'reactstrap'

import { KubernetesHost, Model, Service } from '@src/apis'
import DeploymentSettingFormFields, { kubernetesDeploymentDefultSettings } from '@components/misc/Forms/DeploymentSettingFormFields'

class ServiceDeploymentFormImpl extends React.Component<ServiceDeploymentFormProps> {
  render() {
    const { handleSubmit, onSubmit } = this.props
    const serviceSpeicificForm = this.renderServiceSpecificForm()

    return (
      <React.Fragment>
        <Card className='mb-3'>
          <Form onSubmit={handleSubmit(onSubmit)}>
            {serviceSpeicificForm}
            {serviceSpeicificForm ? this.renderButtons() : null}
          </Form>
        </Card>
      </React.Fragment>
    )
  }

  /**
   *
   * Render form fields to setup service specific
   * options. The options depend on given `applicationType`
   * (simple or Kubernetes).
   *
   * @param applicationType Type of application to set up
   * @returns {JSX.Element} Config fields
   */
  renderServiceSpecificForm(): JSX.Element {
    const { applicationType, mode, models, kubernetesHost } = this.props

    return (
      <CardBody>
        <DeploymentSettingFormFields
          formNamePrefix={`${mode}.service`}
          kubernetesHosts={[kubernetesHost]}
          applicationType={applicationType}
          resource='service'
          mode={mode}
          models={models}
        />
      </CardBody>
    )
  }

  /**
   * Render control buttons
   *
   * Put on footer of this modal
   */
  renderButtons(): JSX.Element {
    const { submitting, reset, mode } = this.props

    if (submitting) {
      return (
        <CardBody>
          <div className='loader loader-primary loader-xs mr-2' />
          Submitting...
        </CardBody>
      )
    }

    return (
      <CardBody className='text-right'>
        <Button color='success' type='submit'>
          <i className='fas fa-check fa-fw mr-2'></i>
          {mode === 'add' ? 'Add Service' : 'Rolling-update Service'}
        </Button>
        {' '}
        <Button outline color='info' onClick={reset}>
          <i className='fas fa-ban fa-fw mr-2'></i>
          Reset
        </Button>
      </CardBody>
    )
  }
}

interface CustomProps {
  mode: string
  models: Model[]
  onCancel
  onSubmit
  applicationType: string
  kubernetesHost?: KubernetesHost
  service?: Service
}

interface StateProps {
  initialValues
}

type ServiceDeploymentFormProps =
  CustomProps
  & StateProps
  & InjectedFormProps<{}, CustomProps>

const generateInitialValues = (props: CustomProps) => (
  {
    [props.mode]: {
      service: {
        ...kubernetesDeploymentDefultSettings,
        ...props.service,
        kubernetesId: props.kubernetesHost.id,
        applicationType: 'kubernetes'
      }
    }
  }
)

export const ServiceDeploymentForm =
  connect(
    (state: any, extraProps: CustomProps) => ({
      ...extraProps,
      ...state.form,
      initialValues: generateInitialValues(extraProps)
    })
  )(reduxForm<{}, CustomProps>({
    form: 'serviceForm',
    touchOnChange: true,
    enableReinitialize: true
  })(ServiceDeploymentFormImpl))
