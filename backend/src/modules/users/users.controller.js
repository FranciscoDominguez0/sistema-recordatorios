import usersService from "./users.service.js";

class UsersController {
  async getAll(req, res) {
    try {
      const { search } = req.query ?? {};
      const users = await usersService.getAll({ search });
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async create(req, res) {
    try {
      const { name, full_name, email, password, role, is_active, active } = req.body ?? {};

      const user = await usersService.create({
        name: full_name ?? name,
        email,
        password,
        role,
        is_active: is_active ?? active
      });

      return res.status(201).json(user);
    } catch (error) {
      if (error?.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params ?? {};
      const { name, full_name, email, password, role, is_active, active } = req.body ?? {};

      const user = await usersService.update(id, {
        name: full_name ?? name,
        email,
        password,
        role,
        is_active: is_active ?? active
      });

      return res.json(user);
    } catch (error) {
      if (error?.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  async remove(req, res) {
    try {
      const { id } = req.params ?? {};
      await usersService.remove(id);
      return res.status(204).send();
    } catch (error) {
      if (error?.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new UsersController();
