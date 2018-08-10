import * as React from 'react'
import { connect } from 'react-redux'
import { CustomInput, Table, Row } from 'reactstrap'
import { Field, InjectedFormProps } from 'redux-form'
import { Link } from 'react-router-dom'

import { Service } from '@src/apis'
import { ControlMode } from './index'

/**
 * Table for showing services status
 */
class ServicesStatusTable extends React.Component<ServicesStatusProps, {tooltipOpen}> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      tooltipOpen: {}
    }
  }

  render() {
    const { services } = this.props

    return (
      <Table hover className='mb-3'>
        {this.renderTableHead()}
        {this.renderTableBody(services)}
      </Table>
    )
  }

  toggleTooltip(tag) {
    return () => {
      const nextTooltipOpen = {
        ...this.state.tooltipOpen,
        [tag]: !this.state.tooltipOpen[tag]
      }

      this.setState({
        tooltipOpen: nextTooltipOpen
      })
    }
  }

  /**
   * Render head row of the table
   */
  renderTableHead = () => {
    return (
      <thead>
      <tr className='bg-light text-primary'>
        <th>Name</th><th>Service Level</th><th>Description</th><th>Host</th>
      </tr>
      </thead>
    )
  }

  /**
   * Render body of the table
   *
   * Render Service names
   * Each Service is rendered with a deploy check box on viewing/deleting mode
   * @param services Services to be shown (Currently show all, but should be filtered)
   */
  renderTableBody = (services) => {
    const { mode, applicationType, applicationId } = this.props

    // Button to delete Service (for deleting k8s services)
    const deleteCheckButton = (serviceName: string, serviceId: string) => {
      return (
        <Row>
          { applicationType === 'kubernetes' ?
            <Field
              name={`delete.services.${serviceId}`}
              component={CustomCheckBox}
              id={`service-${serviceId}`}
              label=''
              className='mr-1'
            />
            : null }
          <Link className='text-info' to={`/applications/${applicationId}/services/${serviceId}/edit`}>
            {serviceName}
          </Link>
        </Row>
      )
    }

    const renderButton = (serviceName, serviceId) => {
      const renderMap = {
        [ControlMode.VIEW_SERVICES_STATUS] : deleteCheckButton(serviceName, serviceId),
        [ControlMode.SELECT_TARGETS] : deleteCheckButton(serviceName, serviceId),
      }
      return renderMap[mode]
    }

    return (
      <tbody>
      {services.map(
        (service) => (
          <tr>
            <td key={service.name} scope='col'>
              {renderButton(service.name, service.id)}
            </td>
            <td>
              {service.serviceLevel}
            </td>
            <td>
              {service.description}
            </td>
            <td>
              {service.host}
            </td>
          </tr>
        )
      )}
      </tbody>
    )
  }

}

const CustomCheckBox = (props) => {
  const { input, id, label } = props

  return (
    <CustomInput
      {...input}
      type='checkbox'
      name={input.name}
      id={id}
      checked={input.value}
      label={label}
    />
  )
}

interface ServicesStatusFormCustomProps {
  applicationType: string
  applicationId
  services: Service[],
  mode: ControlMode,
}

export interface DispatchProps {
  dispatchChange
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    dispatchChange: (field, value, changeMethod) => dispatch(changeMethod(field, value))
  }
}

const mapStateToProps = (state: any, extraProps: ServicesStatusFormCustomProps) => {
  return {}
}

type ServicesStatusProps = DispatchProps & ServicesStatusFormCustomProps & InjectedFormProps<{}, ServicesStatusFormCustomProps>

export default connect(mapStateToProps, mapDispatchToProps)(ServicesStatusTable)
