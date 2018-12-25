import * as React from 'react'
import { connect } from 'react-redux'
import { Button } from 'reactstrap'
import { reduxForm, InjectedFormProps } from 'redux-form'

import { APIRequest } from '@src/apis/Core'
import { Service } from '@src/apis'
import DeployStatusTable from './DeployStatusTable'
import { ControlMode } from './index'

class DeployStatusForm extends React.Component<DeployStatusFormProps, {}> {
  constructor(props, context) {
    super(props, context)

    this.handleDiscardChanges = this.handleDiscardChanges.bind(this)
  }

  componentWillReceiveProps(nextProps: DeployStatusFormProps) {
    const { mode, pristine, changeMode } = nextProps

    if (mode === ControlMode.VIEW_DEPLOY_STATUS && !pristine) {
      changeMode(ControlMode.SELECT_TARGETS)
    } else if (mode === ControlMode.SELECT_TARGETS && pristine) {
      changeMode(ControlMode.VIEW_DEPLOY_STATUS)
    }
  }

  render() {
    const {
      onSubmit,
      handleSubmit,
    } = this.props

    return (
      <form onSubmit={handleSubmit(onSubmit)} >
        <div className='mb-2'>
          {this.renderSwitchModelsButton()}
        </div>
        <DeployStatusTable
          {...this.props}
        />
        <hr />
        {this.renderSubmitButtons()}
      </form>
    )
  }

  renderSwitchModelsButton = () => {
    const { mode, changeMode, canEdit } = this.props

    if (!canEdit) {
      return null
    }
    switch (mode) {
      case ControlMode.EDIT_DEPLOY_STATUS:
      case ControlMode.SELECT_TARGETS:
        return (
          <Button outline color='danger' onClick={this.handleDiscardChanges}>
            <i className={`fas fa-times fa-fw mr-2`}></i>
            Discard changes
          </Button>
        )
      default:
        return (
          <div>
            <Button color='success'
              onClick={(event) => {changeMode(ControlMode.EDIT_DEPLOY_STATUS)}}
            >
              <i className={`fas fa-screwdriver fa-fw mr-2`}></i>
              Switch models
            </Button>
          </div>
        )
    }
  }

  /**
   * Render submit button(s)
   *
   * Show delete button if selected targets exist
   * Show save button if editing deploy status
   */
  renderSubmitButtons(): JSX.Element {
    const {
      mode,
      submitting,
      pristine
    } = this.props

    const showSubmitButton: boolean = mode !== ControlMode.VIEW_DEPLOY_STATUS

    if (!showSubmitButton) {
      return null
    }

    const paramsMap = {
      [ControlMode.SELECT_TARGETS]: { color: 'danger', icon: 'trash', text: 'Delete Services/Models' },
      [ControlMode.EDIT_DEPLOY_STATUS]: { color: 'success', icon: 'save', text: 'Save Changes' }
    }

    // Submit button element(s)
    const buttons = (params) => (
      <div className='mb-2'>
        <Button
          color={params.color}
          className='mr-2'
          disabled={pristine || submitting}
          type='submit'
        >
          <i className={`fas fa-${params.icon} fa-fw mr-2`}></i>
          {params.text}
        </Button>
      </div>
    )

    const submittingLoader = (
      <div>
        <div className='loader loader-primary loader-xs mr-2'/>
        Submitting...
      </div>
    )

    return submitting ? submittingLoader : buttons(paramsMap[mode])
  }

  renderSubmitButtonElements() {
    const {
      mode,
      submitting,
      pristine
    } = this.props

    const paramsMap = {
      [ControlMode.SELECT_TARGETS]: { color: 'danger', icon: 'trash', text: 'Delete Services/Models' },
      [ControlMode.EDIT_DEPLOY_STATUS]: { color: 'success', icon: 'save', text: 'Save Changes' }
    }

    // Submit button element(s)
    if (mode === ControlMode.EDIT_DEPLOY_STATUS) {
      return (
        <div className='mb-2'>
          <Button
            color='success'
            className='mr-2'
            disabled={pristine || submitting}
            type='submit'
          >
            <i className='fas fa-save fa-fw mr-2'></i>
            Save Changes
          </Button>
        </div>
      )
    }
    return (
      <div className='mb-2'>
        <Button
          color='danger'
          className='mr-2'
          disabled={pristine || submitting}
        >
          <i className='fas fa-trash fa-fw mr-2'></i>
          Delete Services/Models
      </Button>
      </div>
    )
  }

  // Handle event methods

  handleDiscardChanges(event): void {
    const { changeMode, reset } = this.props
    reset()
    changeMode(ControlMode.VIEW_DEPLOY_STATUS)
  }
}

interface DeployStatusFormCustomProps {
  applicationType: string
  applicationId
  mode: ControlMode
  models
  services: Service[]
  deployStatus
  canEdit: boolean
  onSubmit: (e) => Promise<void>
  changeMode: (mode: ControlMode) => void
}

interface StateProps {
  switchModelsStatus: APIRequest<boolean[]>
  initialValues: {
    status
    delete
  }
}

const mapStateToProps = (state: any, extraProps: DeployStatusFormCustomProps) => {
  // Map of service ID to delete flag
  const initialDeleteStatus: { [x: string]: boolean } =
    extraProps.services
    .map((service) => ({[service.id]: false}))
    .reduce((l, r) => Object.assign(l, r), {})

  return {
    ...state.form,
    initialValues: {
      status: extraProps.deployStatus,
      delete: {
        services: initialDeleteStatus
      }
    }
  }
}

const mapDispatchToProps = (dispatch): {} => {
  return { }
}

type DeployStatusFormProps
  = StateProps & DeployStatusFormCustomProps & InjectedFormProps<{}, DeployStatusFormCustomProps>

export default connect(mapStateToProps, mapDispatchToProps)(
  reduxForm<{}, DeployStatusFormCustomProps>(
    {
      form: 'deployStatusForm'
    }
  )(DeployStatusForm)
)
