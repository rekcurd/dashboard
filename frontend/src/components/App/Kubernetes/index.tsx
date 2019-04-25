import * as React from 'react'
import { withRouter } from 'react-router'

export { default as SideMenu } from './SideMenu'
export { default as Hosts } from './Hosts'
export { default as Host } from './Host'

class KubernetesImpl extends React.Component<{}, {}> {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    return (<React.Fragment>{this.props.children}</React.Fragment>)
  }
}

export const Kubernetes = withRouter(KubernetesImpl)
