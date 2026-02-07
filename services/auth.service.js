import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';

/**
 * Service xử lý các nghiệp vụ liên quan đến xác thực người dùng.
 */
class AuthService {
  /**
   * Đăng ký người dùng mới.
   * @param {Object} userData - Thông tin người dùng (username, password, display_name)
   * @returns {Promise<User>} Đối tượng User đã tạo
   */
  async register({ username, password, displayName }) {
    // Kiểm tra xem username đã tồn tại chưa
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new Error('Tên đăng nhập đã tồn tại');
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Tạo user mới
    const user = await User.create({
      username,
      password_hash: passwordHash,
      display_name: displayName
    });

    return user;
  }

  /**
   * Đăng nhập người dùng.
   * @param {string} username - Tên đăng nhập
   * @param {string} password - Mật khẩu
   * @returns {Promise<User>} Đối tượng User nếu thành công
   */
  async login(username, password) {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    return user;
  }

  /**
   * Tìm người dùng theo ID (Dùng cho Session/Middleware)
   * @param {string} id - ID người dùng
   * @returns {Promise<User>}
   */
  async findUserById(id) {
    return await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] }
    });
  }
}

export default new AuthService();
