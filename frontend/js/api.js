/* ============================================================================
 *  EduFee - LỚP GỌI API DÙNG CHUNG (thay cho localStorage giả lập)
 *  Đặt file này tại frontend/js/api.js và nạp TRƯỚC mọi file js khác.
 *  Dùng: EduFeeAPI.get('/students'), EduFeeAPI.post('/auth/login', {...})
 * ========================================================================== */
const EduFeeAPI = (() => {
    // Đổi nếu backend chạy cổng/địa chỉ khác
    const BASE_URL = 'http://localhost:3000/api';
  
    const TOKEN_KEY = 'edufee_token';
    const USER_KEY = 'edufee_user';
  
    // ----- Quản lý phiên -----
    const getToken = () => localStorage.getItem(TOKEN_KEY);
    const getUser = () => {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    };
    const saveSession = (token, user) => {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    };
    const clearSession = () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    };
  
    // Tính đường dẫn trang đăng nhập tương đối theo độ sâu trang hiện tại
    const loginPath = () =>
      location.pathname.includes('/pages/') ? '../../index.html' : 'index.html';
  
    // ----- Hàm gọi API lõi -----
    async function request(method, path, body) {
      const headers = { 'Content-Type': 'application/json' };
      const token = getToken();
      if (token) headers['Authorization'] = 'Bearer ' + token;
  
      let res;
      try {
        res = await fetch(BASE_URL + path, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch (e) {
        throw new Error('Không kết nối được máy chủ. Hãy chắc backend đang chạy.');
      }
  
      // Token hết hạn / không hợp lệ -> về trang đăng nhập
      if (res.status === 401 && !path.startsWith('/auth/login')) {
        clearSession();
        window.location.href = loginPath();
        throw new Error('Phiên đăng nhập đã hết hạn.');
      }
  
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Đã xảy ra lỗi (' + res.status + ').');
      }
      return json.data;
    }
  
    // ----- API tiện dụng -----
    const get = (path) => request('GET', path);
    const post = (path, body) => request('POST', path, body);
    const put = (path, body) => request('PUT', path, body);
    const del = (path) => request('DELETE', path);
  
    async function login(TenDangNhap, MatKhau) {
      const data = await post('/auth/login', { TenDangNhap, MatKhau });
      saveSession(data.token, data.user);
      return data.user;
    }
    function logout() {
      clearSession();
      window.location.href = loginPath();
    }
  
    return { BASE_URL, get, post, put, del, login, logout, getToken, getUser, clearSession, loginPath };
  })();
  
  window.EduFeeAPI = EduFeeAPI;
  