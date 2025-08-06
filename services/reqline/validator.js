const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const ReqlineMessages = require('@app-core/messages/reqline');

class ReqlineValidator {
  parseReqlineSyntax(reqlineString) {
    // Remove leading/trailing whitespace
    const cleaned = reqlineString.trim();

    if (!cleaned) {
      throwAppError(ReqlineMessages.EMPTY_REQLINE, ERROR_CODE.VALIDATIONERR);
    }

    // Split by pipe delimiter (this will also check for missing keywords)
    const segments = this.splitByPipe(cleaned);

    // Validate and parse each segment
    const parsedRequest = this.parseSegments(segments);

    return parsedRequest;
  }

  splitByPipe(str) {
    // For strings without pipes, we'll process them as single segments
    // but first check if they have the required keywords
    if (!str.includes('|')) {
      // Check if this is a case where we're missing required keywords
      // Check for keywords as separate words (not substrings)
      const words = str.split(' ');
      const hasHttpKeyword = words.includes('HTTP') || words.includes('http');
      const hasUrlKeyword = words.includes('URL') || words.includes('url');

      if (!hasHttpKeyword) {
        throwAppError(ReqlineMessages.MISSING_HTTP_KEYWORD, ERROR_CODE.VALIDATIONERR);
      }

      if (!hasUrlKeyword) {
        throwAppError(ReqlineMessages.MISSING_URL_KEYWORD, ERROR_CODE.VALIDATIONERR);
      }

      // If we have both keywords but no pipe, that's a pipe delimiter error
      throwAppError(ReqlineMessages.MISSING_PIPE_DELIMITER, ERROR_CODE.VALIDATIONERR);
    }

    // Split by pipe and validate spacing
    const segments = str.split('|');

    segments.forEach((segment, index) => {
      // Check for proper spacing around pipes
      if (index > 0 && !segment.startsWith(' ')) {
        throwAppError(ReqlineMessages.INVALID_SPACING_AROUND_PIPE, ERROR_CODE.VALIDATIONERR);
      }
      if (index < segments.length - 1 && !segment.endsWith(' ')) {
        throwAppError(ReqlineMessages.INVALID_SPACING_AROUND_PIPE, ERROR_CODE.VALIDATIONERR);
      }
    });

    return segments.map((seg) => seg.trim());
  }

  parseSegments(segments) {
    const result = {
      method: null,
      url: null,
      headers: {},
      query: {},
      body: {},
    };

    let httpFound = false;
    let urlFound = false;

    segments.forEach((segment, index) => {
      if (!segment) {
        throwAppError(ReqlineMessages.INVALID_SPACING_AROUND_PIPE, ERROR_CODE.VALIDATIONERR);
      }

      const parts = this.parseSegmentParts(segment);

      switch (parts.keyword) {
        case 'HTTP':
          if (httpFound) {
            throwAppError(ReqlineMessages.DUPLICATE_HTTP_KEYWORD, ERROR_CODE.VALIDATIONERR);
          }
          if (index !== 0) {
            throwAppError(ReqlineMessages.HTTP_MUST_BE_FIRST, ERROR_CODE.VALIDATIONERR);
          }
          this.validateHttpMethod(parts.value);
          result.method = parts.value;
          httpFound = true;
          break;

        case 'URL':
          if (urlFound) {
            throwAppError(ReqlineMessages.DUPLICATE_URL_KEYWORD, ERROR_CODE.VALIDATIONERR);
          }
          if (index !== 1) {
            throwAppError(ReqlineMessages.URL_MUST_BE_SECOND, ERROR_CODE.VALIDATIONERR);
          }
          this.validateUrl(parts.value);
          result.url = parts.value;
          urlFound = true;
          break;

        case 'HEADERS':
          result.headers = this.parseJsonValue(parts.value, 'HEADERS');
          break;

        case 'QUERY':
          result.query = this.parseJsonValue(parts.value, 'QUERY');
          break;

        case 'BODY':
          result.body = this.parseJsonValue(parts.value, 'BODY');
          break;

        default:
          throwAppError(ReqlineMessages.UNKNOWN_KEYWORD, ERROR_CODE.VALIDATIONERR);
      }
    });

    // Validate required fields
    if (!httpFound) {
      throwAppError(ReqlineMessages.MISSING_HTTP_KEYWORD, ERROR_CODE.VALIDATIONERR);
    }
    if (!urlFound) {
      throwAppError(ReqlineMessages.MISSING_URL_KEYWORD, ERROR_CODE.VALIDATIONERR);
    }

    return result;
  }

  parseSegmentParts(segment) {
    // Find the first space to separate keyword from value
    const spaceIndex = segment.indexOf(' ');

    if (spaceIndex === -1) {
      throwAppError(ReqlineMessages.MISSING_SPACE_AFTER_KEYWORD, ERROR_CODE.VALIDATIONERR);
    }

    const keyword = segment.substring(0, spaceIndex);
    const value = segment.substring(spaceIndex + 1);

    // Validate keyword is uppercase
    if (keyword !== keyword.toUpperCase()) {
      throwAppError(ReqlineMessages.KEYWORDS_MUST_BE_UPPERCASE, ERROR_CODE.VALIDATIONERR);
    }

    // Check for multiple spaces (looking for double spaces)
    if (segment.indexOf('  ') !== -1) {
      throwAppError(ReqlineMessages.MULTIPLE_SPACES_FOUND, ERROR_CODE.VALIDATIONERR);
    }

    return { keyword, value };
  }

  validateHttpMethod(method) {
    // Check if method is uppercase first
    if (method !== method.toUpperCase()) {
      throwAppError(ReqlineMessages.HTTP_METHOD_MUST_BE_UPPERCASE, ERROR_CODE.VALIDATIONERR);
    }

    if (!['GET', 'POST'].includes(method)) {
      throwAppError(ReqlineMessages.INVALID_HTTP_METHOD, ERROR_CODE.VALIDATIONERR);
    }
  }

  validateUrl(url) {
    // Simple URL validation compatible with Node.js 8 - NO REGEX
    if (!url || typeof url !== 'string') {
      throwAppError(ReqlineMessages.INVALID_URL_FORMAT, ERROR_CODE.VALIDATIONERR);
    }

    // Basic URL format check using string methods only
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throwAppError(ReqlineMessages.INVALID_URL_FORMAT, ERROR_CODE.VALIDATIONERR);
    }

    // Check for basic URL structure - must have something after protocol
    const protocolEndIndex = url.indexOf('://');
    if (protocolEndIndex === -1 || url.length <= protocolEndIndex + 3) {
      throwAppError(ReqlineMessages.INVALID_URL_FORMAT, ERROR_CODE.VALIDATIONERR);
    }
  }

  parseJsonValue(value, fieldName) {
    try {
      return JSON.parse(value);
    } catch (error) {
      const errorKey = `INVALID_JSON_FORMAT_${fieldName}`;
      throwAppError(ReqlineMessages[errorKey], ERROR_CODE.VALIDATIONERR);
    }
  }
}

module.exports = new ReqlineValidator();
