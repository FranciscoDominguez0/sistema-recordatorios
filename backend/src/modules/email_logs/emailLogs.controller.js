import emailLogsService from "./emailLogs.service.js";

class EmailLogsController {
  async getLogs(req, res) {
    try {
      const { page = 1, limit = 10, search = "", status = "" } = req.query;
      const result = await emailLogsService.getLogs({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getSummary(req, res) {
    try {
      const summary = await emailLogsService.getSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new EmailLogsController();
