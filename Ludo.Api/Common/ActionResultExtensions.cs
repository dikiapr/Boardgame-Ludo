using Microsoft.AspNetCore.Mvc;

namespace Ludo.Api.Common;

public static class ActionResultExtensions
{
    public static ActionResult<T> ToActionResult<T>(this OperationResult<T> result)
    {
        return result.Status switch
        {
            OperationStatus.Success => new OkObjectResult(result.Data),
            OperationStatus.NotFound => new NotFoundObjectResult(result.Error),
            OperationStatus.BadRequest => new BadRequestObjectResult(result.Error),
            _ => throw new InvalidOperationException($"Unknown OperationStatus: {result.Status}")
        };
    }
}
