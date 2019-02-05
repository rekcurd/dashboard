import * as React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, InjectedFormProps } from 'redux-form'
import { Card, CardBody, Form, Button, CardTitle, UncontrolledTooltip } from 'reactstrap'

import { FileUploadInputField } from '@common/Field/FileUploadInputField'
import { SingleFormField } from '@common/Field/SingleFormField'
import { required } from '@common/Field/Validateors'

class HostFormImpl extends React.Component<HostFormProps, StateProps> {
  constructor(props, context) {
    super(props, context)

    this.onChange = this.onChange.bind(this)
    this.state = {
      fileName: null
    }
  }

  /**
   * Show specified file name on the field
   * @param event
   */
  onChange(event) {
    if (event.target.files[0]) {
      this.setState({ fileName: event.target.files[0].name })
    }
  }

  render() {
    const { onSubmit, handleSubmit, mode } = this.props

    return (
      <div className='pt-3 pr-3 pl-3'>
        <h1>
          <i className='fas fa-plug fa-fw mr-2'></i>
          {mode === 'add' ? 'Add' : 'Edit'} Kubernetes Host
        </h1>
        <Form onSubmit={handleSubmit(onSubmit)}>
          {this.renderFormBody()}
          {this.renderDbConfigFields()}
          {this.renderModelConfigFields()}
          {this.renderButtons()}
        </Form>
      </div>
    )
  }

  renderFormBody() {
    const { fileName } = this.state
    const { mode } = this.props

    const nameForm = (
      <Field
        name={`${mode}.kubernetes.displayName`}
        label='Name'
        component={SingleFormField} type='text'
        className='form-control' id='hostlName'
        formText='Must be unique. If empty, automatically generated'
        validate={required}
      />
    )

    const uploadConfigForm = (
      <Field
        label='Host Config File'
        formText='Choose kubernetes host config file'
        name={`${mode}.kubernetes.configFile`}
        component={FileUploadInputField}
        id='uploadKubernetesFile'
        onChange={this.onChange}
        fileName={fileName}
        validate={required}
        required
      />
    )

    const descriptionForm = (
      <Field
        label='Description'
        name={`${mode}.kubernetes.description`}
        component={SingleFormField} type='text'
        className='form-control' id='settingDescription'
        formText='Write short description of your new Kubernetes host'
      />
    )

    const dnsForm = (
      <Field
        name={`${mode}.kubernetes.dnsName`}
        label='DNS Name'
        component={SingleFormField} type='text'
        className='form-control' id='appDnsName'
        formText='You can access your application with http://<app name>-<service level>.<app DNS name>.'
        validate={required}
        required
      />
    )

    return (
      <Card body className='mb-3'>
        <CardTitle tag='span' className='text-primary h2' style={{verticalAlign: 'middle'}}>
          Basic
        </CardTitle>
        {nameForm}
        {uploadConfigForm}
        {dnsForm}
        {descriptionForm}
      </Card>
    )
  }

  /**
   * Render database config fields
   * (Only for kubernetes)
   */
  renderDbConfigFields(): JSX.Element {
    const {
      mode
    } = this.props

    const dbMySQLHostField = (
      <Field
        label='Host'
        name={`${mode}.kubernetes.dbMysqlHost`}
        component={SingleFormField} type='text'
        className=''
        groupClassName='col-md-6 pr-3'
        id='dbMysqlHost'
        validate={required}
        required
      />
    )

    const dbMySQLPortField = (
      <Field
        label='Port Number'
        name={`${mode}.kubernetes.dbMysqlPort`}
        component={SingleFormField} type='number'
        className=''
        groupClassName='col-md-6 pr-3'
        id='dbMysqlPort'
        validate={required}
        required
      />
    )

    const dbMySQLDBNameField = (
      <Field
        label='DB Name'
        name={`${mode}.kubernetes.dbMysqlDbname`}
        component={SingleFormField} type='text'
        className=''
        groupClassName='col-md-4 pr-3'
        id='dbMysqlDbname'
        validate={required}
        required
      />
    )

    const dbMySQLUserField = (
      <Field
        label='User'
        name={`${mode}.kubernetes.dbMysqlUser`}
        component={SingleFormField} type='text'
        className=''
        groupClassName='col-md-4'
        id='dbMysqlUser'
        validate={required}
        required
      />
    )

    const dbMySQLPasswordField = (
      <Field
        label='Password'
        name={`${mode}.kubernetes.dbMysqlPassword`}
        component={SingleFormField} type='password'
        className=''
        groupClassName='col-md-4 pr-3'
        id='dbMysqlPassword'
        validate={required}
        required
      />
    )

    const mysqlHostFields = (
      <React.Fragment>
        <div className='mb-2 mt-3'>Input following configurations of your MySQL server</div>
        <div className='form-row'>
          {dbMySQLHostField}
          {dbMySQLPortField}
        </div>
        <div className='form-row'>
          {dbMySQLDBNameField}
          {dbMySQLUserField}
          {dbMySQLPasswordField}
        </div>
      </React.Fragment>
    )

    return (
      <Card className='mb-3'>
        <CardBody>
          {this.renderFormCardTitleWithIcon(
            'Database',
            'database',
            'Specify configs of database that is required to manage workers'
          )}
          {mysqlHostFields}
        </CardBody>
      </Card>
    )
  }

