import nodemailer from "nodemailer";

export async function sendEmailNotification(data: {
  eventName: string;
  fullName: string;
  phone: string;
  telegram: string;
  orderId: string;
  participants?: Array<{
    fullName: string;
    phone?: string;
    telegram?: string;
  }>;
}) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.warn("[email] SMTP credentials not configured — admin notification skipped", {
      orderId: data.orderId,
      eventName: data.eventName,
    });
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

  const participantLines = (data.participants?.length ? data.participants : [{
    fullName: data.fullName,
    phone: data.phone,
    telegram: data.telegram,
  }]).map((participant, index) => [
    `Участник ${index + 1}:`,
    `Имя: ${participant.fullName}`,
    participant.phone ? `Телефон: ${participant.phone}` : null,
    participant.telegram ? `Telegram: ${participant.telegram}` : null,
  ].filter(Boolean).join("\n")).join("\n\n");

  const mailOptions = {
    from: `"РРК Уведомления" <${SMTP_USER}>`,
    to: "hello.rrc@proton.me",
    subject: `Новая оплата: ${data.eventName}`,
    text: `
🎉 Новая запись!

Событие: ${data.eventName}

${participantLines}

Плательщик:
Имя: ${data.fullName}
Телефон: ${data.phone}
Telegram: ${data.telegram}

Номер заказа: ${data.orderId}
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("[email] Admin notification sent", {
      to: "hello.rrc@proton.me",
      orderId: data.orderId,
      eventName: data.eventName,
    });
  } catch (error) {
    console.error("[email] Failed to send admin notification", {
      orderId: data.orderId,
      eventName: data.eventName,
      error,
    });
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPurchaseMessageHtml(message: string) {
  const formatted = escapeHtml(message)
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s>])\*([^*\n]+)\*(?=[\s<]|$)/g, "$1<em>$2</em>")
    .replace(/\n/g, "<br>");

  return `
    <div style="margin:0;padding:24px;background:#f4efe8;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px 26px;color:#1c1c1c;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;">
        ${formatted}
      </div>
    </div>
  `.trim();
}

function renderPurchaseMessageText(message: string) {
  return message.replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/(^|[\s])\*([^*\n]+)\*(?=[\s]|$)/g, "$1$2");
}

function describeMailError(error: unknown) {
  const message = error instanceof Error ? error.message : "Не удалось отправить письмо";
  const code = typeof error === "object" && error && "code" in error ? String(error.code ?? "") : "";

  if (code === "EAUTH" || /invalid login|username and password|535|badcredentials/i.test(message)) {
    return "Gmail не принял пароль. В Vercel в SMTP_PASSWORD должен быть пароль приложения без пробелов.";
  }

  if (code === "ESOCKET" || code === "ECONNECTION" || code === "ETIMEDOUT" || code === "ECONNRESET") {
    return "Сервер не смог подключиться к почте. Проверьте SMTP_HOST=smtp.gmail.com и SMTP_PORT=465.";
  }

  if (/message rejected|550|553|mailbox unavailable/i.test(message)) {
    return "Почтовый сервер отклонил письмо. Проверьте адрес получателя.";
  }

  return message;
}

export async function sendCustomerPurchaseEmail(data: {
  recipients: string[];
  eventName: string;
  message: string;
  orderId?: string;
}) {
  const message = data.message.trim();
  const recipients = [...new Set(data.recipients.map((email) => email.trim().toLowerCase()).filter((email) => email.includes("@")))];
  if (!message || recipients.length === 0) {
    return { ok: false as const, error: "Нет текста письма или адреса получателя" };
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.warn("[email] SMTP credentials not configured — purchase email skipped", {
      orderId: data.orderId,
      eventName: data.eventName,
    });
    return { ok: false as const, error: "Почта на сервере не настроена" };
  }

  const port = Number(SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD.replace(/\s/g, ""),
    },
  });

  const subject = `РРК — ${data.eventName}`;
  const text = renderPurchaseMessageText(message);
  const html = renderPurchaseMessageHtml(message);

  try {
    await Promise.all(recipients.map(async (recipient) => {
      await transporter.sendMail({
        from: `"РРК" <${SMTP_USER}>`,
        to: recipient,
        subject,
        text,
        html,
      });
      console.log("[email] Purchase message sent", {
        to: recipient,
        orderId: data.orderId,
        eventName: data.eventName,
      });
    }));
  } catch (error) {
    console.error("[email] Failed to send purchase message", {
      orderId: data.orderId,
      eventName: data.eventName,
      error,
    });
    return { ok: false as const, error: describeMailError(error) };
  }

  return { ok: true as const };
}
