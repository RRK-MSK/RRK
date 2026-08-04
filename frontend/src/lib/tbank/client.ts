import crypto from 'crypto';
import fs from 'fs';
import https from 'https';
import path from 'path';

export type TBankInitRequest = {
  OrderId: string;
  Amount: number; // В копейках
  Description?: string;
  NotificationURL?: string;
  SuccessURL?: string;
  FailURL?: string;
  CustomerKey?: string;
  PayType?: string;
  DATA?: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Receipt?: any; // Для чеков (54-ФЗ)
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

export type TBankGetStateRequest = {
  PaymentId: string;
};

export type TBankGetStateResponse = {
  Success: boolean;
  ErrorCode: string;
  Message?: string;
  Details?: string;
  TerminalKey?: string;
  Status?: string;
  PaymentId?: string;
  OrderId?: string;
  Amount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Data?: Record<string, any>;
};

export class TBankClient {
  private terminalKey: string;
  private password: string;
  private baseUrl: string;
  private httpsAgent?: https.Agent;

  constructor() {
    this.terminalKey = process.env.TBANK_TERMINAL_KEY || '';
    this.password = process.env.TBANK_PASSWORD || '';
    this.baseUrl = process.env.TBANK_API_URL || 'https://securepay.tinkoff.ru/v2';
    this.httpsAgent = this.createHttpsAgent();
    
    if (!this.terminalKey || !this.password) {
      console.warn("T-Bank credentials are not fully configured in environment variables.");
    }
  }

  private createHttpsAgent() {
    const caBundlePath = process.env.TBANK_CA_BUNDLE_PATH || path.join(process.cwd(), 'certs', 'russian-trusted-ca-bundle.pem');

    try {
      if (!fs.existsSync(caBundlePath)) {
        return undefined;
      }

      const ca = fs.readFileSync(caBundlePath, 'utf8');
      if (!ca.trim()) {
        return undefined;
      }

      return new https.Agent({
        ca,
      });
    } catch (error) {
      console.error('Failed to initialize T-Bank CA bundle:', error);
      return undefined;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateToken(data: Record<string, any>): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataWithPassword: Record<string, any> = {
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

    return this.postJson<TBankInitResponse>('/Init', finalPayload);
  }

  async getPaymentState(request: TBankGetStateRequest): Promise<TBankGetStateResponse> {
    const payload = {
      ...request,
      TerminalKey: this.terminalKey,
    };

    const token = this.generateToken(payload);

    const finalPayload = {
      ...payload,
      Token: token,
    };

    return this.postJson<TBankGetStateResponse>('/GetState', finalPayload);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private postJson<T>(pathname: string, payload: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${pathname}`);
    const body = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
      const req = https.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
          agent: this.httpsAgent,
        },
        (res) => {
          let raw = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            raw += chunk;
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(raw) as T);
            } catch (error) {
              reject(error);
            }
          });
        },
      );

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}

export const tbank = new TBankClient();
