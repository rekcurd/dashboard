import * as React from 'react'
import { connect } from 'react-redux'
import { Button, Table, Row } from 'reactstrap'
import { Link } from 'react-router-dom'
import { Formik, Form } from 'formik'

import { EvaluationResult, FetchEvaluationResultByIdParam } from '@src/apis'
import { Checkbox } from '@common/Field'


class EvaluationResultsDeleteForm extends React.Component<EvaluationResultsDeleteFormProps, EvaluationResultsDeleteFormCustomState> {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    const { onSubmit, onCancel } = this.props
    const initialValues = {
      delete_evaluationResults: this.props.initialValues.delete.evaluationResults
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
        <th>ID + Modle Description</th>
        <th>Evaluation Data Description</th>
        <th>Registered Date</th>
      </tr>
      </thead>
    )
  }

  /**
   * Render body of the table
   *
   * Render EvaluationResult names
   * Each EvaluationResult is rendered with a deploy check box on viewing/deleting mode
   * @param evaluationResults EvaluationResults to be shown (Currently show all, but should be filtered)
   */
  renderTableBody = () => {
    const { projectId, applicationId, canEdit, evaluationResults } = this.props

    // Button to delete EvaluationResult (for deleting k8s evaluationResults)
    const deleteCheckButton = (modelDescription: string, evaluationResultId: number) => {
      return (
        <Row>
          { canEdit ?
            <Checkbox
              id={evaluationResultId.toString()}
              name='delete_evaluationResults'
              value={evaluationResultId.toString()}
              label='' />
            : null }
          {`${evaluationResultId}: ${modelDescription}`}
        </Row>
      )
    }

    return (
      <tbody>
      {evaluationResults.map(
        (evaluationResult: EvaluationResult, index: number) => (
          <tr key={index}>
            <td key={`${evaluationResult.evaluationResultId}-${evaluationResult.modelDescription}`} scope='col'>
              {deleteCheckButton(evaluationResult.modelDescription, evaluationResult.evaluationResultId)}
            </td>
            <td>
              {evaluationResult.evaluationDescription}
            </td>
            <td>
              {evaluationResult.registerDate.toUTCString()}
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
          Delete EvaluationResults
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

interface EvaluationResultsDeleteFormCustomProps {
  projectId
  applicationId
  evaluationResults: EvaluationResult[]
  canEdit: boolean
  onSubmit
  onCancel
}

interface EvaluationResultsDeleteFormCustomState {}

interface StateProps {
  initialValues: {
    delete
  }
}

const mapStateToProps = (state: any, extraProps: EvaluationResultsDeleteFormCustomProps) => {
  // Map of evaluationResult ID to delete flag
  return {
    ...state.form,
    initialValues: {
      delete: {
        evaluationResults: []
      }
    }
  }
}

const mapDispatchToProps = (dispatch): {} => {
  return { }
}

type EvaluationResultsDeleteFormProps = StateProps & EvaluationResultsDeleteFormCustomProps

export default connect(mapStateToProps, mapDispatchToProps)(EvaluationResultsDeleteForm)
