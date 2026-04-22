namespace Ludo.Api.Common;

public enum OperationStatus
{
    Success,
    NotFound,
    BadRequest
}

public record OperationResult<T>(OperationStatus Status, T? Data, string? Error)
{
    public bool IsSuccess => Status == OperationStatus.Success;

    public static OperationResult<T> Ok(T data) => new(OperationStatus.Success, data, null);
    public static OperationResult<T> NotFound(string error) => new(OperationStatus.NotFound, default, error);
    public static OperationResult<T> BadRequest(string error) => new(OperationStatus.BadRequest, default, error);
}
