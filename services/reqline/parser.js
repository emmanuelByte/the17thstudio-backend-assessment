const validator = require('@app-core/validator');
const reqlineValidator = require('./validator');
const reqlineExecutor = require('./executor');

class ReqlineParser {
  async parseAndExecute(requestData) {
    // Validate input structure
    const parsedSpec = validator.parse(`root{
      reqline is a required string
    }`);

    const data = validator.validate(requestData, parsedSpec);

    // Parse the reqline syntax
    const parsedRequest = reqlineValidator.parseReqlineSyntax(data.reqline);

    // Execute the parsed request
    const result = await reqlineExecutor.executeRequest(parsedRequest);

    return result;
  }
}

module.exports = new ReqlineParser();
