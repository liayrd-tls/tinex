export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parentId?: string; // For subcategories
  isDefault: boolean; // System-provided categories
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parentId?: string;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string;
}

// Default categories for new users
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  // Income
  { name: 'Salary', type: 'income', icon: 'DollarSign', color: '#10b981', isDefault: true },
  { name: 'Freelance', type: 'income', icon: 'Briefcase', color: '#3b82f6', isDefault: true },
  { name: 'Investment', type: 'income', icon: 'TrendingUp', color: '#8b5cf6', isDefault: true },
  { name: 'Other Income', type: 'income', icon: 'Plus', color: '#6b7280', isDefault: true },

  // Expenses
  { name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#ef4444', isDefault: true },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#f59e0b', isDefault: true },
  { name: 'Transport', type: 'expense', icon: 'Car', color: '#3b82f6', isDefault: true },
  { name: 'Bills & Utilities', type: 'expense', icon: 'FileText', color: '#8b5cf6', isDefault: true },
  { name: 'Entertainment', type: 'expense', icon: 'Film', color: '#ec4899', isDefault: true },
  { name: 'Healthcare', type: 'expense', icon: 'Heart', color: '#14b8a6', isDefault: true },
  { name: 'Education', type: 'expense', icon: 'BookOpen', color: '#06b6d4', isDefault: true },
  { name: 'Other', type: 'expense', icon: 'MoreHorizontal', color: '#6b7280', isDefault: true },
];
