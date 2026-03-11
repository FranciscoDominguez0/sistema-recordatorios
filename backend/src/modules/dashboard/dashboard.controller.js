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

  async getAll(req, res) {
    try {
      const [stats, servicesByStatus, clientsGrowth, weeklyActivity, upcomingServices, pendingTasks, topClients] =
        await Promise.all([
          dashboardService.getStats(),
          dashboardService.getServicesByStatus(),
          dashboardService.getClientsGrowth(),
          dashboardService.getWeeklyActivity(),
          dashboardService.getUpcomingServices(5),
          dashboardService.getPendingTasks(5),
          dashboardService.getTopClients(5),
        ]);

      return res.json({
        stats,
        services_by_status: servicesByStatus,
        clients_growth: clientsGrowth,
        weekly_activity: weeklyActivity,
        upcoming_services: upcomingServices,
        pending_tasks: pendingTasks,
        top_clients: topClients,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new DashboardController();
