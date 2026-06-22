import crypto from 'crypto';

export type TBankInitRequest = {
  OrderId: string;
  Amount: number; // В копейках
  Description?: string;
  NotificationURL?: string;
  SuccessURL?: string;
  FailURL?: string;
  CustomerKey?: string;
};

export type TBankInitResponse = {
  Success: boolean;
  ErrorCode: string;
  Message: string;
  Details: string;
  Amount: number;
  OrderId: string;
  PaymentId: string;
  PaymentURL: string;
};

export class TBankClient {
  private terminalKey: string;
  private password: string;
  private baseUrl = 'https://securepay.tinkoff.ru/v2';

  constructor() {
    this.terminalKey = process.env.TBANK_TERMINAL_KEY || '';
    this.password = process.env.TBANK_PASSWORD || '';
    
    if (!this.terminalKey || !this.password) {
      console.warn("T-Bank credentials are not fully configured in environment variables.");
    }
  }

  private generateToken(data: Record<string, string | number | boolean>): string {
    const dataWithPassword = {
      ...data,
      Password: this.password,
    };

    // 1. Исключаем вложенные объекты, массивы и пустые значения (но 0 оставляем)
    const keys = Object.keys(dataWithPassword).filter(
      (key) =>
        key !== 'Token' &&
        dataWithPassword[key] !== undefined &&
        dataWithPassword[key] !== null &&
        typeof dataWithPassword[key] !== 'object'
    );

    // 2. Сортируем ключи по алфавиту
    keys.sort();

    // 3. Конкатенируем значения
    const valuesString = keys.map((key) => String(dataWithPassword[key])).join('');

    // 4. Вычисляем SHA-256 хеш
    const hash = crypto.createHash('sha256').update(valuesString).digest('hex');
    
    return hash;
  }

  async initPayment(request: TBankInitRequest): Promise<TBankInitResponse> {
    const payload = {
      ...request,
      TerminalKey: this.terminalKey,
    };

    const token = this.generateToken(payload);
    
    const finalPayload = {
      ...payload,
      Token: token,
    };

    const response = await fetch(`${this.baseUrl}/Init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalPayload),
    });

    const result = await response.json();
    return result as TBankInitResponse;
  }
}

export const tbank = new TBankClient();