import * as React from 'react'
import { connect } from 'react-redux'
import { CustomInput, Table, Row } from 'reactstrap'
import { Field, InjectedFormProps } from 'redux-form'
import { Link } from 'react-router-dom'

import { Model, Service } from '@src/apis'
import { ControlMode } from './index'

/**
 * Table for showing deploy status
 * Show forms on editing or selecting models mode
 */
class DeployStatusTable extends React.Component<DeployStatusProps, {tooltipOpen}> {
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
        {this.renderTableHead(services)}
        {this.renderTableBody()}
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
   *
   * Render Service names and label (`Models` and `Services`)
   * Each Service is rendered with a deploy check box on viewing/deleting mode
   * @param services Services to be shown (Currently show all, but should be filtered)
   */
  renderTableHead = (services) => {
    const { mode, applicationType, applicationId, canEdit } = this.props

    // Button to delete Service (for deleting k8s services)
    const deleteCheckButton = (serviceName: string, serviceId: string) => {
      return (
        <Row>
          { applicationType === 'kubernetes' && canEdit ?
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
        [ControlMode.VIEW_DEPLOY_STATUS] : deleteCheckButton(serviceName, serviceId),
        [ControlMode.SELECT_TARGETS] : deleteCheckButton(serviceName, serviceId),
        [ControlMode.EDIT_DEPLOY_STATUS]: <span>{serviceName}</span>
      }
      return renderMap[mode]
    }

    return (
      <thead>
        <tr className='bg-light'>
          <th scope='col' className='text-primary'>
            Models <span className='text-info'>\</span> Services
          </th>
          {/* Render services */}
          {services.map(
            (service) => (
              <th key={service.name} scope='col'>
                {renderButton(service.name, service.id)}
              </th>
            )
          )}
        </tr>
      </thead>
    )
  }

  /**
   * Render body of the table
   */
  renderTableBody = () => {
    const {
      selectModelMode, models, applicationId, mode, canEdit
    } = this.props

    const modelSelectCheckBox = (model: Model) => (
      <Field
        name={`evaluate.models.${model.id}`}
        component={CustomCheckBox}
        id={`model-${model.id}`}
        value={model.id}
      />
    )

    const deleteCheckButton = (modelName: string, modelId: string) => {
      const checkBox = (
        <Field
          name={`delete.models.${modelId}`}
          component={CustomCheckBox}
          id={`model-${modelId}`}
          label=''
          className='mr-1'
        />
      )
      return (
        <Row>
          {canEdit ? checkBox : null}
          <Link className='text-info' to={`/applications/${applicationId}/models/${modelId}/edit`}>
            {modelName}
          </Link>
        </Row>
      )
    }

    const renderButton = (modelName, modelId) => {
      const renderMap = {
        [ControlMode.VIEW_DEPLOY_STATUS] : deleteCheckButton(modelName, modelId),
        [ControlMode.SELECT_TARGETS] : deleteCheckButton(modelName, modelId),
        [ControlMode.EDIT_DEPLOY_STATUS]: <span>{modelName}</span>
      }
      return renderMap[mode]
    }

    return (
      <tbody>
        {
          models.map(
            (model: Model, index: number) => (
              <tr key={index}>
                <td>
                  {selectModelMode ? modelSelectCheckBox(model) : renderButton(model.name, model.id)}
                </td>
                {this.renderStatusRow(model)}
              </tr>
            )
          )
        }
      </tbody>
    )
  }

  renderStatusRow = (model: Model) => (
    this.props.services.map(
      (service, index) => (
        <td key={index} className='transition-cell'>
          {this.renderStatusCell(service.id, model)}
        </td>
      )
    )
  )

  renderStatusCell = (serviceId: string, model: Model) => {
    const { mode, deployStatus } = this.props

    if (mode !== ControlMode.VIEW_DEPLOY_STATUS) {
      return (
        <Field
          component={CustomRadioButton}
          name={`switch.${serviceId}`}
          serviceId={serviceId}
          modelId={model.id}
        />
      )
    }

    // View mode (Not able to change)
    if (deployStatus[serviceId] === model.id) {
      return (
        <i className='fas fa-check fa-fw text-success mr-2'></i>
      )
    }
    return (<div></div>)
  }

}

class CustomRadioButton extends React.Component<any> {
  render() {
    const { input, modelId } = this.props

    return (
      <CustomInput
        {...input}
        type='radio'
        id={`${input.name}-${modelId}`}
        checked={String(input.value) === String(modelId)}
        value={modelId}
        label=''
      />
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

interface DeployStatusFormCustomProps {
  applicationType: string
  applicationId
  models: Model[],
  services: Service[],
  deployStatus,
  mode: ControlMode,
  selectModelMode?: boolean
  canEdit: boolean
}

export interface DispatchProps {
  dispatchChange
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    dispatchChange: (field, value, changeMethod) => dispatch(changeMethod(field, value))
  }
}

const mapStateToProps = (state: any, extraProps: DeployStatusFormCustomProps) => {
  return {}
}

type DeployStatusProps = DispatchProps & DeployStatusFormCustomProps & InjectedFormProps<{}, DeployStatusFormCustomProps>

export default connect(mapStateToProps, mapDispatchToProps)(DeployStatusTable)
