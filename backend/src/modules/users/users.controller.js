import usersService from "./users.service.js";

class UsersController {
  async getAll(req, res) {
    try {
      const { page, limit, search, include_pagination } = req.query ?? {};
      const result = await usersService.getAll({ page, limit, search });

      const wantsPagination =
        include_pagination === "1" ||
        include_pagination === "true" ||
        include_pagination === true;

      if (!wantsPagination) {
        return res.json(result.data);
      }

      const totalPages = Math.ceil((result.total ?? 0) / (result.limit || 10));

      return res.json({
        data: result.data,
        summary: result.summary,
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

  async create(req, res) {
    try {
      const { name, full_name, email, password, role, is_active, active, receive_notifications } = req.body ?? {};

      const user = await usersService.create({
        name: full_name ?? name,
        email,
        password,
        role,
        is_active: is_active ?? active,
        receive_notifications
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
      const { name, full_name, email, password, role, is_active, active, receive_notifications } = req.body ?? {};

      const user = await usersService.update(id, {
        name: full_name ?? name,
        email,
        password,
        role,
        is_active: is_active ?? active,
        receive_notifications
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
  async updateAvatar(req, res) {
    try {
      const { id } = req.params ?? {};
      const { avatar_base64 } = req.body ?? {};

      const user = await usersService.updateAvatar(id, avatar_base64);
      return res.json(user);
    } catch (error) {
      if (error?.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new UsersController();
