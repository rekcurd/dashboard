import * as React from 'react'
import NavigationBar from '@components/misc/NavigationBar/index'
import NotificationArea from '@common/Notification'

const Layout =
  (props) => (
    <React.Fragment>
      <NavigationBar />
      <div className='container-fluid'>
        {props.children}
      </div>
      <NotificationArea />
    </React.Fragment>
  )

export default Layout
