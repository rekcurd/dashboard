import * as React from 'react'
import { connect } from 'react-redux'
import { reduxForm, InjectedFormProps, Field } from 'redux-form'
import { Card, CardBody, Form, Button } from 'reactstrap'

import { Model } from '@src/apis'
import { SingleFormField } from '@common/Field/SingleFormField'

class ModelDescriptionFormImpl extends React.Component<ModelDescriptionFormProps> {
  render() {
    const { handleSubmit, onSubmit } = this.props
    const modelSpeicificForm = this.renderModelSpecificForm()

    return (
      <React.Fragment>
        <Card className='mb-3'>
          <Form onSubmit={handleSubmit(onSubmit)}>
            {modelSpeicificForm}
            {this.renderButtons()}
          </Form>
        </Card>
      </React.Fragment>
    )
  }

  /**
   *
   *
   * @param applicationType Type of application to set up
   * @returns {JSX.Element} Config fields
   */
  renderModelSpecificForm(): JSX.Element {

    return (
      <CardBody>
        <Field
          name='edit.model.description'
          label='Description'
          component={SingleFormField} type='textarea'
          className='form-control' id='description'
          formText='Description shown in the table'
          required
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
    const { submitting, reset } = this.props

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
            Update Model Description
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
  onCancel
  onSubmit
  model?: Model
}

interface StateProps {
  initialValues
}

type ModelDescriptionFormProps =
  CustomProps
  & StateProps
  & InjectedFormProps<{}, CustomProps>

const generateInitialValues = (props: CustomProps) => (
  {
    edit: {
      model: {
        ...props.model,
      }
    }
  }
)

/**
 * Description form
 * Shown only when description
 */
export const ModelDescriptionForm =
  connect(
    (state: any, extraProps: CustomProps) => ({
      initialValues: generateInitialValues(extraProps),
      ...extraProps,
      ...state.form
    })
  )(reduxForm<{}, CustomProps>({
    form: 'modelDescriptionForm',
    touchOnChange: true,
    enableReinitialize: true
  })(ModelDescriptionFormImpl))
