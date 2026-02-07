import authService from '../services/auth.service.js';

/**
 * Controller xử lý các yêu cầu HTTP liên quan đến xác thực.
 */
class AuthController {
  // --- Rendering Methods ---

  renderLogin(req, res) {
    if (req.session.user) return res.redirect('/chat');
    res.render('pages/login', { title: 'Đăng nhập', error: null });
  }

  renderRegister(req, res) {
    if (req.session.user) return res.redirect('/chat');
    res.render('pages/register', { title: 'Đăng ký', error: null });
  }

  // --- Action Methods ---

  async login(req, res) {
    const { username, password } = req.body;
    try {
      const user = await authService.login(username, password);
      // Lưu thông tin cơ bản vào session
      req.session.user = {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role
      };
      res.redirect('/chat');
    } catch (error) {
      res.render('pages/login', { title: 'Đăng nhập', error: error.message });
    }
  }

  async register(req, res) {
    const { username, password, displayName } = req.body;
    try {
      await authService.register({ username, password, displayName });
      res.redirect('/login?msg=registered');
    } catch (error) {
      res.render('pages/register', { title: 'Đăng ký', error: error.message });
    }
  }

  logout(req, res) {
    req.session.destroy();
    res.redirect('/login');
  }
}

export default new AuthController();
