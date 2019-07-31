import * as React from 'react'
import { connect } from 'react-redux'
import { Button, Table, Row } from 'reactstrap'
import { Link } from 'react-router-dom'
import { Formik, Form } from 'formik'

import { Evaluation, FetchEvaluationByIdParam } from '@src/apis'
import { Checkbox } from '@common/Field'


class EvaluationsDeleteForm extends React.Component<EvaluationsDeleteFormProps, EvaluationsDeleteFormCustomState> {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    const { onSubmit, onCancel } = this.props
    const initialValues = {
      delete_evaluations: this.props.initialValues.delete.evaluations
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
        <th>Download</th>
      </tr>
      </thead>
    )
  }

  /**
   * Render body of the table
   *
   * Render Evaluation names
   * Each Evaluation is rendered with a deploy check box on viewing/deleting mode
   * @param evaluations Evaluations to be shown (Currently show all, but should be filtered)
   */
  renderTableBody = () => {
    const { projectId, applicationId, canEdit, evaluations } = this.props

    // Button to delete Evaluation (for deleting k8s evaluations)
    const deleteCheckButton = (evaluationName: string, evaluationId: number) => {
      return (
        <Row>
          { canEdit ?
            <Checkbox
              id={evaluationId.toString()}
              name='delete_evaluations'
              value={evaluationId.toString()}
              label='' />
            : null }
          {`${evaluationId}: ${evaluationName}`}
        </Row>
      )
    }

    return (
      <tbody>
      {evaluations.map(
        (evaluation: Evaluation, index: number) => (
          <tr key={index}>
            <td key={evaluation.description} scope='col'>
              {deleteCheckButton(evaluation.description, evaluation.evaluationId)}
            </td>
            <td>
              {evaluation.registerDate.toUTCString()}
            </td>
            <td>
              <Button color='outline-primary' size='sm'
                href={`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${projectId}/applications/${applicationId}/evaluations/${evaluation.evaluationId}/download`}>
                <i className={`fas fa-file-download`}></i>
              </Button>
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
          Delete Evaluations
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

interface EvaluationsDeleteFormCustomProps {
  projectId
  applicationId
  evaluations: Evaluation[]
  canEdit: boolean
  onSubmit
  onCancel
}

interface EvaluationsDeleteFormCustomState {}

interface StateProps {
  initialValues: {
    delete
  }
}

const mapStateToProps = (state: any, extraProps: EvaluationsDeleteFormCustomProps) => {
  // Map of evaluation ID to delete flag
  return {
    ...state.form,
    initialValues: {
      delete: {
        evaluations: []
      }
    }
  }
}

const mapDispatchToProps = (dispatch): {} => {
  return { }
}

type EvaluationsDeleteFormProps = StateProps & EvaluationsDeleteFormCustomProps

export default connect(mapStateToProps, mapDispatchToProps)(EvaluationsDeleteForm)
