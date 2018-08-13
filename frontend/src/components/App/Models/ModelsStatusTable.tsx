import * as React from 'react'
import { connect } from 'react-redux'
import { CustomInput, Table, Row } from 'reactstrap'
import { Field, InjectedFormProps } from 'redux-form'
import { Link } from 'react-router-dom'

import { Model } from '@src/apis'
import { ControlMode } from './index'

/**
 * Table for showing models status
 */
class ModelsStatusTable extends React.Component<ModelsStatusProps, {tooltipOpen}> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      tooltipOpen: {}
    }
  }

  render() {
    const { models } = this.props

    return (
      <Table hover className='mb-3'>
        {this.renderTableHead()}
        {this.renderTableBody(models)}
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
        <th>Description</th><th>Register Date</th>
      </tr>
      </thead>
    )
  }

  /**
   * Render body of the table
   *
   * Render Model names
   * Each Model is rendered with a deploy check box on viewing/deleting mode
   * @param models Models to be shown (Currently show all, but should be filtered)
   */
  renderTableBody = (models) => {
    const { applicationType, applicationId } = this.props

    // Button to delete Model (for deleting k8s models)
    const deleteCheckButton = (modelName: string, modelId: string) => {
      return (
        <Row>
          { applicationType === 'kubernetes' ?
            <Field
              name={`delete.models.${modelId}`}
              component={CustomCheckBox}
              id={`model-${modelId}`}
              label=''
              className='mr-1'
            />
            : null }
          <Link className='text-info' to={`/applications/${applicationId}/models/${modelId}/edit`}>
            {modelName}
          </Link>
        </Row>
      )
    }

    return (
      <tbody>
      {models.map(
        (model) => (
          <tr>
            <td key={model.name} scope='col'>
              {deleteCheckButton(model.name, model.id)}
            </td>
            <td>
              {model.registeredDate.toUTCString()}
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

interface ModelsStatusFormCustomProps {
  applicationType: string
  applicationId
  models: Model[],
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

const mapStateToProps = (state: any, extraProps: ModelsStatusFormCustomProps) => {
  return {}
}

type ModelsStatusProps = DispatchProps & ModelsStatusFormCustomProps & InjectedFormProps<{}, ModelsStatusFormCustomProps>

export default connect(mapStateToProps, mapDispatchToProps)(ModelsStatusTable)
