import * as React from 'react'
import { SideMenu, SideMenuParam } from '@common/SideMenu'
import { Col, Row } from 'reactstrap'

/**
 * Settings page
 *
 * @param props
 */
class Settings extends React.Component<{}> {
  render() {
    const sideMenuParam: SideMenuParam = {
      title: <div>Kubernetes</div>,
      id: 'kubernetes-side-menu',
      contents: [
        {
          title: <div><i className='fas fa-cog fa-fw mr-1'></i>{` `}List</div>,
          items: [{text: 'TBD', path: '/settings/kubernetes/hosts/', icon: 'plug'}]
        }
      ]
    }

    return (
      <Row>
        { /* Side menu */}
        <Col md='2' className='border-right border-secondary'>
          <SideMenu params={sideMenuParam}/>
        </Col>
        { /* Main content */}
        <Col md='10' className='pt-3 pl-5 pr-5'>
          {this.props.children}
        </Col>
      </Row>
    )
  }
}

export default Settings
