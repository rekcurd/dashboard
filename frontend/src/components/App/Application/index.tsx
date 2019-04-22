import * as React from 'react'
import { withRouter, RouteComponentProps } from 'react-router-dom'

import SideMenu from './SideMenu/index'

/**
 *
 * @param props
 */
class Application extends React.Component<RouteComponentProps<{projectId: number, applicationId: string}>, {}> {
  render() {
    return (
      <div className='row'>
        <SideMenu />
        <div className='col-md-10 ml-sm-auto pt-5 px-5'>
          {this.props.children}
        </div>
      </div>
    )
  }

}

export default withRouter(Application)
