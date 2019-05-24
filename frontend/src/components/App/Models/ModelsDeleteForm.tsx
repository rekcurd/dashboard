import * as React from 'react'
import { connect } from 'react-redux'
import { Button, Table, Row } from 'reactstrap'
import { Link } from 'react-router-dom'
import { Formik, Form } from 'formik'

import { Model } from '@src/apis'
import { Checkbox } from '@common/Field'


class ModelsDeleteForm extends React.Component<ModelsDeleteFormProps, ModelsDeleteFormCustomState> {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    const { onSubmit, onCancel } = this.props
    const initialValues = {
      delete_models: this.props.initialValues.delete.models
    }

    return (
      <Formik
        initialValues={initialValues}
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
            <Table hover className='mb-3'>
              {this.renderTableHead()}
              {this.renderTableBody()}
            </Table>
            <hr />
            {this.renderSubmitButtons(isValid, isSubmitting)}
          </Form>
        )}
      </Formik>
    )
  }

  /**
   * Render head row of the table
   */
  renderTableHead = () => {
    return (
      <thead>
      <tr className='bg-light text-primary'>
        <th>ID + Description</th>
        <th>Registered Date</th>
      </tr>
      </thead>
    )
  }

  /**
   * Render body of the table
   *
   * Render Model names
   * Each Model is rendered with a deploy check box on viewing/deleting mode
   * @param models Models to be shown (Currently show all, but should be filtered)
   */
  renderTableBody = () => {
    const { projectId, applicationId, canEdit, models } = this.props

    // Button to delete Model (for deleting k8s models)
    const deleteCheckButton = (modelName: string, modelId: number) => {
      return (
        <Row>
          { canEdit ?
            <Checkbox
              id={modelId.toString()}
              name='delete_models'
              value={modelId.toString()}
              label='' />
            : null }
          <Link className='text-info' to={`/projects/${projectId}/applications/${applicationId}/models/${modelId}/edit`}>
            {`${modelId}: ${modelName}`}
          </Link>
        </Row>
      )
    }

    return (
      <tbody>
      {models.map(
        (model: Model, index: number) => (
          <tr key={index}>
            <td key={model.description} scope='col'>
              {deleteCheckButton(model.description, model.modelId)}
            </td>
            <td>
              {model.registerDate.toUTCString()}
            </td>
          </tr>
        )
      )}
      </tbody>
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
          color='danger'
          className='mr-2'
          disabled={!isValid || isSubmitting}
          type='submit'
        >
          <i className={`fas fa-trash fa-fw mr-2`}></i>
          Delete Models
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

interface ModelsDeleteFormCustomProps {
  projectId
  applicationId
  models: Model[]
  canEdit: boolean
  onSubmit
  onCancel
}

interface ModelsDeleteFormCustomState {}

interface StateProps {
  initialValues: {
    delete
  }
}

const mapStateToProps = (state: any, extraProps: ModelsDeleteFormCustomProps) => {
  // Map of model ID to delete flag
  return {
    initialValues: {
      delete: {
        models: []
      }
    }
  }
}

const mapDispatchToProps = (dispatch): {} => {
  return { }
}

type ModelsDeleteFormProps = StateProps & ModelsDeleteFormCustomProps

export default connect(mapStateToProps, mapDispatchToProps)(ModelsDeleteForm)
