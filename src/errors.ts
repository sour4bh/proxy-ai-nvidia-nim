export type OpenAIError = {
  error: {
    message: string;
    type: string;
    code: string;
    param: string | null;
  };
};

export function openaiError(
  message: string,
  type: string,
  code: string,
  param: string | null = null,
): OpenAIError {
  return { error: { message, type, code, param } };
}

export const errors = {
  invalidApiKey: () =>
    openaiError("Invalid API key.", "invalid_request_error", "invalid_api_key"),
  invalidRequest: (message: string, param?: string) =>
    openaiError(message, "invalid_request_error", "invalid_request", param ?? null),
  queueTimeout: (waitedMs: number) =>
    openaiError(
      `Request timed out in proxy queue after ${waitedMs}ms.`,
      "rate_limit_exceeded",
      "queue_timeout",
    ),
  upstreamRateLimit: () =>
    openaiError(
      "Upstream rate limit (NVIDIA NIM 40 RPM) exceeded.",
      "rate_limit_exceeded",
      "upstream_rate_limit",
    ),
  upstreamUnavailable: (message: string) =>
    openaiError(message, "upstream_error", "upstream_unavailable"),
  upstreamTimeout: (timeoutMs: number) =>
    openaiError(
      `Upstream did not respond within ${timeoutMs}ms.`,
      "upstream_error",
      "upstream_timeout",
    ),
  notImplemented: (path: string) =>
    openaiError(
      `${path} is not supported by this proxy.`,
      "not_implemented",
      "endpoint_not_supported",
    ),
  notFound: (path: string) =>
    openaiError(`Unknown endpoint ${path}.`, "not_found", "unknown_endpoint"),
  clientAborted: () =>
    openaiError("Request aborted by client.", "client_error", "client_aborted"),
};
