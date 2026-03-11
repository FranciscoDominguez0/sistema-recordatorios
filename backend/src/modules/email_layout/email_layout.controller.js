import emailLayoutService from "./email_layout.service.js";

class EmailLayoutController {
  async get(req, res) {
    try {
      const layout = await emailLayoutService.get();
      return res.json(layout);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { header_html, footer_html, max_width } = req.body ?? {};
      await emailLayoutService.update({ header_html, footer_html, max_width });
      const layout = await emailLayoutService.get();
      return res.json(layout);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new EmailLayoutController();
