const HttpRequest = require('@app-core/http-request');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');

class ReqlineExecutor {
  async executeRequest(parsedRequest) {
    const startTimestamp = Date.now();

    try {
      // Build full URL with query parameters
      const fullUrl = this.buildFullUrl(parsedRequest.url, parsedRequest.query);

      // Prepare request configuration
      const requestConfig = {
        headers: parsedRequest.headers,
        timeout: 10000, // 10 second timeout
      };

      let response;

      // Execute request based on method
      if (parsedRequest.method === 'GET') {
        response = await HttpRequest.get(fullUrl, requestConfig);
      } else if (parsedRequest.method === 'POST') {
        response = await HttpRequest.post(fullUrl, parsedRequest.body, requestConfig);
      }

      const stopTimestamp = Date.now();
      const duration = stopTimestamp - startTimestamp;

      return {
        request: {
          query: parsedRequest.query,
          body: parsedRequest.body,
          headers: parsedRequest.headers,
          full_url: fullUrl,
        },
        response: {
          http_status: response.statusCode || response.status || 200,
          duration,
          request_start_timestamp: startTimestamp,
          request_stop_timestamp: stopTimestamp,
          response_data: response.data,
        },
      };
    } catch (error) {
      const stopTimestamp = Date.now();
      const duration = stopTimestamp - startTimestamp;

      // Handle HTTP errors
      if (error.response) {
        return {
          request: {
            query: parsedRequest.query,
            body: parsedRequest.body,
            headers: parsedRequest.headers,
            full_url: this.buildFullUrl(parsedRequest.url, parsedRequest.query),
          },
          response: {
            http_status: error.response.statusCode || error.response.status,
            duration,
            request_start_timestamp: startTimestamp,
            request_stop_timestamp: stopTimestamp,
            response_data: error.response.data || null,
          },
        };
      }

      // Re-throw other errors
      throwAppError(`Request execution failed: ${error.message}`, ERROR_CODE.APPERR);
    }
  }

  buildFullUrl(baseUrl, queryParams) {
    if (!queryParams || Object.keys(queryParams).length === 0) {
      return baseUrl;
    }

    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${queryString}`;
  }
}

module.exports = new ReqlineExecutor();
