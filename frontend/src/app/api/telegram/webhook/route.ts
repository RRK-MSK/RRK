import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.TELEGRAM_BOT;
  if (!token) return NextResponse.json({ status: "No token" });
  
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await res.json();
    return NextResponse.json({ status: "Telegram webhook is running", webhookInfo: data });
  } catch (e) {
    return NextResponse.json({ status: "Telegram webhook is running", error: String(e) });
  }
}

export async function POST(request: Request) {
  try {
    const update = await request.json();
    
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;

      if (text.startsWith('/start')) {
        const token = process.env.TELEGRAM_BOT;
        
        if (!token) {
          console.error("TELEGRAM_BOT is not set");
          return NextResponse.json({ error: "No token" }, { status: 500 });
        }

        const message = `Добро пожаловать в РРК.\n\nМесто, где:\n— все друг другу ученики и учителя;\n— кринжа не существует;\n— тебя слышат и слушают.\n\n👇 Открой приложение там тебя ждут ближайшие занятия, запись и всё, что нужно для старта!`;

        await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            photo: "https://rrclub.site/welcome-doodle.png",
            caption: message,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Открыть приложение",
                    web_app: {
                      url: "https://rrclub.site" // URL вашего Mini App
                    }
                  }
                ]
              ]
            }
          }),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
