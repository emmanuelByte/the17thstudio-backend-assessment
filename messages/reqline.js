const ReqlineMessages = {
  MISSING_HTTP_KEYWORD: 'Missing required HTTP keyword',
  MISSING_URL_KEYWORD: 'Missing required URL keyword',
  INVALID_HTTP_METHOD: 'Invalid HTTP method. Only GET and POST are supported',
  HTTP_METHOD_MUST_BE_UPPERCASE: 'HTTP method must be uppercase',
  KEYWORDS_MUST_BE_UPPERCASE: 'Keywords must be uppercase',
  MISSING_SPACE_AFTER_KEYWORD: 'Missing space after keyword',
  MULTIPLE_SPACES_FOUND: 'Multiple spaces found where single space expected',
  INVALID_SPACING_AROUND_PIPE: 'Invalid spacing around pipe delimiter',
  INVALID_JSON_FORMAT_HEADERS: 'Invalid JSON format in HEADERS section',
  INVALID_JSON_FORMAT_QUERY: 'Invalid JSON format in QUERY section',
  INVALID_JSON_FORMAT_BODY: 'Invalid JSON format in BODY section',
  EMPTY_REQLINE: 'Reqline string cannot be empty',
  HTTP_MUST_BE_FIRST: 'HTTP keyword must be first',
  URL_MUST_BE_SECOND: 'URL keyword must be second',
  DUPLICATE_HTTP_KEYWORD: 'HTTP keyword can only appear once',
  DUPLICATE_URL_KEYWORD: 'URL keyword can only appear once',
  INVALID_URL_FORMAT: 'Invalid URL format',
  UNKNOWN_KEYWORD: 'Unknown keyword found',
  MISSING_PIPE_DELIMITER: 'Missing pipe delimiter',
};

module.exports = ReqlineMessages;
