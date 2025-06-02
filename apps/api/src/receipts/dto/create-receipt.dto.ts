export class CreateReceiptDto {
  title: string;
  total: number;
  category: string;
  receivedAt: Date;
  merchant: string;
  source: string;
  rawFileUrl: string;
  userId: string;
  householdId?: string;
} 