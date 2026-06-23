import nodemailer from "nodemailer";

export async function sendEmailNotification(data: {
  eventName: string;
  fullName: string;
  phone: string;
  telegram: string;
  orderId: string;
}) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.warn("SMTP credentials not configured, skipping email notification");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: true, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"РРК Уведомления" <${SMTP_USER}>`,
    to: "hello.rrc@proton.me",
    subject: `Новая оплата: ${data.eventName}`,
    text: `
🎉 Новая запись!

Событие: ${data.eventName}

Участник:
Имя: ${data.fullName}
Телефон: ${data.phone}
Telegram: ${data.telegram}

Номер заказа: ${data.orderId}
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email notification sent successfully to hello.rrc@proton.me");
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
}