  renderFormCardTitleWithIcon(titleText, iconId, tooltipText) {
    return (
      <React.Fragment>
        <CardTitle tag='span' className='text-primary h2' style={{verticalAlign: 'middle'}}>
          {titleText}
        </CardTitle>
        <i className='fa fa-question-circle text-muted ml-1' id={iconId} style={{verticalAlign: 'middle'}}></i>
        <UncontrolledTooltip target={iconId} placement='right'>
          {tooltipText}
        </UncontrolledTooltip>
      </React.Fragment>

    )
  }

  renderModelConfigFields() {
    const { mode } = this.props

    const hostModelDirField = (
      <Field
        label='Directory of model on host node'
        name={`${mode}.kubernetes.hostModelDir`}
        component={SingleFormField} type='text'
        className=''
        id='hostModelDir'
        formText='Directry of host node for ML models. Recommend that mount cloud storage (e.g. AWS EBS, GCP GCS) on this directory'
        validate={required}
        required
      />
    )

    const podModelDirField = (
      <Field
        label='Directory of model on pod'
        name={`${mode}.kubernetes.podModelDir`}
        component={SingleFormField} type='text'
        className=''
        id='podModelDir'
        formText='Directry of pod for ML models. Link to the directory of model on host'
        validate={required}
        required
      />
    )

    return (
      <Card className='mb-3'>
        <CardBody>
          <CardTitle tag='h2' className='text-primary'>Model Storage</CardTitle>
          {hostModelDirField}
          {podModelDirField}
        </CardBody>
      </Card>
    )
  }

  /**
   * Render control buttons
   *
   * Put on footer of this modal
   */
  renderButtons() {
    const { onCancel, submitting, mode } = this.props

    if (submitting) {
      return (
        <div>
          <div className='loader loader-primary loader-xs mr-2' />
          Submitting...
        </div>
      )
    }

    return (
      <Card className='mb-3'>
        <CardBody className='text-right'>
          <Button color='success' type='submit'>
            <i className='fas fa-check fa-fw mr-2'></i>
            {mode === 'add' ? 'Submit' : 'Update'}
          </Button>
          {' '}
          <Button outline color='info' onClick={onCancel}>
            <i className='fas fa-ban fa-fw mr-2'></i>
            Cancel
          </Button>
        </CardBody>
      </Card>
    )
  }
}

type HostFormProps =
  CustomProps
  & StateProps
  & InjectedFormProps<{}, CustomProps>

const defaultInitialValues = {
  hostModelDir: '/mnt/rekcurd-model',
  podModelDir: '/mnt/rekcurd-model'
}

interface StateProps {
  fileName: string
}

export interface CustomProps {
  onCancel
  onSubmit
  mode: string
  initialValues?: any
}

const mapStateToProps = (state: any, extraProps: CustomProps) => ({
  ...state.form,
  initialValues: {
    [extraProps.mode]: {
      kubernetes: {
        ...defaultInitialValues,
      }
    },
    ...extraProps.initialValues
  }
})

export const HostForm = connect(mapStateToProps)(
  reduxForm<{}, CustomProps>(
    {
      form: 'kubernetesHostForm',
      touchOnChange: true
    }
  )(HostFormImpl)
)
