import * as React from 'react'
import { connect } from 'react-redux'
import { Formik, Form, ErrorMessage, Field } from 'formik'
import * as Yup from "yup";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap'

import { ProjectAccessControlList } from '@src/apis'
import { APIRequest, isAPIFailed, isAPISucceeded } from '@src/apis/Core'
import { projectRole } from "@components/Common/Enum";

interface EditUserProjectRoleModalState {
  submitting: boolean
}

const UserRoleSchema = Yup.object().shape({
  role: Yup.string()
    .oneOf([projectRole.admin.toString(), projectRole.member.toString()])
    .required('Required'),
});

class EditUserRoleModalImpl extends React.Component<EditUserRoleModalProps, EditUserProjectRoleModalState> {
  constructor(props: EditUserRoleModalProps) {
    super(props)
    this.onCancel = this.onCancel.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }
  componentDidUpdate(prevProps, prevState) {
    const { isModalOpen } = prevProps
    const { saveProjectAccessControlStatus, toggle, reload } = this.props
    const { submitting } = this.state

    if (isModalOpen && submitting) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveProjectAccessControlStatus)
      const failed: any = isAPIFailed<boolean>(saveProjectAccessControlStatus) && saveProjectAccessControlStatus.error
      if (succeeded) {
        this.props.addNotification({ color: 'success', message: 'Successfully updated user' })
        toggle()
        reload()
      }
      if (failed) {
        this.props.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
      }
    }
  }
  render() {
    const { isModalOpen, target } = this.props
    if (!target) {
      return null
    }
    return (
      <Modal isOpen={isModalOpen} toggle={this.onCancel}>
        <Formik
          initialValues={{
            role: target.role
          }}
          validationSchema={UserRoleSchema}
          onSubmit={this.onSubmit}>
          {({ errors, touched }) => (
            <Form>
              <ModalHeader toggle={this.onCancel}>
                <i className='fas fa-user-plus fa-fw mr-2'></i>
                Edit User {target.userUid}
              </ModalHeader>
              <ModalBody>
                {this.renderRoles(target)}
                {errors.role && touched.role ? (
                  <div>{errors.role}</div>
                ) : null}
                <ErrorMessage name="role" />
              </ModalBody>
              <ModalFooter>
                <Button color='success' type='submit' disabled={this.state.submitting} >
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
          )}
        </Formik>
      </Modal>
    )
  }
  private renderRoles(target) {
    if (!target) {
      return null
    }
    const roles = Object.values(projectRole).map((roleName: string) => {
      return (
        <option value={roleName} label={roleName}>
          {roleName}
        </option>
      )
    })
    return (
      <Field name="role" component="select" className='form-control' id='userRole'>
        {roles}
      </Field>
    )
  }
  private onCancel() {
    const { toggle } = this.props
    toggle()
  }
  private onSubmit(params) {
    const { saveProjectAccessControl, projectId, target } = this.props
    this.setState({ submitting: true })
    return saveProjectAccessControl({
      projectId,
      uid: target.userUid,
      role: params.role,
      method: 'patch'
    })
  }
}

interface CustomProps {
  projectId: number
  isModalOpen: boolean
  toggle: () => void
  reload: () => void
  target?: ProjectAccessControlList
  saveProjectAccessControl: (params) => void
  saveProjectAccessControlStatus: APIRequest<boolean>
  addNotification: (params) => void
}

type EditUserRoleModalProps = CustomProps

export const EditUserProjectRoleModal =
  connect(
    (state: any, extraProps: CustomProps) => ({
      ...extraProps,
      ...state.form
    })
  )(EditUserRoleModalImpl)
