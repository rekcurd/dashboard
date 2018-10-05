import * as React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Table, Row, Col } from 'reactstrap'

import { AccessControlList, Application } from '@src/apis'
import { APIRequest } from '@src/apis/Core'
import { fetchAccessControlListDispatcher, fetchApplicationByIdDispatcher } from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'

interface StateProps {
  accessControlList: APIRequest<AccessControlList>
  application: APIRequest<Application>
}
interface DispatchProps {
  fetchAccessControlList: (applicationId: string) => Promise<void>
  fetchApplicationById: (id: string) => Promise<void>
}
type AdminProps = StateProps & DispatchProps & RouteComponentProps<{applicationId: string}>

class Admin extends React.Component<AdminProps> {
  constructor(props: AdminProps) {
    super(props)
    this.renderAccessControlList = this.renderAccessControlList.bind(this)
  }
  componentWillMount() {
    const { fetchAccessControlList, fetchApplicationById, match } = this.props
    fetchAccessControlList(match.params.applicationId)
    fetchApplicationById(match.params.applicationId)
  }
  render() {
    const { accessControlList, application } = this.props
    return (
      <APIRequestResultsRenderer
        APIStatus={{ accessControlList, application }}
        render={this.renderAccessControlList}
      />
    )
  }
  renderAccessControlList(results) {
    const application: Application = results.application
    const acl: AccessControlList[] = results.accessControlList
    return this.renderContent(application.name, acl)
  }
  renderContent(applicationName: string, acl: AccessControlList[]) {
    const tableBody = acl.map((e: AccessControlList, i: number) => {
      return (
        <tr key={i}>
          <td>{e.userUid}</td>
          <td>{e.userName}</td>
          <td>{e.role}</td>
        </tr>
      )
    })
    return (
      <div className='pb-5'>
        <Row className='align-items-center mb-5'>
          <Col xs='7'>
            <h1>
              <i className='fas fa-ship fa-fw mr-2'></i>
              {applicationName}
            </h1>
          </Col>
        </Row>
        <h3>
          <i className='fas fa-unlock fa-fw mr-2'></i>
          Access Control List
        </h3>
        <hr />
        <Table hover className='mb-3'>
          <thead>
            <tr className='bg-light text-primary'>
              <th>ID</th><th>Name</th><th>Role</th>
            </tr>
          </thead>
          <tbody>{tableBody}</tbody>
        </Table>
      </div>
    )
  }
}

export default withRouter(
  connect(
    (state: any): StateProps => {
      return {
        accessControlList: state.fetchAccessControlListReducer.accessControlList,
        application: state.fetchApplicationByIdReducer.applicationById,
      }
    },
    (dispatch: Dispatch): DispatchProps => {
      return {
        fetchAccessControlList: (applicationId: string) => fetchAccessControlListDispatcher(dispatch, { applicationId }),
        fetchApplicationById: (id: string) => fetchApplicationByIdDispatcher(dispatch, { id }),
      }
    }
  )(Admin))
