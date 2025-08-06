const { expect } = require('chai');
const ReqlineMessages = require('../messages/reqline');
const reqlineParser = require('../services/reqline/parser');
const reqlineExecutor = require('../services/reqline/executor');

describe('Reqline Parser Tests', () => {
  describe('Valid Reqline Syntax Tests', () => {
    it('should parse simple GET request with query', async () => {
      const reqlineStr = 'HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {"refid": 1920933}';

      const result = await reqlineParser.parseAndExecute({ reqline: reqlineStr });

      expect(result).to.have.property('request');
      expect(result).to.have.property('response');
      expect(result.request.full_url).to.equal('https://dummyjson.com/quotes/3?refid=1920933');
      expect(result.request.query).to.deep.equal({ refid: 1920933 });
      expect(result.request.body).to.deep.equal({});
      expect(result.request.headers).to.deep.equal({});
      expect(result.response.http_status).to.equal(200);
      expect(result.response).to.have.property('duration');
      expect(result.response).to.have.property('request_start_timestamp');
      expect(result.response).to.have.property('request_stop_timestamp');
      expect(result.response.response_data).to.have.property('id', 3);
      expect(result.response.response_data).to.have.property('quote');
      expect(result.response.response_data).to.have.property('author');
    });

    it('should parse POST request with headers and body', async () => {
      const reqlineStr =
        'HTTP POST | URL https://dummyjson.com/posts/add | ' +
        'HEADERS {"Content-Type": "application/json"} | ' +
        'BODY {"title": "Test Post", "body": "Test content", "userId": 1}';

      const result = await reqlineParser.parseAndExecute({ reqline: reqlineStr });

      expect(result.request.body).to.deep.equal({
        title: 'Test Post',
        body: 'Test content',
        userId: 1,
      });
      expect(result.request.headers).to.deep.equal({ 'Content-Type': 'application/json' });
      expect(result.response.http_status).to.equal(201);
      expect(result.response).to.have.property('duration');
      expect(result.response.response_data).to.have.property('id');
      expect(result.response.response_data).to.have.property('title', 'Test Post');
      expect(result.response.response_data).to.have.property('userId', 1);
    });
  });

  describe('Error Handling Tests', () => {
    it('should throw "Missing required HTTP keyword"', async () => {
      const reqlineStr = 'URL https://example.com';

      try {
        await reqlineParser.parseAndExecute({ reqline: reqlineStr });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal(ReqlineMessages.MISSING_HTTP_KEYWORD);
      }
    });

    it('should throw "Missing required URL keyword"', async () => {
      const reqlineStr = 'HTTP GET';

      try {
        await reqlineParser.parseAndExecute({ reqline: reqlineStr });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal(ReqlineMessages.MISSING_URL_KEYWORD);
      }
    });

    it('should throw "Invalid HTTP method. Only GET and POST are supported"', async () => {
      const reqlineStr = 'HTTP PUT | URL https://example.com';

      try {
        await reqlineParser.parseAndExecute({ reqline: reqlineStr });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal(ReqlineMessages.INVALID_HTTP_METHOD);
      }
    });

    it('should throw "HTTP method must be uppercase"', async () => {
      const reqlineStr = 'HTTP get | URL https://example.com';

      try {
        await reqlineParser.parseAndExecute({ reqline: reqlineStr });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal(ReqlineMessages.HTTP_METHOD_MUST_BE_UPPERCASE);
      }
    });

    it('should throw "Keywords must be uppercase"', async () => {
      const reqlineStr = 'http GET | URL https://example.com';

      try {
        await reqlineParser.parseAndExecute({ reqline: reqlineStr });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal(ReqlineMessages.KEYWORDS_MUST_BE_UPPERCASE);
      }
    });

    it('should throw "Invalid spacing around pipe delimiter"', async () => {
      const reqlineStr = 'HTTP GET |URL https://example.com';

      try {
        await reqlineParser.parseAndExecute({ reqline: reqlineStr });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal(ReqlineMessages.INVALID_SPACING_AROUND_PIPE);
      }
    });

    it('should throw "Invalid JSON format in HEADERS section"', async () => {
      const reqlineStr = 'HTTP GET | URL https://example.com | HEADERS {invalid json}';

      try {
        await reqlineParser.parseAndExecute({ reqline: reqlineStr });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal(ReqlineMessages.INVALID_JSON_FORMAT_HEADERS);
      }
    });

    it('should throw "Multiple spaces found where single space expected"', async () => {
      const reqlineStr = 'HTTP  GET | URL https://example.com';

      try {
        await reqlineParser.parseAndExecute({ reqline: reqlineStr });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal(ReqlineMessages.MULTIPLE_SPACES_FOUND);
      }
    });

    it('should throw "Missing space after keyword"', async () => {
      const reqlineStr = 'HTTP GET | URLhttps://example.com';

      try {
        await reqlineParser.parseAndExecute({ reqline: reqlineStr });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal(ReqlineMessages.MISSING_SPACE_AFTER_KEYWORD);
      }
    });
  });

  describe('Timing Tests', () => {
    it('should properly calculate request duration', async () => {
      const reqlineStr = 'HTTP GET | URL https://example.com';

      const result = await reqlineParser.parseAndExecute({ reqline: reqlineStr });

      expect(result.response.duration).to.be.a('number');
      expect(Number.isInteger(result.response.duration)).to.equal(true);
      expect(Number.isInteger(result.response.request_start_timestamp)).to.equal(true);
      expect(Number.isInteger(result.response.request_stop_timestamp)).to.equal(true);
      expect(result.response.request_stop_timestamp).to.be.greaterThan(
        result.response.request_start_timestamp
      );
    });
  });

  describe('URL Building Tests', () => {
    it('should append query parameters correctly', () => {
      const fullUrl = reqlineExecutor.buildFullUrl('https://example.com', { page: 1, limit: 10 });
      expect(fullUrl).to.equal('https://example.com?page=1&limit=10');
    });

    it('should handle empty query parameters', () => {
      const fullUrl = reqlineExecutor.buildFullUrl('https://example.com', {});
      expect(fullUrl).to.equal('https://example.com');
    });

    it('should handle existing query parameters in URL', () => {
      const fullUrl = reqlineExecutor.buildFullUrl('https://example.com?existing=true', {
        page: 1,
      });
      expect(fullUrl).to.equal('https://example.com?existing=true&page=1');
    });
  });
});
