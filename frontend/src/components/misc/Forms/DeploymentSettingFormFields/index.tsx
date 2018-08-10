import * as React from 'react'
import { connect } from 'react-redux'
import { Field } from 'redux-form'
import { CardTitle, UncontrolledTooltip } from 'reactstrap'

import { KubernetesHost, Model } from '@src/apis'
import { SingleFormField } from '@common/Field/SingleFormField'
import { required, applicationNameFormat } from '@common/Field/Validateors'

declare var REACT_APP_CONFIG: any

/**
 * Form fields to set up application/service
 */
class DeploymentSettingFormFields extends React.Component<FormProps> {
  /**
   * Render form fields to setup deployment
   * (Common to save applications or services)
   *
   */
  render() {
    const { applicationType, mode } = this.props
    const kubernetesFields =
      applicationType === 'kubernetes'
        ? this.renderScalingConfigFields()
        : null

    return (
      <React.Fragment>
        {this.renderBasicConfigFields()}
        {kubernetesFields}
        {applicationType && mode === 'add' ? this.renderMemoFields() : null}
      </React.Fragment>
    )
  }

  renderBasicConfigFields(): JSX.Element {
    const {
      onChangeApplicationType,
      applicationType,
      resource,
      formNamePrefix
    } = this.props

    const applicationTypes = [
      { label: 'Kubernetes', value: 'kubernetes' },
      { label: 'Non Kubernetes', value: 'simple' }
    ]
    const applicationTypeSelectBox = (
      <Field
        label='Application Type'
        name={`${formNamePrefix}.applicationType`}
        component={SingleFormField} type='select'
        className='form-control' id='applicationType'
        formText={`Application type of your application, Kubernetes or none`}
        options={applicationTypes}
        validate={required}
        onChange={onChangeApplicationType}
        disable={!onChangeApplicationType}
        required
      />
    )

    const nameField = (
      <Field
        name={`${formNamePrefix}.name`}
        label='Name'
        component={SingleFormField} type='text'
        className='form-control' id='applicationlName'
        formText={`Name of ${resource}, must be unique`}
        validate={[required, applicationNameFormat]}
        required
      />
    )

    const nonKubernetesHostField =
      <Field
        name={`${formNamePrefix}.host`}
        label='Host'
        component={SingleFormField} type='text'
        className='form-control' id='workerHost'
        formText='Existing worker host'
        validate={required}
        required
      />

    const hosts =
      this.props.kubernetesHosts.map(
        (host: KubernetesHost) => ({ label: host.displayName, value: host.id.toString() })
      )

    const kubernetesHostField =
      <Field
        label='Kubernetes Host'
        name={`${formNamePrefix}.kubernetesId`}
        component={SingleFormField} type='select'
        className='form-control' id='host'
        formText={`Kubernetes host in which your ${resource} is deployed`}
        options={hosts}
        validate={required}
        disable={resource !== 'application'}
        required
      />

    const basicConfigFields = this.renderBasicKubernetesConfigFields()

    return (
      <React.Fragment>
        <CardTitle tag='h2' className='text-primary'>Basic</CardTitle>
        {applicationTypeSelectBox}
        {applicationType === 'kubernetes' ? kubernetesHostField : null}
        {applicationType === 'kubernetes' && resource === 'application' ? nameField : null}
        {applicationType === 'simple' ? nonKubernetesHostField : null}
        {applicationType === 'kubernetes' ? basicConfigFields : null}
      </React.Fragment>
    )
  }

