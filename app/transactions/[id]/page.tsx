'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import BottomNav from '@/shared/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui';
import { Input } from '@/shared/components/ui';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import { transactionRepository } from '@/core/repositories/TransactionRepository';
import { accountRepository } from '@/core/repositories/AccountRepository';
import { categoryRepository } from '@/core/repositories/CategoryRepository';
import { Transaction, Account, Category } from '@/core/models';
import { formatDate } from 'date-fns';

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;

  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

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

      // Load accounts and categories
      const [userAccounts, userCategories] = await Promise.all([
        accountRepository.getByUserId(userId),
        categoryRepository.getByUserId(userId),
      ]);

      setAccounts(userAccounts);
      setCategories(userCategories);

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
      });

      router.push('/transactions');
    } catch (error) {
      console.error('Failed to save transaction:', error);
      alert('Failed to save transaction');
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-xl font-bold">Edit Transaction</h1>
          <div className="w-20"></div>
        </div>

        {/* Edit Form */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={formData.type === 'expense' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className="w-full"
                >
                  Expense
                </Button>
                <Button
                  variant={formData.type === 'income' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className="w-full"
                >
                  Income
                </Button>
                <Button
                  variant={formData.type === 'transfer' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, type: 'transfer' })}
                  className="w-full"
                >
                  Transfer
                </Button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Transaction description"
              />
            </div>

            {/* Merchant Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Merchant (Optional)</label>
              <Input
                type="text"
                value={formData.merchantName}
                onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                placeholder="Merchant name"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time</label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            {/* Account */}
            <div>
              <label className="block text-sm font-medium mb-2">Account</label>
              <select
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleDelete}
                variant="destructive"
                disabled={deleting || saving}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || deleting || !formData.amount || !formData.description}
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
