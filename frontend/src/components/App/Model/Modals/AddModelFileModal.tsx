import * as React from 'react'
import { connect } from 'react-redux'

import {
  fetchAllModelsDispatcher,
  uploadModelDispatcher,
  addNotification
} from '@src/actions/index'
import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core/index'
import { FetchModelByIdParam, UploadModelParam } from '@src/apis'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap'

import * as Yup from "yup";
import { Field, Form, Formik } from "formik";

import { FileUpload, FormikInput } from '@common/Field'


const AddModelFileSchema = Yup.object().shape({
  description: Yup.string()
    .required('Required'),
  filepath: Yup.mixed()
    .required('Required')
});

class AddModelFileFormImpl extends React.Component<AddModelFileFormProps, AddModelFileFormState> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      submitting: false
    }

    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)
  }

  onSubmit(params) {
    const { projectId, applicationId, uploadModel } = this.props
    const request = {
      projectId,
      applicationId,
      ...params
    }
    uploadModel(request)
    this.setState({submitting: true})
  }

  static getDerivedStateFromProps(nextProps: AddModelFileFormProps, nextState: AddModelFileFormState){
    const {
      uploadModelStatus, toggle, isModalOpen, reload
    } = nextProps

    if (isModalOpen && nextState.submitting) {
      const succeeded: boolean = isAPISucceeded<boolean>(uploadModelStatus) && uploadModelStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(uploadModelStatus) && !uploadModelStatus.result) || isAPIFailed<boolean>(uploadModelStatus)
      if (succeeded) {
        toggle()
        reload({color: 'success', message: 'Successfully added model'})
        nextProps.fetchAllModels({projectId: nextProps.projectId, applicationId: nextProps.applicationId})
        return {submitting: false}
      } else if (failed) {
        nextProps.addNotification({color: 'error', message: 'Something went wrong with uploading model. Try again later'})
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
          validationSchema={AddModelFileSchema}
          onSubmit={this.onSubmit}
          onReset={this.onCancel}>
          {({ errors, touched, setFieldValue, isSubmitting }) => (
            <Form>
              <ModalHeader toggle={this.onCancel}>
                <i className='fas fa-robot fa-fw mr-2'></i>
                Add Model
              </ModalHeader>
              <ModalBody>
                <Field
                  name="description"
                  label="Description"
                  component={FormikInput}
                  className="form-control"
                  type="textarea"
                  placeholder="e.g. sklearn linearSVC C=0.01"
                  required />
                <FileUpload
                  errors={errors}
                  touched={touched}
                  setFieldValue={setFieldValue}
                  name="filepath"
                  label="Model File"
                  className="form-control"
                  placeholder="Upload your machine learning model file."
                  required />
              </ModalBody>
              {this.renderFooterButtons(isSubmitting)}
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
  uploadModelStatus: APIRequest<boolean>
}

const mapStateToProps = (state: any, extraProps: CustomProps) => {
  return {
    uploadModelStatus: state.uploadModelReducer.uploadModel,
    ...extraProps
  }
}

export interface DispatchProps {
  fetchAllModels: (params: FetchModelByIdParam) => Promise<void>
  uploadModel: (params: UploadModelParam) => Promise<void>
  addNotification: (params) => any
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchAllModels: (params: FetchModelByIdParam) => fetchAllModelsDispatcher(dispatch, params),
    uploadModel: (params: UploadModelParam) => uploadModelDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

type AddModelFileFormProps = StateProps & DispatchProps & CustomProps

interface AddModelFileFormState {
  submitting: boolean
}

export const AddModelFileModal = connect<StateProps, DispatchProps, CustomProps>(
  mapStateToProps, mapDispatchToProps
)(AddModelFileFormImpl)
