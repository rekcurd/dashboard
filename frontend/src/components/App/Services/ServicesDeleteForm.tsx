import * as React from 'react'
import { connect } from 'react-redux'
import { Button } from 'reactstrap'
import { reduxForm, InjectedFormProps } from 'redux-form'

import { APIRequest } from '@src/apis/Core'
import { Service } from '@src/apis'
import ServicesStatusTable from './ServicesStatusTable'
import { ControlMode } from './index'

class ServicesDeleteForm extends React.Component<ServicesDeleteFormProps, {}> {
  constructor(props, context) {
    super(props, context)

    this.handleDiscardChanges = this.handleDiscardChanges.bind(this)
  }

  componentWillReceiveProps(nextProps: ServicesDeleteFormProps) {
    const { mode, pristine, changeMode } = nextProps

    if (mode === ControlMode.VIEW_SERVICES_STATUS && !pristine) {
      changeMode(ControlMode.SELECT_TARGETS)
    } else if (mode === ControlMode.SELECT_TARGETS && pristine) {
      changeMode(ControlMode.VIEW_SERVICES_STATUS)
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
          {this.renderDiscardButton()}
        </div>
        <ServicesStatusTable
          {...this.props}
        />
        <hr />
        {this.renderSubmitButtons()}
      </form>
    )
  }

  renderDiscardButton = () => {
    const { mode } = this.props

    switch (mode) {
      case ControlMode.SELECT_TARGETS:
        return (
          <Button outline color='danger' onClick={this.handleDiscardChanges}>
            <i className={`fas fa-times fa-fw mr-2`}></i>
            Discard changes
          </Button>
        )
      default:
        return null
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

    const showSubmitButton: boolean = mode !== ControlMode.VIEW_SERVICES_STATUS

    if (!showSubmitButton) {
      return null
    }

    const paramsMap = {
      [ControlMode.SELECT_TARGETS]: { color: 'danger', icon: 'trash', text: 'Delete Services' },
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
      submitting,
      pristine
    } = this.props

    const paramsMap = {
      [ControlMode.SELECT_TARGETS]: { color: 'danger', icon: 'trash', text: 'Delete Services' },
    }

    return (
      <div className='mb-2'>
        <Button
          color='danger'
          className='mr-2'
          disabled={pristine || submitting}
        >
          <i className='fas fa-trash fa-fw mr-2'></i>
          Delete Services
      </Button>
      </div>
    )
  }

  // Handle event methods

  handleDiscardChanges(event): void {
    const { changeMode, reset } = this.props
    reset()
    changeMode(ControlMode.VIEW_SERVICES_STATUS)
  }
}

interface ServicesDeleteFormCustomProps {
  applicationType: string
  applicationId
  mode: ControlMode
  services: Service[]
  onSubmit: (e) => Promise<void>
  changeMode: (mode: ControlMode) => void
}

interface StateProps {
  initialValues: {
    status
    delete
  }
}

const mapStateToProps = (state: any, extraProps: ServicesDeleteFormCustomProps) => {
  // Map of service ID to delete flag
  const initialDeleteStatus: { [x: string]: boolean } =
    extraProps.services
    .map((service) => ({[service.id]: false}))
    .reduce((l, r) => Object.assign(l, r), {})

  return {
    ...state.form,
    initialValues: {
      delete: {
        services: initialDeleteStatus
      }
    }
  }
}

const mapDispatchToProps = (dispatch): {} => {
  return { }
}

type ServicesDeleteFormProps
  = StateProps & ServicesDeleteFormCustomProps & InjectedFormProps<{}, ServicesDeleteFormCustomProps>

export default connect(mapStateToProps, mapDispatchToProps)(
  reduxForm<{}, ServicesDeleteFormCustomProps>(
    {
      form: 'deployStatusForm'
    }
  )(ServicesDeleteForm)
)
