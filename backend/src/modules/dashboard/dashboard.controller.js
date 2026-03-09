import dashboardService from "./dashboard.service.js";

class DashboardController {
  async getStats(req, res) {
    try {
      const stats = await dashboardService.getStats();
      return res.json(stats);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new DashboardController();
