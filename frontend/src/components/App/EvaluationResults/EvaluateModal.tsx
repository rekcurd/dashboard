import * as React from 'react'
import { connect } from 'react-redux'

import {
  fetchAllEvaluationResultsDispatcher,
  evaluateDispatcher,
  addNotification
} from '@src/actions/index'
import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core/index'
import { FetchEvaluationResultByIdParam, EvaluateParam, Model, Evaluation } from '@src/apis'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap'

import * as Yup from "yup";
import { Field, Form, Formik } from "formik";
import { CustomInput } from 'reactstrap'
import { FormikInput } from '@common/Field'


const EvaluateSchema = Yup.object().shape({
  model_id: Yup.number()
    .required('Required'),
  evaluation_id: Yup.number()
    .required('Required'),
  overwrite: Yup.boolean(),
});

class EvaluateFormImpl extends React.Component<EvaluateFormProps, EvaluateFormState> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      submitting: false,
      overwrite: false
    }

    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)
  }

  onSubmit(params) {
    const { projectId, applicationId, evaluate } = this.props
    const request = {
      projectId,
      applicationId,
      ...params
    }
    evaluate(request)
    this.setState({submitting: true})
  }

  static getDerivedStateFromProps(nextProps: EvaluateFormProps, prevState: EvaluateFormState){
    const {
      evaluateStatus, toggle, isModalOpen, reload
    } = nextProps

    if (isModalOpen && prevState.submitting) {
      const succeeded: boolean = isAPISucceeded<boolean>(evaluateStatus) && evaluateStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(evaluateStatus) && !evaluateStatus.result) || isAPIFailed<boolean>(evaluateStatus)
      if (succeeded) {
        toggle()
        reload({color: 'success', message: 'Successfully evaluated model'})
        nextProps.fetchAllEvaluationResults({projectId: nextProps.projectId, applicationId: nextProps.applicationId})
        return {submitting: false}
      } else if (failed) {
        nextProps.addNotification({color: 'error', message: evaluateStatus['error']['message']})
        return {submitting: false}
      }
    }
    return null
  }

  onCancel(event) {
    if (!this.state.submitting) {
      this.props.toggle()
    }
  }

  render() {
    const {
      isModalOpen
    } = this.props
    const models = this.props.models.map( (model: Model) => {
      return {
        value: model.modelId,
        label: `ID ${model.modelId}: ${model.description}`
      }
    })
    const evaluations = this.props.evaluations.map( (evaluation: Evaluation) => {
      return {
        value: evaluation.evaluationId,
        label: `ID ${evaluation.evaluationId}: ${evaluation.description}`
      }
    })

    return (
      <Modal isOpen={isModalOpen} toggle={this.onCancel}>
        <Formik
          initialValues={{
            description: '',
            filepath: null
          }}
          validationSchema={EvaluateSchema}
          onSubmit={this.onSubmit}
          onReset={this.onCancel}>
          {({ errors, touched, setFieldValue }) => (
            <Form>
              <ModalHeader toggle={this.onCancel}>
                <i className='fas fa-robot fa-fw mr-2'></i>
                Evaluate model
              </ModalHeader>
              <ModalBody>
                <Field
                  name="model_id"
                  label="Model"
                  component={FormikInput}
                  type="select"
                  className='form-control'
                  placeholder="Model to be evaluated"
                  options={models}
                  onChange={()=>{}}
                  required />
                <Field
                  name="evaluation_id"
                  label="Evaluation Data"
                  component={FormikInput}
                  type="select"
                  className='form-control'
                  placeholder="Evaluation Data"
                  options={evaluations}
                  onChange={()=>{}}
                  required />
                <Field name="overwrite">
                  {({ field, form }) => (
                    <CustomInput
                      type='checkbox'
                      checked={this.state.overwrite}
                      id="overwrite_evaluation_result"
                      label='Check to overwrite existing results'
                      onChange={() => {
                        const nextState = !this.state.overwrite
                        form.setFieldValue("overwrite", nextState)
                        this.setState({overwrite: nextState})
                      }}
                    />
                  )}
                </Field>
              </ModalBody>
              {this.renderFooterButtons(this.state.submitting)}
            </Form>
          )}
        </Formik>
      </Modal>
    )
  }

  /**
   * Render control buttons
   *
   * Put on footer of this modal
   */
  renderFooterButtons(isSubmitting) {
    if (isSubmitting) {
      return(
        <ModalFooter>
          <div className='loader loader-primary loader-xs mr-2'/>
          Submitting...
        </ModalFooter>
      )
    }

    return (
      <ModalFooter>
        <Button color='success' type='submit'>
          <i className='fas fa-check fa-fw mr-2'></i>
          Submit
        </Button>
        {' '}
        <Button outline color='info' type='reset'>
          <i className='fas fa-ban fa-fw mr-2'></i>
          Cancel
        </Button>
      </ModalFooter>
    )
  }
}

interface CustomProps {
  projectId: number
  applicationId: string
  isModalOpen: boolean
  models: Model[]
  evaluations: Evaluation[]
  toggle
  reload
}

interface StateProps {
  evaluateStatus: APIRequest<boolean>
}

const mapStateToProps = (state: any, extraProps: CustomProps) => {
  return {
    evaluateStatus: state.evaluateReducer.evaluate,
    ...extraProps
  }
}

export interface DispatchProps {
  fetchAllEvaluationResults: (params: FetchEvaluationResultByIdParam) => Promise<void>
  evaluate: (params: EvaluateParam) => Promise<void>
  addNotification: (params) => any
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchAllEvaluationResults: (params: FetchEvaluationResultByIdParam) => fetchAllEvaluationResultsDispatcher(dispatch, params),
    evaluate: (params: EvaluateParam) => evaluateDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

type EvaluateFormProps = StateProps & DispatchProps & CustomProps

interface EvaluateFormState {
  submitting: boolean
  overwrite: boolean
}

export const EvaluateModal = connect<StateProps, DispatchProps, CustomProps>(
  mapStateToProps, mapDispatchToProps
)(EvaluateFormImpl)
