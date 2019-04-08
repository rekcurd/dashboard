import * as React from 'react'
import { connect } from 'react-redux'
import { Card, CardBody, Button } from 'reactstrap'

import * as Yup from "yup";
import { ErrorMessage, Field } from "formik";


export const ServiceDeploymentSchema = {
  replicasDefault: Yup.number()
    .required('Required')
    .positive()
    .integer(),
  replicasMaximum: Yup.number()
    .positive()
    .integer()
    .moreThan(Yup.ref('replicasDefault')),
  replicasMinimum: Yup.number()
    .positive()
    .integer()
    .lessThan(Yup.ref('replicasDefault')),
  autoscaleCpuThreshold: Yup.number()
    .positive()
    .integer()
    .min(0)
    .max(100),
  policyMaxSurge: Yup.number()
    .positive()
    .integer(),
  policyMaxUnavailable: Yup.number()
    .positive()
    .integer(),
  policyWaitSeconds: Yup.number()
    .positive()
    .integer()
    .max(86400),
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
    .positive()
    .integer(),
  resourceRequestMemory: Yup.string()
    .required('Required')
    .max(16),
  resourceLimitCpu: Yup.number()
    .positive()
    .integer(),
  resourceLimitMemory: Yup.string()
    .max(16)
}

class ServiceDeploymentFormImpl extends React.Component<ServiceDeploymentFormProps> {
  render() {
    const { errors, touched } = this.props

    return (
      <React.Fragment>
        <Card className='mb-3'>
          <CardBody>
            <Field name="containerImage" placeholder="Image location of Docker registry"/>
            {errors.containerImage && touched.containerImage ? (
              <div>{errors.containerImage}</div>
            ) : null}
            <ErrorMessage name="containerImage" />
            <Field name="serviceGitUrl" placeholder="URL of git repository of your Rekcurd application "/>
            {errors.serviceGitUrl && touched.serviceGitUrl ? (
              <div>{errors.serviceGitUrl}</div>
            ) : null}
            <ErrorMessage name="serviceGitUrl" />
            <Field name="serviceGitBranch" placeholder="Git branch name"/>
            {errors.serviceGitBranch && touched.serviceGitBranch ? (
              <div>{errors.serviceGitBranch}</div>
            ) : null}
            <ErrorMessage name="serviceGitBranch" />
            <Field name="serviceBootScript" placeholder="Script file name for booting."/>
            {errors.serviceBootScript && touched.serviceBootScript ? (
              <div>{errors.serviceBootScript}</div>
            ) : null}
            <ErrorMessage name="serviceBootScript" />
          </CardBody>
        </Card>

        <Card className='mb-3'>
          <CardBody>
            <Field name="resourceRequestCpu" placeholder="Request CPU limit."/>
            {errors.resourceRequestCpu && touched.resourceRequestCpu ? (
              <div>{errors.resourceRequestCpu}</div>
            ) : null}
            <ErrorMessage name="resourceRequestCpu" />
            <Field name="resourceRequestMemory" placeholder="Request memory limit."/>
            {errors.resourceRequestMemory && touched.resourceRequestMemory ? (
              <div>{errors.resourceRequestMemory}</div>
            ) : null}
            <ErrorMessage name="resourceRequestMemory" />
            <Field name="resourceLimitCpu" placeholder="Maximum CPU limit."/>
            {errors.resourceLimitCpu && touched.resourceLimitCpu ? (
              <div>{errors.resourceLimitCpu}</div>
            ) : null}
            <ErrorMessage name="resourceLimitCpu" />
            <Field name="resourceLimitMemory" placeholder="Maximum memory limit."/>
            {errors.resourceLimitMemory && touched.resourceLimitMemory ? (
              <div>{errors.resourceLimitMemory}</div>
            ) : null}
            <ErrorMessage name="resourceLimitMemory" />
          </CardBody>
        </Card>

        <Card className='mb-3'>
          <CardBody>
            <Field name="replicasDefault" placeholder="Initial number of replicas"/>
            {errors.replicasDefault && touched.replicasDefault ? (
              <div>{errors.replicasDefault}</div>
            ) : null}
            <ErrorMessage name="replicasDefault" />
            <Field name="replicasMaximum" placeholder="Maximum number of replicas"/>
            {errors.replicasMaximum && touched.replicasMaximum ? (
              <div>{errors.replicasMaximum}</div>
            ) : null}
            <ErrorMessage name="replicasMaximum" />
            <Field name="replicasMinimum" placeholder="Minimum number of replicas"/>
            {errors.replicasMinimum && touched.replicasMinimum ? (
              <div>{errors.replicasMinimum}</div>
            ) : null}
            <ErrorMessage name="replicasMinimum" />
          </CardBody>
        </Card>

        <Card className='mb-3'>
          <CardBody>
            <Field name="autoscaleCpuThreshold" placeholder="CPU threshold for auto-scaling trigger"/>
            {errors.autoscaleCpuThreshold && touched.autoscaleCpuThreshold ? (
              <div>{errors.autoscaleCpuThreshold}</div>
            ) : null}
            <ErrorMessage name="autoscaleCpuThreshold" />
            <Field name="policyMaxSurge" placeholder="Maximum number of serged pod when updating. Recommendation is 'ceil(0.25 * <replicas_default>)'."/>
            {errors.policyMaxSurge && touched.policyMaxSurge ? (
              <div>{errors.policyMaxSurge}</div>
            ) : null}
            <ErrorMessage name="policyMaxSurge" />
            <Field name="policyMaxUnavailable" placeholder="Maximum number of unavailable pod when updating. Recommendation is 'floor(0.25 * <replicas_default>)'."/>
            {errors.policyMaxUnavailable && touched.policyMaxUnavailable ? (
              <div>{errors.policyMaxUnavailable}</div>
            ) : null}
            <ErrorMessage name="policyMaxUnavailable" />
            <Field name="policyWaitSeconds" placeholder="Minimum wait seconds when deploying. Recommendation is 'actual boot time + margin time [second]'."/>
            {errors.policyWaitSeconds && touched.policyWaitSeconds ? (
              <div>{errors.policyWaitSeconds}</div>
            ) : null}
            <ErrorMessage name="policyWaitSeconds" />
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
  serviceGitUrl: null,
  serviceGitBranch: null,
  serviceBootScript: null,
  resourceRequestCpu: 1,
  resourceRequestMemory: '512Mi',
  resourceLimitCpu: 1,
  resourceLimitMemory: '512Mi',
}

interface CustomProps {
  errors
  touched
}

type ServiceDeploymentFormProps = CustomProps

export const ServiceDeploymentForm = connect(
  (state: any, extraProps: CustomProps) => ({
    ...state.form,
    ...extraProps,
  })
)(ServiceDeploymentFormImpl)
