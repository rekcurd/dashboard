import * as React from 'react'
import {reduxForm, InjectedFormProps} from 'redux-form'
import { connect } from 'react-redux'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form } from 'reactstrap'
import { AccessControlList } from '@src/apis'
import { EditUserRoleFields } from './EditUserRoleFields'
import { APIRequest, isAPIFailed, isAPISucceeded } from "@src/apis/Core";


class EditUserRoleModalImpl extends React.Component<EditUserRoleModalProps> {
  constructor(props) {
    super(props)
    this.onCancel = this.onCancel.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }
  componentWillReceiveProps(nextProps) {
    const { isModalOpen } = this.props
    const { saveAccessControlStatus, reset, toggle, reload, submitting } = nextProps
    if (isModalOpen && submitting) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveAccessControlStatus)
      const failed: boolean = isAPIFailed<boolean>(saveAccessControlStatus)
      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully updated user' })
        reset()
        toggle()
        reload()
      }
      if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
      }
    }
  }
  render() {
    const { isModalOpen, handleSubmit, target, submitting } = this.props
    if (!target) {
      return null
    }
    return (
      <Modal isOpen={isModalOpen} toggle={this.onCancel}>
        <Form onSubmit={handleSubmit(this.onSubmit)}>
          <ModalHeader toggle={this.onCancel}>
            <i className='fas fa-user-plus fa-fw mr-2'></i>
            Edit User {target.userUid}
          </ModalHeader>
          <ModalBody>
            <EditUserRoleFields
              target={this.props.target}
            />
          </ModalBody>
          <ModalFooter>
            <Button color='success' type='submit' disabled={submitting} >
              <i className='fas fa-check fa-fw mr-2'></i>
              Submit
            </Button>
            {' '}
            <Button outline color='info' onClick={this.onCancel}>
              <i className='fas fa-ban fa-fw mr-2'></i>
              Cancel
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    )
  }
  private onCancel() {
    const { toggle } = this.props
    toggle()
  }
  private onSubmit(params) {
    const { saveAccessControl, applicationId, target } = this.props
    this.setState({ submitting: true })
    return saveAccessControl({
      applicationId,
      ...params.edit.user,
      uid: target.userUid,
      mode: 'edit'
    })
  }
}

interface CustomProps {
  applicationId: string
  isModalOpen: boolean
  toggle: () => void
  reload: () => void
  target?: AccessControlList
  saveAccessControl: (params) => void
  saveAccessControlStatus: APIRequest<boolean>
  addNotification: (params) => void
}

interface StateProps {
  initialValues
}

type EditUserRoleModalProps =
  CustomProps
  & StateProps
  & InjectedFormProps<{}, CustomProps>

const generateInitialValues = (props: CustomProps) => (
  {
    edit: {
      user: {
        ...props.target
      }
    }
  }
)

export const EditUserRoleModal =
  connect(
    (state: any, extraProps: CustomProps) => ({
      ...extraProps,
      ...state.form,
      initialValues: generateInitialValues(extraProps)
    })
  )(reduxForm<{}, CustomProps>({
    form: 'EditUserRoleForm',
    touchOnChange: true,
    enableReinitialize: true
  })(EditUserRoleModalImpl))
