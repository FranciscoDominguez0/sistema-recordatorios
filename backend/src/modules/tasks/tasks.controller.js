import tasksService from "./tasks.service.js";

class TasksController {
  async create(req, res) {
    try {
      const { title, description, due_date } = req.body ?? {};
      const task = await tasksService.create({ title, description, due_date });
      return res.status(201).json(task);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const tasks = await tasksService.getAll();
      return res.json(tasks);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getPending(req, res) {
    try {
      const tasks = await tasksService.getPending();
      return res.json(tasks);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const id = Number(req.params.id);
      const task = await tasksService.getById(id);

      if (!task) {
        return res.status(404).json({ message: "Tarea no encontrada" });
      }

      return res.json(task);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async complete(req, res) {
    try {
      const id = Number(req.params.id);
      const completed = await tasksService.complete(id);

      if (!completed) {
        return res.status(404).json({ message: "Tarea no encontrada" });
      }

      const task = await tasksService.getById(id);
      return res.json(task);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const id = Number(req.params.id);
      const deleted = await tasksService.delete(id);

      if (!deleted) {
        return res.status(404).json({ message: "Tarea no encontrada" });
      }

      return res.json({ message: "Tarea eliminada" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new TasksController();
