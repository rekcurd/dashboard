export enum role {
    viewer = 'viewer',
    editor = 'editor',
    owner  = 'owner'
}

export const apiConvert = (param) => {
    if (param === 'Role.viewer') {
        return role.viewer.toString()
    } else if (param === 'Role.editor') {
        return role.editor.toString()
    } else if (param === 'Role.owner') {
        return role.owner.toString()
    } else {
        return role.viewer.toString()
    }
}
