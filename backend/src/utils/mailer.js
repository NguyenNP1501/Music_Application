const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    throw new Error("Chưa cấu hình SMTP để gửi email.");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

async function sendPasswordResetEmail(email, resetUrl) {
  const mailer = getTransporter();

  return mailer.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Đặt lại mật khẩu Music Space",
    text: `Bạn đã yêu cầu đặt lại mật khẩu Music Space.\n\nTruy cập liên kết sau trong vòng 15 phút:\n${resetUrl}\n\nNếu không phải bạn thực hiện yêu cầu này, hãy bỏ qua email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2>Đặt lại mật khẩu</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Music Space.</p>
        <p>Liên kết có hiệu lực trong <b>15 phút</b>.</p>
        <p><a href="${resetUrl}">Đặt lại mật khẩu</a></p>
        <p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
