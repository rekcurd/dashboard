import * as React from 'react'
import NavigationBar from '@components/misc/NavigationBar/index'
import NotificationArea from '@common/Notification'

interface Props {
  auth: boolean
}

export default class Layout extends React.Component<Props> {
  render() {
    const { auth } = this.props
    return (
      <React.Fragment>
        <NavigationBar auth={auth} />
        <div className='container-fluid'>
          {this.props.children}
        </div>
        <NotificationArea />
      </React.Fragment>
    )
  }
}
