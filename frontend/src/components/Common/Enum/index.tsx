export enum serviceLevel {
    development = 'development',
    beta = 'beta',
    staging = 'staging',
    sandbox = 'sandbox',
    production = 'production'
}

export enum dataServerMode {
    local = 'local',
    ceph_s3  = 'ceph_s3',
    aws_s3  = 'aws_s3'
}

export enum projectRole {
    member = 'member',
    admin  = 'admin'
}

export enum applicationRole {
    viewer = 'viewer',
    editor = 'editor',
    admin  = 'admin'
}

export const apiConvertDataServerMode = (param) => {
    if (param === 'DataServerModeEnum.LOCAL') {
        return dataServerMode.local.toString()
    } else if (param === 'DataServerModeEnum.CEPH_S3') {
        return dataServerMode.ceph_s3.toString()
    } else if (param === 'DataServerModeEnum.AWS_S3') {
        return dataServerMode.aws_s3.toString()
    } else {
        return false
    }
};

export const apiConvertProjectRole = (param) => {
    if (param === 'ProjectRole.member') {
        return projectRole.member.toString()
    } else if (param === 'ProjectRole.admin') {
        return projectRole.admin.toString()
    } else {
        return false
    }
};

export const apiConvertApplicationRole = (param) => {
    if (param === 'ApplicationRole.admin') {
        return applicationRole.admin.toString()
    } else if (param === 'ApplicationRole.editor') {
        return applicationRole.editor.toString()
    } else {
        return applicationRole.viewer.toString()
    }
};