  renderBasicKubernetesConfigFields(): JSX.Element {
    const { environmentsToName } = REACT_APP_CONFIG
    const { formNamePrefix, resource, mode } = this.props

    const serviceLevels =
      Object.keys(environmentsToName).map(
        (env) => ({ label: environmentsToName[env], value: env }))

    const serviceModelAssignments =
      this.props.models.map(
        (model: Model) => ({ label: model.name, value: model.id.toString() }))

    const serviceLevelSelectBox = (
      <Field
        label='Service Level'
        name={`${formNamePrefix}.serviceLevel`}
        component={SingleFormField} type='select'
        className='form-control' id='serviceLevel'
        options={serviceLevels}
        validate={required}
        required
      />
    )

    const servicePortField = (
      <Field
        label='Service Port'
        name={`${formNamePrefix}.servicePort`}
        component={SingleFormField} type='text'
        className='' id='servicePort'
        formText={`Port number accepted on your ${resource}`}
        validate={required}
        required
      />
    )

    const serviceContainerImageField = (
      <Field
        label='Container Image'
        name={`${formNamePrefix}.containerImage`}
        component={SingleFormField} type='text'
        className=''
        id='containerImage'
        formText='Image location of Docker registry'
        validate={required}
        required
      />
    )

    const serviceGitUrlField = (
      <Field
        label='Git URL'
        name={`${formNamePrefix}.serviceGitUrl`}
        component={SingleFormField} type='text'
        className=''
        groupClassName=''
        id='serviceGitUrl'
        formText='URL of your worker Git repository'
        validate={required}
        required
      />
    )

    const serviceGitBranchField = (
      <Field
        label='Git Branch'
        name={`${formNamePrefix}.serviceGitBranch`}
        component={SingleFormField} type='text'
        className=''
        groupClassName=''
        id='serviceGitBranch'
        formText='Git branch name of your worker Git repository'
        validate={required}
        required
      />
    )

    const serviceBootScriptField = (
      <Field
        label='Boot Script'
        name={`${formNamePrefix}.serviceBootScript`}
        component={SingleFormField} type='text'
        className=''
        id='serviceBootScript'
        formText={`Script file name for booting ${resource}`}
        validate={required}
        required
      />
    )

    const modelAssignmentSelectBox = (
      <Field
        label='Model assignment'
        name={`${formNamePrefix}.serviceModelAssignment`}
        component={SingleFormField} type='select'
        className='form-control' id='serviceModelAssignment'
        formText={`Model assignment when service boots`}
        options={serviceModelAssignments}
      />
    )

    return (
      <React.Fragment>
        {serviceLevelSelectBox}
        {servicePortField}
        {serviceContainerImageField}
        {serviceGitUrlField}
        {serviceGitBranchField}
        {serviceBootScriptField}
        {resource === 'service' && mode === 'add' ? modelAssignmentSelectBox : null}
        {this.renderResourceConfigFields()}
      </React.Fragment>
    )
  }

  renderScalingConfigFields() {
    const { formNamePrefix } = this.props

    const replicasDefaultField = (
      <Field
        name={`${formNamePrefix}.replicasDefault`}
        label='Default'
        component={SingleFormField} type='number'
        className=''
        groupClassName='col-md-4 pr-3' id='replicasDefault'
        placeholder=''
        validate={required}
        required
      />
    )

    const replicasMinimumField = (
      <Field
        name={`${formNamePrefix}.replicasMinimum`}
        label='Minimum'
        component={SingleFormField} type='number'
        className=''
        groupClassName='col-md-4 pr-3' id='replicasMinimum'
        placeholder=''
        validate={required}
        required
      />
    )

    const replicasMaximumField = (
      <Field
        name={`${formNamePrefix}.replicasMaximum`}
        label='Maximum'
        component={SingleFormField} type='number'
        className=''
        groupClassName='col-md-4' id='replicasMaximum'
        placeholder=''
        validate={required}
        required
      />
    )

    const autoscaleCpuThresholdField = (
      <Field
        name={`${formNamePrefix}.autoscaleCpuThreshold`}
        label='CPU Maximum'
        component={SingleFormField} type='number'
        className=''
        id='autoscaleCpuThreshold'
        placeholder=''
        validate={required}
        required
      />
    )

    const policyMaxSurgeField = (
      <Field
        name={`${formNamePrefix}.policyMaxSurge`}
        label='Max Surge'
        component={SingleFormField} type='number'
        className=''
        groupClassName='col-md-4 pr-3' id='policyMaxSurge'
        formText='Maximum number of serged pod when updating. Recommendation is "ceil(0.25 * <replicas_default>)"'
        validate={required}
        required
      />
    )

    const policyMaxUnavailableField = (
      <Field
        name={`${formNamePrefix}.policyMaxUnavailable`}
        label='Max Unavailable'
        component={SingleFormField} type='number'
        className=''
        groupClassName='col-md-4 pr-3' id='policyMaxUnavailable'
        formText='Maximum number of unavailable pod when updating. Recommendation is "floor(0.25 * <replicas_default>)".'
        validate={required}
        required
      />
    )

    const policyWaitSecondsField = (
      <Field
        name={`${formNamePrefix}.policyWaitSeconds`}
        label='Wait Seconds'
        component={SingleFormField} type='number'
        className=''
        groupClassName='col-md-4' id='policyWaitSeconds'
        formText='Minimum wait seconds when updating. Recommendation is "actual boot time + alpha [second]"'
        validate={required}
        required
      />
    )

    return (
      <React.Fragment>
        {this.renderFormCardTitleWithIcon(
          'Policy',
          'policy',
          'Deploy and monitoring policies for Kubernetes'
        )}
        <h3 className='mt-2'>Replica</h3>
        <div className='form-row'>
          {replicasDefaultField}
          {replicasMinimumField}
          {replicasMaximumField}
        </div>
        <h3>Autoscale Threshold</h3>
        {autoscaleCpuThresholdField}
        <h3>Rolling Update</h3>
        <div className='form-row'>
          {policyMaxSurgeField}
          {policyMaxUnavailableField}
          {policyWaitSecondsField}
        </div>
      </React.Fragment>
    )
  }

