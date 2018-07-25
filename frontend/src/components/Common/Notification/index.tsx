import * as React from 'react'
import { connect } from 'react-redux'
import Toast from './Toast'

interface StateProps {
  toasts: any[]
}

const mapStateToProps = (state: any): StateProps => {
  return {
    ...state.notificationReducer.notification
  }
}

class NotificationArea extends React.Component<StateProps, {}> {
  render() {
    const { toasts } = this.props

    return (
      toasts.length > 0 ? this.renderToasts(toasts) : <div></div>
    )
  }

  renderToasts(toasts) {
    return (
      <div id='toast-container' className='toast-top-right'>
        {toasts.map((toast) => {
          return <Toast toast={toast} key={toast.id}/>
        })}
      </div>
    )
  }

}

export default connect(mapStateToProps)(NotificationArea)
