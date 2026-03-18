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

  async cleanup(req, res) {
    try {
      const daysRaw = (req.body?.days ?? "").toString();
      const days = parseInt(daysRaw, 10);

      if (!Number.isFinite(days) || days <= 0) {
        return res.status(400).json({ message: "days debe ser un número mayor que 0" });
      }

      const result = await emailLogsService.cleanupOlderThanDays(days);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new EmailLogsController();
