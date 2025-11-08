export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  description: string;
  date: Date;
  tags: string[];
  sourceId?: string; // Reference to import source
  sourceName?: string; // Bank name or manual entry
  merchantName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  categoryId: string;
  description: string;
  date: Date;
  tags?: string[];
  sourceName?: string;
  merchantName?: string;
  notes?: string;
}

export interface UpdateTransactionInput extends Partial<CreateTransactionInput> {
  id: string;
}
