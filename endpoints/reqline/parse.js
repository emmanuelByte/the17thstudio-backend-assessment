const { createHandler } = require('@app-core/server');
const parseReqlineService = require('../../services/reqline/parser');

module.exports = createHandler({
  path: '/',
  method: 'post',
  async handler(rc, helpers) {
    try {
      const result = await parseReqlineService.parseAndExecute(rc.body);
      return {
        status: helpers.http_statuses.OK,
        data: result,
      };
    } catch (error) {
      return {
        status: helpers.http_statuses.BAD_REQUEST,
        data: {
          error: true,
          message: error.message,
        },
      };
    }
  },
});
