import * as React from 'react'
import { withRouter, RouteComponentProps } from 'react-router-dom'

import SideMenu from './SideMenu/index'

/**
 *
 * @param props
 */
class Application extends React.Component<RouteComponentProps<{projectId: number, applicationId: string}>, {}> {
  render() {
    const { projectId, applicationId } = this.props.match.params

    return (
      <div className='row'>
        <SideMenu projectId={projectId} applicationId={applicationId}/>
        <div className='col-md-10 ml-sm-auto pt-5 px-5'>
          {this.props.children}
        </div>
      </div>
    )
  }

}

export default withRouter(Application)
