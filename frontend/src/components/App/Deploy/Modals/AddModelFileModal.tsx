import * as React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, InjectedFormProps  } from 'redux-form'

import { uploadModelDispatcher, addNotification } from '@src/actions'
import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { SingleFormField } from '@common/Field/SingleFormField'
import { FileUploadInputField } from '@common/Field/FileUploadInputField'
import { required } from '@common/Field/Validateors'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap'

class AddModelFileFormImpl extends React.Component<AddModelFileFormProps, {fileName: string}> {
  constructor(props, context) {
    super(props, context)

    this.onChange = this.onChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)
    this.state = {
      fileName: null
    }
  }

  onSubmit(params) {
    const { applicationId, uploadModel } = this.props
    const request = {
      applicationId,
      ...params.upload.model
    }
    return uploadModel(request)
  }

  componentWillReceiveProps(nextProps) {
    const {
      uploadModelFileStatus, toggle, isModalOpen,
      submitting, reset, reload
    } = nextProps

    // Close modal when API successfully connected
    // Close modal when API successfully connected
    if (isModalOpen && submitting) {
      const succeeded: boolean = isAPISucceeded<boolean>(uploadModelFileStatus) && uploadModelFileStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(uploadModelFileStatus) && !uploadModelFileStatus.result) ||
                                isAPIFailed<boolean>(uploadModelFileStatus)
      if (succeeded) {
        reset()
        toggle()
        reload({color: 'success', message: 'Successfully added model'})
      } else if (failed) {
        nextProps.addNotification({color: 'error', message: 'Something went wrong. Try again later'})
      }
    }
  }

  onCancel(event) {
    const { reset, submitting, toggle } = this.props
    if (!submitting) {
      this.setState({fileName: null})
      reset()
      toggle()
    }
  }

  onChange(event) {
    if (event.target.files[0]) {
      this.setState({fileName: event.target.files[0].name})
    }
  }

  render() {
    const {
      handleSubmit, isModalOpen
    } = this.props

    return (
      <Modal isOpen={isModalOpen} toggle={this.onCancel}>
        <form onSubmit={handleSubmit(this.onSubmit)}>
          <ModalHeader toggle={this.onCancel}>
            <i className='fas fa-robot fa-fw mr-2'></i>
            Add Model
          </ModalHeader>
          {this.renderBodyForm()}
          {this.renderFooterButtons()}
        </form>
      </Modal>
    )
  }

  renderBodyForm() {
    const { fileName } = this.state
    const uploadForm = (
      <Field
        label='Model File'
        formText='Choose ML model file'
        name='upload.model.file'
        component={FileUploadInputField}
        id='uploadModelFile'
        onChange={this.onChange}
        fileName={fileName}
        validate={required}
        required
      />
    )

    const descriptionForm = (
      <Field
        label='Description'
        name='upload.model.description'
        component={SingleFormField} type='text'
        className='form-control' id='modelDescription'
        formText='Short description of your new model'
      />
    )

    return (
      <ModalBody>
        {uploadForm}
        {descriptionForm}
      </ModalBody>
    )
  }

  /**
   * Render control buttons
   *
   * Put on footer of this modal
   */
  renderFooterButtons() {
    const { submitting } = this.props

    if (submitting) {
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

interface AddModelFileFormCustomProps {
  isModalOpen: boolean
  toggle
  applicationId: string
  reload
}

interface StateProps {
  uploadModelFileStatus: APIRequest<boolean>
}

const mapStateToProps = (state: any, extraProps: AddModelFileFormCustomProps) => {
  return {
    uploadModelFileStatus: state.uploadModelReducer.uploadModel,
    ...state.form,
    ...extraProps
  }
}

export interface DispatchProps {
  uploadModel: (params) => Promise<void>
  addNotification: (params) => any
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    uploadModel: (params) => uploadModelDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

type AddModelFileFormProps
  = StateProps & DispatchProps & AddModelFileFormCustomProps & InjectedFormProps<{}, AddModelFileFormCustomProps>

export const AddModelFileModal = connect(mapStateToProps, mapDispatchToProps)(
  reduxForm<any, AddModelFileFormCustomProps>(
  {
    form: 'uploadModelFileForm',
    touchOnChange: true
  }
  )(AddModelFileFormImpl)
)
