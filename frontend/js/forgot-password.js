document.addEventListener("DOMContentLoaded", () => {
    const stepEmail = document.getElementById("step-email");
    const stepOtp = document.getElementById("step-otp");
    const stepPassword = document.getElementById("step-password");
    const messageBox = document.getElementById("message-box");
    const messageText = messageBox.querySelector(".message-text");

    let savedEmail = "";
    let savedOtp = "";

    // Hàm tiện ích hiển thị thông báo lỗi/thành công
    function showMessage(text, isSuccess = false) {
        messageBox.classList.remove("hidden", "alert-danger", "alert-success");
        messageBox.classList.add(isSuccess ? "alert-success" : "alert-danger");
        messageText.textContent = text;
    }

    // BƯỚC 1: GỬI EMAIL NHẬN OTP
    document.getElementById("formEmail").addEventListener("submit", async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById("email").value.trim();

        if (!emailInput) return showMessage("Vui lòng nhập Email!");

        try {
            // Thay đổi URL API thực tế của bạn tại đây hoặc gọi từ js/api.js
            // const response = await API.sendOTP(emailInput);
            
            savedEmail = emailInput; // Lưu lại email để dùng cho bước sau
            showMessage("Mã OTP đã được gửi! Vui lòng kiểm tra hòm thư.", true);
            
            // Chuyển sang Bước 2
            stepEmail.classList.add("hidden");
            stepOtp.classList.remove("hidden");
        } catch (error) {
            showMessage("Có lỗi xảy ra hoặc Email không tồn tại trên hệ thống!");
        }
    });

    // BƯỚC 2: XÁC THỰC OTP
    document.getElementById("formOTP").addEventListener("submit", async (e) => {
        e.preventDefault();
        const otpInput = document.getElementById("otp").value.trim();

        if (otpInput.length !== 6) return showMessage("Mã OTP phải gồm 6 chữ số!");

        try {
            // Gọi API kiểm tra OTP (Thay bằng hàm thực tế của bạn)
            // const response = await API.verifyOTP(savedEmail, otpInput);
            
            savedOtp = otpInput; // Lưu lại OTP để dùng cho bước cuối
            showMessage("Xác thực thành công! Vui lòng nhập mật khẩu mới.", true);
            
            // Chuyển sang Bước 3
            stepOtp.classList.add("hidden");
            stepPassword.classList.remove("hidden");
        } catch (error) {
            showMessage("Mã OTP không chính xác hoặc đã hết hạn!");
        }
    });

    // BƯỚC 3: ĐỔI MẬT KHẨU MỚI
    document.getElementById("formNewPassword").addEventListener("submit", async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword.length < 6) return showMessage("Mật khẩu phải từ 6 ký tự trở lên!");
        if (newPassword !== confirmPassword) return showMessage("Mật khẩu xác nhận không trùng khớp!");

        try {
            // Gọi API đặt lại mật khẩu (Thay bằng hàm thực tế của bạn)
            // const response = await API.resetPassword(savedEmail, savedOtp, newPassword);
            
            showMessage("Đổi mật khẩu thành công! Hệ thống sẽ chuyển về trang đăng nhập sau 3 giây...", true);
            
            setTimeout(() => {
                window.location.href = "index.html";
            }, 3000);
        } catch (error) {
            showMessage("Đặt lại mật khẩu thất bại. Vui lòng thử lại!");
        }
    });
});
