import * as React from 'react'
import { connect } from 'react-redux'
import { RouterProps, RouteComponentProps } from 'react-router'
import { withRouter, Link } from 'react-router-dom'
import { Button } from 'reactstrap'

import { APIRequest } from '@src/apis/Core'
import { Project } from '@src/apis'
import {
  fetchAllProjectsDispatcher,
  addNotification
 } from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'

interface ProjectsState {}

/**
 * Show list of all projects
 *
 * Home page to move detaied page for each project
 */
class ProjectList extends React.Component<StateProps & DispatchProps & RouterProps, ProjectsState> {
  constructor(props, context) {
    super(props, context)

    this.renderProjects = this.renderProjects.bind(this)
  }

  componentDidMount() {
    this.props.fetchProjects()
  }

  render() {
    const status = this.props.projects

    return (
      <APIRequestResultsRenderer
        APIStatus={{ projects: status }}
        render={this.renderProjects}
      />
    )

  }

  renderProjects(result) {
    const projects: Project[] = result.projects
    const { push } = this.props.history

    const title = (
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h1>
          <i className='fas fa-project-diagram fa-fw mr-3'></i>
          Projects
        </h1>
        <div>
          <Button color='primary' size='sm' onClick={(event) => push('/projects/add')}>
            <i className='fas fa-plus fa-fw mr-2'></i>
            Add Project
          </Button>
        </div>
      </div>
    )

    return (
      <div className='row justify-content-center'>
        <div className='col-10 pt-5'>
          {title}
          {this.renderProjectListTable(projects)}
        </div>
      </div>
    )
  }

  /**
   * Render table to show project
   * each cell has link to move detailed project page
   *
   * @param projects {Project[]} List of projects
   */
  renderProjectListTable(projects: Project[]) {
    const projectListTableBody = (
      projects.map(
        (value: Project) => (
          <tr key={value.projectId}>
            <td>
              <Link
                to={`/projects/${value.projectId}`}
                className='text-info'
              >
                {value.name}
              </Link>
            </td>
            <td>
              {value.useKubernetes ? 'Yes' : 'No'}
            </td>
            <td>
              {value.description}
            </td>
            <td>
              {value.registerDate.toUTCString()}
            </td>
          </tr>
        )
      )
    )

    return (
      <table className='table table-hover' id='project-list'>
        <thead>
          <tr className='bg-light text-primary'>
            <th>Name</th><th>Kubernetes</th><th>Description</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          {projectListTableBody}
        </tbody>
      </table>
    )
  }
}

export interface StateProps {
  projects: APIRequest<Project[]>
}

const mapStateToProps = (state) => {
  return {
    projects: state.fetchAllProjectsReducer.fetchAllProjects
  }
}

export interface DispatchProps {
  fetchProjects: () => Promise<void>
  addNotification
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchProjects: () => fetchAllProjectsDispatcher(dispatch),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{}>>(
    mapStateToProps, mapDispatchToProps
  )(ProjectList)
)
