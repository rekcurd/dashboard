import * as React from 'react'
import { connect } from 'react-redux'

import {
  fetchAllEvaluationsDispatcher,
  uploadEvaluationDispatcher,
  addNotification
} from '@src/actions/index'
import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core/index'
import { FetchEvaluationByIdParam, UploadEvaluationParam } from '@src/apis'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap'

import * as Yup from "yup";
import { Field, Form, Formik } from "formik";

import { FileUpload, FormikInput } from '@common/Field'


const AddEvaluationFileSchema = Yup.object().shape({
  description: Yup.string()
    .required('Required'),
  filepath: Yup.mixed()
    .required('Required')
});

class AddEvaluationFileFormImpl extends React.Component<AddEvaluationFileFormProps, AddEvaluationFileFormState> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      submitting: false
    }

    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)
  }

  onSubmit(params) {
    const { projectId, applicationId, uploadEvaluation } = this.props
    const request = {
      projectId,
      applicationId,
      ...params
    }
    this.setState({submitting: true})
    return uploadEvaluation(request)
  }

  static getDerivedStateFromProps(nextProps: AddEvaluationFileFormProps, prevState: AddEvaluationFileFormState){
    const {
      uploadEvaluationStatus, toggle, isModalOpen, reload
    } = nextProps

    if (isModalOpen && prevState.submitting) {
      const succeeded: boolean = isAPISucceeded<boolean>(uploadEvaluationStatus) && uploadEvaluationStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(uploadEvaluationStatus) && !uploadEvaluationStatus.result) || isAPIFailed<boolean>(uploadEvaluationStatus)
      if (succeeded) {
        toggle()
        reload({color: 'success', message: 'Successfully added evaluation'})
        nextProps.fetchAllEvaluations({projectId: nextProps.projectId, applicationId: nextProps.applicationId})
        return {submitting: false}
      } else if (failed) {
        nextProps.addNotification({color: 'error', message: uploadEvaluationStatus['error']['message']})
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

    return (
      <Modal isOpen={isModalOpen} toggle={this.onCancel}>
        <Formik
          initialValues={{
            description: '',
            filepath: null
          }}
          validationSchema={AddEvaluationFileSchema}
          onSubmit={this.onSubmit}
          onReset={this.onCancel}>
          {({ errors, touched, setFieldValue }) => (
            <Form>
              <ModalHeader toggle={this.onCancel}>
                <i className='fas fa-robot fa-fw mr-2'></i>
                Add Evaluation
              </ModalHeader>
              <ModalBody>
                <Field
                  name="description"
                  label="Description"
                  component={FormikInput}
                  className="form-control"
                  type="textarea"
                  placeholder="e.g. mnist"
                  required />
                <FileUpload
                  errors={errors}
                  touched={touched}
                  setFieldValue={setFieldValue}
                  name="filepath"
                  label="Evaluation File"
                  className="form-control"
                  placeholder="Upload your file to be evaluated."
                  required />
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
  toggle
  reload
}

interface StateProps {
  uploadEvaluationStatus: APIRequest<boolean>
}

const mapStateToProps = (state: any, extraProps: CustomProps) => {
  return {
    uploadEvaluationStatus: state.uploadEvaluationReducer.uploadEvaluation,
    ...state.form,
    ...extraProps
  }
}

export interface DispatchProps {
  fetchAllEvaluations: (params: FetchEvaluationByIdParam) => Promise<void>
  uploadEvaluation: (params: UploadEvaluationParam) => Promise<void>
  addNotification: (params) => any
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchAllEvaluations: (params: FetchEvaluationByIdParam) => fetchAllEvaluationsDispatcher(dispatch, params),
    uploadEvaluation: (params: UploadEvaluationParam) => uploadEvaluationDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

type AddEvaluationFileFormProps = StateProps & DispatchProps & CustomProps

interface AddEvaluationFileFormState {
  submitting: boolean
}

export const AddEvaluationFileModal = connect<StateProps, DispatchProps, CustomProps>(
  mapStateToProps, mapDispatchToProps
)(AddEvaluationFileFormImpl)
