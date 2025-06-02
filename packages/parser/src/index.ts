import { simpleParser } from 'mailparser';

export interface ParsedEmail {
  merchant: string;
  total: number;
  category: string;
  receivedAt: Date;
}

export async function parseEmail(raw: string): Promise<ParsedEmail> {
  // TODO: Implement actual email parsing logic
  return {
    merchant: 'Example Store',
    total: 49.99,
    category: 'groceries',
    receivedAt: new Date(),
  };
} 