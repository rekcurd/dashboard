/**
 * Core implementations for handling external APIs
 */

export const JWT_TOKEN_KEY = 'jwt_token';

export enum APIErrorType {
  unknown,
  serverside
}

/**
 * Exception class for handling API error
 *
 */
export class APIError implements Error {
  name = 'APIError';

  constructor(
    public message: string,
    public type: APIErrorType = APIErrorType.serverside,
    public status?: number
  ) {
  }

  toString() {
    return `${this.name} : ${this.message}`
  }
}

export enum APIRequestStatusList {
  notStarted,
  fetching,
  failure,
  success,
  unauhorized,
}

export interface APIStatusFailue {
  status: APIRequestStatusList.failure
  error: any
}

export interface APIStatusFetching {
  status: APIRequestStatusList.fetching
}

export interface APIStatusNotStarted {
  status: APIRequestStatusList.notStarted
}

export interface APIStatusSuccess<T> {
  status: APIRequestStatusList.success
  result: T
}

export interface APIStatusUnauthorized<T> {
  status: APIRequestStatusList.unauhorized
}

export function isAPISucceeded<T>(status: APIRequest<T>): status is APIStatusSuccess<T> {
  return status.status === APIRequestStatusList.success
}

export function isAPIFailed<T>(status: APIRequest<T>): status is APIStatusFailue {
  return status.status === APIRequestStatusList.failure
}

export function isAPIFetching<T>(status: APIRequest<T>): status is APIStatusFetching {
  return status.status === APIRequestStatusList.fetching
}

export function isAPINotStarted<T>(status: APIRequest<T>): status is APIStatusNotStarted {
  return status.status === APIRequestStatusList.notStarted
}

export function isAPIUnauthorized<T>(status: APIRequest<T>): status is APIStatusUnauthorized<T> {
  return status.status === APIRequestStatusList.unauhorized
}

export type APIRequest<T> = APIStatusFailue | APIStatusFetching | APIStatusNotStarted | APIStatusUnauthorized<T> | APIStatusSuccess<T>

export async function getRequest(
  entryPoint: string,
  convert: (response) => any = (response) => response
) {
  const options = {
    method: 'GET',
  };
  return rawRequest(entryPoint, convert, options)
}

export async function postJsonRequest(
  entryPoint: string,
  data: any,
  convert: (response) => any = (response) => response,
) {
  const options = {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  return rawRequest(entryPoint, convert, options)
}

export async function putJsonRequest(
  entryPoint: string,
  data: any,
  convert: (response) => any = (response) => response,
) {
  const options = {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  return rawRequest(entryPoint, convert, options)
}

export async function patchJsonRequest(
  entryPoint: string,
  data: any,
  convert: (response) => any = (response) => response,
) {
  const options = {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  return rawRequest(entryPoint, convert, options)
}

export async function deleteRequest(
  entryPoint: string,
  convert: (response) => any = (response) => response
) {
  const options = {
    method: 'DELETE',
  };
  return rawRequest(entryPoint, convert, options)
}

function snakelize(key) {
  const separator = '_'
  const split = /(?=[A-Z])/

  return key.split(split).join(separator).toLowerCase()
}

/**
 * Request to send data with formdata
 *
 * Pack parameters into {FormData} object.
 *
 * @param entryPoint {string} Entry point URI
 * @param params {any} Params for API
 * @param convert {function} Function to convert raw results
 *    to expected format
 */
export async function formDataRequest<T = any>(
  entryPoint: string,
  params: any,
  convert: (response) => any = (response) => response,
  method: string = 'POST'
) {
  // Append data as form data
  const formData = new FormData()
  Object.keys(params).forEach((key) => formData.append(snakelize(key), params[key]))

  const options = {
    method,
    body: formData
  }
  return rawRequest<T>(entryPoint, convert, options)
}

export async function rawRequest<T = any>(
  entryPoint: string,
  convert: (response) => any = (response) => response,
  options: RequestInit = {}
) {
  const fullOptions = {
    ...options
  }
  const token = window.localStorage.getItem(JWT_TOKEN_KEY)
  if (token) {
    fullOptions.headers = {
      ...fullOptions.headers,
      Authorization: `Bearer ${token}`
    }
  }

  return fetch(entryPoint, fullOptions)
    .then((response) => {
      return _handleAPIResponse<T>(response, convert)
    })
    .catch((error) => {
      if (error instanceof APIError) {
        throw error
      } else {
        throw new APIError(error.message)
      }
    })
}

/**
 *
 * Call multi API entrypoints concurrently
 *
 * @param entryPoints {string[]} Target API entrypoints
 * @param convert
 * @param requestList {any[]}
 */
export async function rawMultiRequest<T = any>(
  entryPoints: string[],
  convert: (response) => any = (response) => response,
  requestList: any[] = []
) {
  const generateRawRequest = (request) => (
    {
      ...request.options,
      body: generateFormData(request.params)
    }
  )
  const fullOptionsList = requestList.map(generateRawRequest)
  const token = window.localStorage.getItem(JWT_TOKEN_KEY)
  if (token) {
    fullOptionsList.map(
      (fullOptions) =>
        fullOptions.headers = {
          ...fullOptions.headers,
          Authorization: `Bearer ${token}`
        }
    )
  }
  return Promise.all(
    entryPoints.map(
      (entryPoint, i) => {
        return fetch(entryPoint, fullOptionsList[i])
          .then((response) => {
            return _handleAPIResponse<T>(response, convert)
          })
      }
    )
  )
  .catch((error) => { throw new APIError(error.message) })
}

function generateFormData(params) {
  const formData = new FormData()
  Object.keys(params || {}).forEach((key) => formData.append(snakelize(key), params[key]))

  return formData
}

function _handleAPIResponse<T = any>(
  response: Response,
  convert: (response) => T = (r) => r
): Promise<any> {
  if (response.ok) {
    return response.json()
      .then((resultJSON) => convert(resultJSON))
  }
  return new Promise((_, reject) => {
    response.json()
      .then((resultJSON) => {
        reject(new APIError(
          resultJSON.message,
          APIErrorType.serverside,
          response.status
        ))
      })
  })
}