  renderResourceConfigFields() {
    const { formNamePrefix, resource } = this.props

    const resourceRequestCpuField = (
      <Field
        name={`${formNamePrefix}.resourceRequestCpu`}
        label='CPU Request'
        component={SingleFormField} type='number'
        className=''
        groupClassName='col-md-6 pr-3' id='resourceRequestCpu'
        formText={`Minimum CPU request for running ${resource}`}
        validate={required}
        required
      />
    )

    const resourceLimitCpuField = (
      <Field
        name={`${formNamePrefix}.resourceLimitCpu`}
        label='CPU Limit'
        component={SingleFormField} type='number'
        className=''
        groupClassName='col-md-6' id='resourceLimitCpu'
        formText={`Maximum CPU limit for running ${resource}`}
        validate={required}
        required
      />
    )

    const resourceRequestMemoryField = (
      <Field
        name={`${formNamePrefix}.resourceRequestMemory`}
        label='Memory Request'
        component={SingleFormField} type='text'
        className=''
        groupClassName='col-md-6 pr-3' id='resourceRequestMemory'
        formText={`Minimum memory requrest for running ${resource}`}
        validate={required}
        required
      />
    )

    const resourceLimitMemoryField = (
      <Field
        name={`${formNamePrefix}.resourceLimitMemory`}
        label='Memory Limit'
        component={SingleFormField} type='text'
        className=''
        groupClassName='col-md-6' id='resourceLimitMemory'
        formText={`Maximum memory limit for running ${resource}`}
        validate={required}
        required
      />
    )

    return (
      <React.Fragment>
        <div className='form-row'>
          {resourceRequestCpuField}
          {resourceLimitCpuField}
        </div>
        <div className='form-row'>
          {resourceRequestMemoryField}
          {resourceLimitMemoryField}
        </div>
      </React.Fragment>
    )
  }

  renderMemoFields() {
    const {
      formNamePrefix,
      applicationType,
      resource
    } = this.props

    const memoFieldName =
      applicationType === 'kubernetes'
        ? 'commitMessage'
        : 'description'

    const descriptionField = (
      <Field
        label='Memo'
        name={`${formNamePrefix}.${memoFieldName}`}
        component={SingleFormField} type='textarea'
        className='form-control' id='description'
        placeholder={`First ${resource}`}
      />
    )

    return (
      <React.Fragment>
        <CardTitle tag='h2' className='text-primary'>Memo</CardTitle>
        {descriptionField}
      </React.Fragment>
    )
  }

  renderFormCardTitleWithIcon(titleText, iconId, tooltipText) {
    return (
      <React.Fragment>
        <CardTitle tag='span' className='text-primary h2' style={{ verticalAlign: 'middle' }}>
          {titleText}
        </CardTitle>
        <i className='fa fa-question-circle text-muted ml-1' id={iconId} style={{ verticalAlign: 'middle' }}></i>
        <UncontrolledTooltip target={iconId} placement='right'>
          {tooltipText}
        </UncontrolledTooltip>
      </React.Fragment>

    )
  }
}

interface CustomProps {
  applicationType
  formNamePrefix: string
  kubernetesHosts: KubernetesHost[]
  resource: string
  onChangeApplicationType?
  mode
  models: Model[]
}

type FormProps =
  CustomProps

export const kubernetesDeploymentDefultSettings = {
  replicasDefault: 1,
  replicasMaximum: 1,
  replicasMinimum: 1,
  autoscaleCpuThreshold: 80,
  policyMaxSurge: 1,
  policyMaxUnavailable: 0,
  policyWaitSeconds: 300,
  resourceRequestCpu: 1,
  resourceLimitCpu: 1,
  resourceRequestMemory: '128Mi',
  resourceLimitMemory: '256Mi',
  containerImage: 'druckerorg/drucker:python-latest',
  serviceGitUrl: 'https://github.com/drucker/drucker-example.git',
  serviceGitBranch: 'master',
  serviceBootScript: 'start.sh'
}

export default
connect(
  (state: any, extraProps: CustomProps) => ({
    ...extraProps,
  })
)(DeploymentSettingFormFields)