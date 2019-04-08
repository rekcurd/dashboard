import * as React from 'react'
import { connect } from 'react-redux'

import { uploadModelDispatcher, addNotification } from '@src/actions/index'
import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core/index'
import { UploadModelParam } from '@src/apis'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap'

import * as Yup from "yup";
import { ErrorMessage, Field, Form, Formik } from "formik";


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
    this.setState({submitting: true})
    return uploadModel(request)
  }

  static getDerivedStateFromProps(nextProps: AddModelFileFormProps, prevState: AddModelFileFormState){
    const {
      uploadModelStatus, toggle, isModalOpen, reload
    } = nextProps

    if (isModalOpen && prevState.submitting) {
      const succeeded: boolean = isAPISucceeded<boolean>(uploadModelStatus) && uploadModelStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(uploadModelStatus) && !uploadModelStatus.result) || isAPIFailed<boolean>(uploadModelStatus)
      if (succeeded) {
        toggle()
        reload({color: 'success', message: 'Successfully added model'})
        return {submitting: false}
      } else if (failed) {
        nextProps.addNotification({color: 'error', message: 'Something went wrong with uploading model. Try again later'})
        return {submitting: false}
      }
    }
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
          onSubmit={this.onSubmit}>
          {({ errors, touched, setFieldValue, isSubmitting }) => (
            <Form>
              <ModalHeader toggle={this.onCancel}>
                <i className='fas fa-robot fa-fw mr-2'></i>
                Add Model
              </ModalHeader>
              <ModalBody>
                <Field name="description" component="textarea" placeholder="Description"/>
                {errors.description && touched.description ? (
                  <div>{errors.description}</div>
                ) : null}
                <ErrorMessage name="description" />
                <input name="filepath" type="file" onChange={(event) => {
                  setFieldValue("filepath", event.currentTarget.files[0]);
                }} />
                {errors.filepath && touched.filepath ? (
                  <div>{errors.filepath}</div>
                ) : null}
                <ErrorMessage name="filepath" />
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
        <Button outline color='info' onClick={this.onCancel}>
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
    ...state.form,
    ...extraProps
  }
}

export interface DispatchProps {
  uploadModel: (params: UploadModelParam) => Promise<void>
  addNotification: (params) => any
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
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
