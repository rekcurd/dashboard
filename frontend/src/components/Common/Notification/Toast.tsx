import * as React from 'react'
import { connect } from 'react-redux'
import { dismissNotification } from '@src/actions'

interface StateProps {
  toast
}

const mapStateToProps = (state: any, extraProps): StateProps => {
  return {
    ...extraProps
  }
}

export interface DispatchProps {
  dismissNotification
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    dismissNotification: (id: number) => dispatch(dismissNotification(id))
  }
}

class Toast extends React.Component<StateProps & DispatchProps, {}> {
  constructor(props, context) {
    super(props, context)
    const { toast } = props

    this.dismiss = this.dismiss.bind(this)
    this.state = {
      id: toast.id
    }
  }

  dismiss() {
    const { toast } = this.props
    this.props.dismissNotification(toast.id)
  }

  render() {
    const { toast } = this.props
    const classes = {
      success: 'polite',
      info: 'polite',
      warning: 'assertive',
      error: 'assertive'
    }

    return (
      <div className={`toast toast-${toast.color}`} aria-live={classes[toast.color]} onClick={this.dismiss}>
        <div className='toast-message'>{toast.message}</div>
      </div>
    )
  }

  shouldComponentUpdate() {
    return false
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Toast)
