import * as React from 'react'
import { connect } from 'react-redux'
import { Card, CardBody, CardTitle, Button } from 'reactstrap'

import * as Yup from "yup";
import { Field } from "formik";

import { FormikInput } from '@common/Field'


export const ServiceDeploymentSchema = {
  replicasDefault: Yup.number()
    .required('Required')
    .positive()
    .integer(),
  replicasMaximum: Yup.number()
    .positive()
    .integer()
    .min(Yup.ref('replicasDefault')),
  replicasMinimum: Yup.number()
    .positive()
    .integer()
    .max(Yup.ref('replicasDefault')),
  autoscaleCpuThreshold: Yup.number()
    .positive()
    .integer()
    .max(100),
  policyMaxSurge: Yup.number()
    .min(0)
    .integer(),
  policyMaxUnavailable: Yup.number()
    .min(0)
    .integer(),
  policyWaitSeconds: Yup.number()
    .min(0)
    .max(86400)
    .integer(),
  containerImage: Yup.string()
    .required('Required')
    .max(512),
  serviceGitUrl: Yup.string()
    .max(512),
  serviceGitBranch: Yup.string()
    .max(512),
  serviceBootScript: Yup.string()
    .max(512),
  resourceRequestCpu: Yup.number()
    .required('Required')
    .positive(),
  resourceRequestMemory: Yup.string()
    .required('Required')
    .max(16),
  resourceLimitCpu: Yup.number()
    .positive()
    .min(Yup.ref('resourceRequestCpu')),
  resourceLimitMemory: Yup.string()
    .max(16)
}

class ServiceDeploymentFormImpl extends React.Component<ServiceDeploymentFormProps> {
  render() {
    return (
      <React.Fragment>
        <Card className='mb-3'>
          <CardBody>
            <CardTitle>Container Image / Source Code</CardTitle>
            <Field
              name="containerImage"
              label="Container Image URL"
              component={FormikInput}
              className="form-control"
              placeholder="Image location of Docker registry."
              required />
            <Field
              name="serviceGitUrl"
              label="Git URL"
              component={FormikInput}
              className="form-control"
              placeholder="[Option] Git URL of your Rekcurd service. Your code will be downloaded when a container boots IF YOU USE Rekcurd's official docker image (e.g. 'rekcurd/rekcurd:python-latest')." />
            <div className='form-row'>
              <Field
                name="serviceGitBranch"
                label="Git Branch Name"
                component={FormikInput}
                className="form-control"
                groupClassName='col-md-6 pr-3'
                placeholder="[Option] Git Branch name of your Rekcurd service (e.g. 'master')." />
              <Field
                name="serviceBootScript"
                label="Booting Shell Script"
                component={FormikInput}
                className="form-control"
                groupClassName='col-md-6'
                placeholder="[Option] Script file name for booting (e.g. 'start.sh')." />
            </div>
          </CardBody>
        </Card>

        <Card className='mb-3'>
          <CardBody>
            <CardTitle>Resource Requirement</CardTitle>
            <div className='form-row'>
              <Field
                name="resourceRequestCpu"
                label="CPU Request"
                component={FormikInput}
                className="form-control"
                groupClassName='col-md-6 pr-3'
                placeholder="CPU resource which your service need."
                required />
              <Field
                name="resourceRequestMemory"
                label="Memory Request"
                component={FormikInput}
                className="form-control"
                groupClassName='col-md-6'
                placeholder="Memory resource which your service need."
                required />
            </div>
            <div className='form-row'>
              <Field
                name="resourceLimitCpu"
                label="CPU Limit"
                component={FormikInput}
                className="form-control"
                groupClassName='col-md-6 pr-3'
                placeholder="Maximum CPU resource which your service need. Default is the same volume of 'CPU Request'" />
              <Field
                name="resourceLimitMemory"
                label="Memory Limit"
                component={FormikInput}
                className="form-control"
                groupClassName='col-md-6'
                placeholder="Maximum Memory resource which your service need. Default is the same volume of 'Memory Request'" />
            </div>
          </CardBody>
        </Card>

        <Card className='mb-3'>
          <CardBody>
            <CardTitle>HA Configuration</CardTitle>
            <div className='form-row'>
              <Field
                name="replicasDefault"
                label="Default Replicas"
                component={FormikInput}
                className="form-control"
                groupClassName='col-md-4 pr-3'
                placeholder="Number of service. If '3', '3' services are booted."
                required />
              <Field
                name="replicasMaximum"
                label="Maximum Replicas"
                component={FormikInput}
                className="form-control"
                groupClassName='col-md-4 pr-3'
                placeholder="Maximum number of service. Automatically scaled up to this number. Default is the same as 'Default'" />
              <Field
                name="replicasMinimum"
                label="Minimum Replicas"
                component={FormikInput}
                className="form-control"
                groupClassName='col-md-4'
                placeholder="Minimum number of service. Automatically scaled down to this number. Default is the same as 'Default'" />
              <Field
                name="autoscaleCpuThreshold"
                label="Auto-scalling Trigger (CPU Threshold)"
                component={FormikInput}
                className="form-control"
                groupClassName='col-md-4 pr-3'
                placeholder="CPU threshold for auto-scaling trigger. Default is '80'% of CPU usage." />
            </div>
          </CardBody>
        </Card>

        <Card className='mb-3'>
          <CardBody>
            <CardTitle>Deployment Strategy</CardTitle>
            <div className='form-row'>
              <Field
                name="policyMaxSurge"
                label="Max Surge"
                component={FormikInput}
                className="form-control"
                groupClassName='col-md-4 pr-3'
                placeholder="Maximum number of surged pod when rolling deploying. Default is 'ceil(0.25 * <Default Replicas>)'." />
              <Field
                name="policyMaxUnavailable"
                label="Max Unavailable"
                component={FormikInput}
                className="form-control"
                groupClassName='col-md-4 pr-3'
                placeholder="Maximum number of unavailable pod when rolling deploying. Default is 'floor(0.25 * <Default Replicas>)'." />
              <Field
                name="policyWaitSeconds"
                label="Wait Seconds"
                component={FormikInput}
                className="form-control"
                groupClassName='col-md-4'
                placeholder="Minimum wait seconds for booting your service. Recommendation is 'actual booting time' + 'margin'. Default is '300' seconds." />
            </div>
          </CardBody>
        </Card>
      </React.Fragment>
    )
  }
}

export const ServiceDeploymentDefaultInitialValues = {
  replicasDefault: 1,
  replicasMaximum: 1,
  replicasMinimum: 1,
  autoscaleCpuThreshold: 80,
  policyMaxSurge: 1,
  policyMaxUnavailable: 0,
  policyWaitSeconds: 300,
  containerImage: 'rekcurd/rekcurd:python-latest',
  serviceGitUrl: '',
  serviceGitBranch: '',
  serviceBootScript: '',
  resourceRequestCpu: 1,
  resourceRequestMemory: '512Mi',
  resourceLimitCpu: 1,
  resourceLimitMemory: '512Mi',
}

interface CustomProps {}

type ServiceDeploymentFormProps = CustomProps

export const ServiceDeploymentForm = connect(
  (state: any, extraProps: CustomProps) => ({
    ...extraProps,
  })
)(ServiceDeploymentFormImpl)
