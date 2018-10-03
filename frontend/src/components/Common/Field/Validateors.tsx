/**
 * Validators for form fields (Used in Redux Form)
 */

/**
 * Check whether `value` is filled (e.g. text field)
 * @param value Value to be required
 */
export const required = (value) => (
    value !== undefined && value !== null && value !== ''
     ? undefined : 'Required'
)
export const nameFormat = (value) =>
    (value && !/^[\w-]+$/.test(value)
     ? 'Must be write in [0-9a-zA-Z_-]+' : undefined)
export const applicationNameFormat = nameFormat
const maxLength = max => value =>
  value && value.length > max ? `Must be ${max} characters or less` : undefined
export const maxLength20 = maxLength(20)
