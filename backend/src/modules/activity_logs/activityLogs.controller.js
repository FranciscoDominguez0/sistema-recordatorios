import activityLogsService from "./activityLogs.service.js";

class ActivityLogsController {
  async getLogs(req, res) {
    try {
      const { page, limit, user_id, action, entity_type, entity_id, date_from, date_to } = req.query ?? {};
      const result = await activityLogsService.getLogs({
        page,
        limit,
        user_id,
        action,
        entity_type,
        entity_id,
        date_from,
        date_to
      });

      const totalPages = Math.ceil(result.total / result.limit);

      return res.json({
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          total_pages: totalPages
        }
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async dashboard(req, res) {
    try {
      const stats = await activityLogsService.getDashboardStats();
      return res.json(stats);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
  async chart(req, res) {
    try {
      const { days } = req.query ?? {};
      const data = await activityLogsService.getActivityChart(days);
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getActionTypes(req, res) {
    try {
      const types = await activityLogsService.getActionTypes();
      return res.json(types);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new ActivityLogsController();
