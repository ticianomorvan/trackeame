export enum ResponseType {
    Success = "success",
    Error = "error",
}

export type CustomResponse<T = any> = SuccessfulResponse<T> | FailedResponse;

export interface GenericResponse {
    status: ResponseType;
    message: string;
}

export interface SuccessfulResponse<T = any> extends GenericResponse {
    status: ResponseType.Success;
    data: T;
}

export interface FailedResponse extends GenericResponse {
    status: ResponseType.Error;
}