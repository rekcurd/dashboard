import * as React from 'react'
import { withRouter } from 'react-router'

class KubernetesImpl extends React.Component<{}, {}> {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    return (<React.Fragment>{this.props.children}</React.Fragment>)
  }
}

export { default as Host } from './Host'
export { default as Hosts } from './Hosts'

export const Kubernetes = withRouter(KubernetesImpl)
