# Reqline Parser API Documentation

## Overview

The Reqline Parser is a curl-like tool that parses HTTP request syntax and executes external requests. It provides a simple, pipe-delimited syntax for making HTTP requests with support for headers, query parameters, and request bodies.

## Base URL

```
http://localhost:8811
```

## Endpoint

### POST /reqline

Parse and execute a reqline statement.

#### Request

**URL:** `/reqline`  
**Method:** `POST`  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "reqline": "HTTP [method] | URL [url] | HEADERS [headers_json] | QUERY [query_json] | BODY [body_json]"
}
```

#### Reqline Syntax

```
HTTP [method] | URL [URL value] | HEADERS [header json value] | QUERY [query value json] | BODY [body value json]
```

**Syntax Rules:**
- All keywords must be UPPERCASE: `HTTP`, `URL`, `HEADERS`, `QUERY`, `BODY`
- Single pipe delimiter: `|`
- Exactly one space on each side of keywords and delimiters
- HTTP methods: `GET` or `POST` only (uppercase)
- `HTTP` and `URL` are required and must be in that order
- Other keywords (`HEADERS`, `QUERY`, `BODY`) can appear in any order or be omitted

#### Examples

**Simple GET request:**
```json
{
  "reqline": "HTTP GET | URL https://dummyjson.com/quotes/1"
}
```

**GET request with query parameters:**
```json
{
  "reqline": "HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {\"refid\": 1920933}"
}
```

**POST request with headers and body:**
```json
{
  "reqline": "HTTP POST | URL https://dummyjson.com/posts/add | HEADERS {\"Content-Type\": \"application/json\"} | BODY {\"title\": \"My Post\", \"body\": \"Post content\", \"userId\": 1}"
}
```

**Complex request with all parameters:**
```json
{
  "reqline": "HTTP POST | URL https://api.example.com/users | HEADERS {\"Authorization\": \"Bearer token123\", \"Content-Type\": \"application/json\"} | QUERY {\"include\": \"profile\"} | BODY {\"name\": \"John Doe\", \"email\": \"john@example.com\"}"
}
```

#### Response

**Success Response (HTTP 200):**
```json
{
  "request": {
    "query": {"refid": 1920933},
    "body": {},
    "headers": {},
    "full_url": "https://dummyjson.com/quotes/3?refid=1920933"
  },
  "response": {
    "http_status": 200,
    "duration": 347,
    "request_start_timestamp": 1691234567890,
    "request_stop_timestamp": 1691234568237,
    "response_data": {
      "id": 3,
      "quote": "Thinking is the capital, Enterprise is the way, Hard Work is the solution.",
      "author": "Abdul Kalam"
    }
  }
}
```

**Response Fields:**
- `request.query`: Parsed query parameters object
- `request.body`: Parsed request body object
- `request.headers`: Parsed headers object
- `request.full_url`: Complete URL with query parameters appended
- `response.http_status`: HTTP status code from the external request
- `response.duration`: Request duration in milliseconds (integer)
- `response.request_start_timestamp`: Start timestamp in milliseconds
- `response.request_stop_timestamp`: End timestamp in milliseconds
- `response.response_data`: The actual response data from the external API

#### Error Responses

**Validation Error (HTTP 400):**
```json
{
  "error": true,
  "message": "Missing required HTTP keyword"
}
```

**Common Error Messages:**
- `"Missing required HTTP keyword"`
- `"Missing required URL keyword"`
- `"Invalid HTTP method. Only GET and POST are supported"`
- `"HTTP method must be uppercase"`
- `"Keywords must be uppercase"`
- `"Missing space after keyword"`
- `"Multiple spaces found where single space expected"`
- `"Invalid spacing around pipe delimiter"`
- `"Invalid JSON format in HEADERS section"`
- `"Invalid JSON format in QUERY section"`
- `"Invalid JSON format in BODY section"`

## Usage Examples

### Using curl

**Simple GET request:**
```bash
curl -X POST http://localhost:8811/reqline \
  -H "Content-Type: application/json" \
  -d '{
    "reqline": "HTTP GET | URL https://dummyjson.com/quotes/1"
  }'
```

**POST request with data:**
```bash
curl -X POST http://localhost:8811/reqline \
  -H "Content-Type: application/json" \
  -d '{
    "reqline": "HTTP POST | URL https://dummyjson.com/posts/add | HEADERS {\"Content-Type\": \"application/json\"} | BODY {\"title\": \"Test Post\", \"body\": \"This is a test\", \"userId\": 1}"
  }'
```

### Using JavaScript fetch

```javascript
const response = await fetch('http://localhost:8811/reqline', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reqline: 'HTTP GET | URL https://dummyjson.com/quotes/1'
  })
});

const result = await response.json();
console.log(result);
```

### Using Python requests

```python
import requests
import json

url = "http://localhost:8811/reqline"
payload = {
    "reqline": "HTTP GET | URL https://dummyjson.com/quotes/1"
}

response = requests.post(url, json=payload)
result = response.json()
print(json.dumps(result, indent=2))
```

## Supported HTTP Methods

- **GET**: Retrieve data from the specified URL
- **POST**: Send data to the specified URL

## JSON Format Requirements

All JSON values in `HEADERS`, `QUERY`, and `BODY` sections must be valid JSON:

**Valid JSON examples:**
```json
{"key": "value"}
{"number": 123}
{"boolean": true}
{"array": [1, 2, 3]}
{"nested": {"key": "value"}}
```

**Invalid JSON examples:**
```
{key: "value"}        // Missing quotes around key
{'key': 'value'}      // Single quotes not allowed
{key: value}          // Missing quotes
```

## Rate Limiting

No rate limiting is currently implemented. The parser will make requests as fast as they are received.

## Error Handling

The parser performs comprehensive validation:

1. **Syntax Validation**: Checks reqline format and structure
2. **Keyword Validation**: Ensures proper case and positioning
3. **JSON Validation**: Validates all JSON parameters
4. **HTTP Method Validation**: Ensures only GET/POST are used
5. **URL Validation**: Checks URL format validity

## Implementation Notes

- **No Regex**: The parser uses only string manipulation methods (`split()`, `indexOf()`, `substring()`)
- **Exact Spacing**: Requires exactly one space before and after pipe delimiters
- **Case Sensitive**: All keywords must be uppercase
- **Order Sensitive**: HTTP must be first, URL must be second
- **Timing Precision**: Duration measured in whole milliseconds (no decimals)

## Architecture

The reqline parser follows a clean MVC architecture:

- **Endpoint**: `endpoints/reqline/parse.js` - HTTP request handler
- **Parser Service**: `services/reqline/parser.js` - Main orchestration
- **Validator Service**: `services/reqline/validator.js` - Syntax validation
- **Executor Service**: `services/reqline/executor.js` - HTTP request execution
- **Messages**: `@app-core/messages/reqline.js` - Centralized error messages

## Testing

The API includes comprehensive test coverage:

- ✅ Valid syntax parsing
- ✅ Error condition handling  
- ✅ Real HTTP request execution
- ✅ Timing measurement validation
- ✅ URL building with query parameters

Run tests with:
```bash
yarn test
```

## Dependencies

- **Express.js**: Web framework
- **Axios**: HTTP client (via @app-core/http-request)
- **@app-core modules**: Custom utility libraries
- **MongoDB/Mongoose**: Database integration

---

*This API is part of the Resilience17 Backend Assessment - Reqline Parser Implementation*
