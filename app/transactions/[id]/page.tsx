'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import BottomNav from '@/shared/components/layout/BottomNav';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui';
import { Input } from '@/shared/components/ui';
import {
  ArrowLeft,
  Trash2,
  Edit,
  Save,
  X,
  DollarSign,
  Briefcase,
  TrendingUp,
  Plus,
  Utensils,
  ShoppingBag,
  Car,
  FileText,
  Film,
  Heart,
  BookOpen,
  MoreHorizontal,
  Home,
  Smartphone,
  Coffee,
  Gift,
} from 'lucide-react';
import { transactionRepository } from '@/core/repositories/TransactionRepository';
import { accountRepository } from '@/core/repositories/AccountRepository';
import { categoryRepository } from '@/core/repositories/CategoryRepository';
import { tagRepository } from '@/core/repositories/TagRepository';
import { Transaction, Account, Category, Tag } from '@/core/models';
import { formatDate } from 'date-fns';
import { cn } from '@/shared/utils/cn';

// Icon mapping for categories
const ICONS = {
  DollarSign,
  Briefcase,
  TrendingUp,
  Plus,
  Utensils,
  ShoppingBag,
  Car,
  FileText,
  Film,
  Heart,
  BookOpen,
  MoreHorizontal,
  Home,
  Smartphone,
  Coffee,
  Gift,
};

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;

  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amount: '',
    description: '',
    date: '',
    time: '',
    accountId: '',
    categoryId: '',
    merchantName: '',
    notes: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({ uid: currentUser.uid });
        await loadData(currentUser.uid);
      } else {
        router.push('/auth');
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, transactionId]);

  const loadData = async (userId: string) => {
    try {
      // Load transaction
      const txn = await transactionRepository.getById(transactionId);
      if (!txn || txn.userId !== userId) {
        router.push('/transactions');
        return;
      }

      setTransaction(txn);
      setSelectedTags(txn.tags || []);

      // Load accounts, categories, and tags
      const [userAccounts, userCategories, userTags] = await Promise.all([
        accountRepository.getByUserId(userId),
        categoryRepository.getByUserId(userId),
        tagRepository.getByUserId(userId),
      ]);

      setAccounts(userAccounts);
      setCategories(userCategories);
      setTags(userTags);

      // Populate form
      const txnDate = txn.date;
      setFormData({
        type: txn.type,
        amount: txn.amount.toString(),
        description: txn.description,
        date: formatDate(txnDate, 'yyyy-MM-dd'),
        time: formatDate(txnDate, 'HH:mm'),
        accountId: txn.accountId,
        categoryId: txn.categoryId || '',
        merchantName: txn.merchantName || '',
        notes: txn.notes || '',
      });
    } catch (error) {
      console.error('Failed to load transaction:', error);
      router.push('/transactions');
    }
  };

  const handleSave = async () => {
    if (!user || !transaction) return;

    setSaving(true);
    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      await transactionRepository.update({
        id: transactionId,
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: dateTime,
        accountId: formData.accountId,
        categoryId: formData.categoryId || '',
        merchantName: formData.merchantName,
        notes: formData.notes,
        tags: selectedTags,
      });

      await loadData(user.uid);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      alert('Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!transaction) return;

    // Reset form to original values
    const txnDate = transaction.date;
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: formatDate(txnDate, 'yyyy-MM-dd'),
      time: formatDate(txnDate, 'HH:mm'),
      accountId: transaction.accountId,
      categoryId: transaction.categoryId || '',
      merchantName: transaction.merchantName || '',
      notes: transaction.notes || '',
    });
    setSelectedTags(transaction.tags || []);
    setEditMode(false);
  };

  const handleDelete = async () => {
    if (!user || !transaction) return;

    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setDeleting(true);
    try {
      await transactionRepository.delete(transactionId);
      router.push('/transactions');
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('Failed to delete transaction');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto p-4 pb-20">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!transaction) {
    return null;
  }

  const category = categories.find((c) => c.id === formData.categoryId);
  const account = accounts.find((a) => a.id === formData.accountId);
  const IconComponent = category
    ? ICONS[category.icon as keyof typeof ICONS] || MoreHorizontal
    : MoreHorizontal;
  const transactionTags = tags.filter((t) => selectedTags.includes(t.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto p-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/transactions')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {!editMode ? (
            <Button
              variant="outline"
              onClick={() => setEditMode(true)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4" />
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>

        {/* Transaction Card */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            {/* Category Icon and Amount - Top Section */}
            <div className="flex flex-col items-center mb-8">
              {/* Large Category Icon */}
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
                style={{
                  backgroundColor: category ? `${category.color}20` : '#6b728020',
                }}
              >
                <IconComponent
                  className="h-12 w-12"
                  style={{ color: category?.color || '#6b7280' }}
                />
              </div>

              {/* Amount */}
              <div className="text-center">
                <p
                  className={cn(
                    'text-4xl font-bold',
                    formData.type === 'income' ? 'text-success' : 'text-destructive'
                  )}
                >
                  {formData.type === 'income' ? '+' : '-'}${formData.amount}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {category?.name || 'Uncategorized'}
                </p>
              </div>
            </div>

            {/* Transaction Details - Two Column Layout */}
            <div className="space-y-4">
              {/* Type */}
              <div className="grid grid-cols-3 gap-4">
                <label className="text-sm text-muted-foreground">Type</label>
                {editMode ? (
                  <div className="col-span-2 flex gap-2">
                    <Button
                      size="sm"
                      variant={formData.type === 'expense' ? 'default' : 'outline'}
                      onClick={() => setFormData({ ...formData, type: 'expense' })}
                      className="flex-1"
                    >
                      Expense
                    </Button>
                    <Button
                      size="sm"
                      variant={formData.type === 'income' ? 'default' : 'outline'}
                      onClick={() => setFormData({ ...formData, type: 'income' })}
                      className="flex-1"
                    >
                      Income
                    </Button>
                  </div>
                ) : (
                  <p className="col-span-2 text-sm font-medium capitalize">{formData.type}</p>
                )}
              </div>

              {/* Amount */}
              <div className="grid grid-cols-3 gap-4">
                <label className="text-sm text-muted-foreground">Amount</label>
                {editMode ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="col-span-2"
                  />
                ) : (
                  <p className="col-span-2 text-sm font-medium">
                    ${parseFloat(formData.amount).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="grid grid-cols-3 gap-4">
                <label className="text-sm text-muted-foreground">Description</label>
                {editMode ? (
                  <Input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="col-span-2"
                  />
                ) : (
                  <p className="col-span-2 text-sm font-medium">{formData.description}</p>
                )}
              </div>

              {/* Merchant */}
              {(editMode || formData.merchantName) && (
                <div className="grid grid-cols-3 gap-4">
                  <label className="text-sm text-muted-foreground">Merchant</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.merchantName}
                      onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                      placeholder="Optional"
                      className="col-span-2"
                    />
                  ) : (
                    <p className="col-span-2 text-sm font-medium">
                      {formData.merchantName || '-'}
                    </p>
                  )}
                </div>
              )}

              {/* Date */}
              <div className="grid grid-cols-3 gap-4">
                <label className="text-sm text-muted-foreground">Date</label>
                {editMode ? (
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="col-span-2"
                  />
                ) : (
                  <p className="col-span-2 text-sm font-medium">
                    {formatDate(new Date(formData.date), 'MMM dd, yyyy')}
                  </p>
                )}
              </div>

              {/* Time */}
              <div className="grid grid-cols-3 gap-4">
                <label className="text-sm text-muted-foreground">Time</label>
                {editMode ? (
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="col-span-2"
                  />
                ) : (
                  <p className="col-span-2 text-sm font-medium">{formData.time}</p>
                )}
              </div>

              {/* Account */}
              <div className="grid grid-cols-3 gap-4">
                <label className="text-sm text-muted-foreground">Account</label>
                {editMode ? (
                  <select
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="col-span-2 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="col-span-2 text-sm font-medium">
                    {account?.name || 'Unknown'} ({account?.currency || '-'})
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="grid grid-cols-3 gap-4">
                <label className="text-sm text-muted-foreground">Category</label>
                {editMode ? (
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="col-span-2 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">No category</option>
                    {categories
                      .filter((c) => c.type === formData.type)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <p className="col-span-2 text-sm font-medium">
                    {category?.name || 'Uncategorized'}
                  </p>
                )}
              </div>

              {/* Tags */}
              {(editMode || transactionTags.length > 0) && (
                <div className="grid grid-cols-3 gap-4">
                  <label className="text-sm text-muted-foreground">Tags</label>
                  <div className="col-span-2">
                    {editMode ? (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => {
                          const isSelected = selectedTags.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => handleToggleTag(tag.id)}
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1',
                                isSelected ? 'ring-2 ring-offset-1 scale-105' : 'opacity-60 hover:opacity-100'
                              )}
                              style={{
                                backgroundColor: isSelected ? tag.color : `${tag.color}40`,
                                color: isSelected ? '#ffffff' : tag.color,
                              }}
                            >
                              {tag.name}
                              {isSelected && <X className="h-3 w-3" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {transactionTags.length > 0 ? (
                          transactionTags.map((tag) => (
                            <span
                              key={tag.id}
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color,
                              }}
                            >
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm font-medium text-muted-foreground">-</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {(editMode || formData.notes) && (
                <div className="grid grid-cols-3 gap-4">
                  <label className="text-sm text-muted-foreground">Notes</label>
                  {editMode ? (
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add notes..."
                      className="col-span-2 min-h-[60px] px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <p className="col-span-2 text-sm font-medium whitespace-pre-wrap">
                      {formData.notes || '-'}
                    </p>
                  )}
                </div>
              )}

              {/* Created At */}
              <div className="grid grid-cols-3 gap-4">
                <label className="text-sm text-muted-foreground">Created</label>
                <p className="col-span-2 text-sm font-medium">
                  {formatDate(transaction.createdAt, 'MMM dd, yyyy HH:mm')}
                </p>
              </div>

              {/* Updated At */}
              {transaction.updatedAt && transaction.updatedAt !== transaction.createdAt && (
                <div className="grid grid-cols-3 gap-4">
                  <label className="text-sm text-muted-foreground">Updated</label>
                  <p className="col-span-2 text-sm font-medium">
                    {formatDate(transaction.updatedAt, 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </div>

            {/* Delete Button */}
            {editMode && (
              <div className="mt-8 pt-6 border-t border-border">
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  disabled={deleting || saving}
                  className="w-full gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? 'Deleting...' : 'Delete Transaction'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
