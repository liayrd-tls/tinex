'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import BottomNav from '@/shared/components/layout/BottomNav';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui';
import { Input } from '@/shared/components/ui';
import { ArrowLeft, Download, Edit2, X } from 'lucide-react';
import { ParsedTransaction } from '@/shared/services/trusteeParser';
import { transactionRepository } from '@/core/repositories/TransactionRepository';
import { importedTransactionRepository } from '@/core/repositories/ImportedTransactionRepository';
import { cn } from '@/shared/utils/cn';

interface EditableTransaction extends ParsedTransaction {
  index: number;
  editing?: boolean;
}

export default function ImportPreviewPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [transactions, setTransactions] = useState<EditableTransaction[]>([]);
  const [accountId, setAccountId] = useState('');
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({ uid: currentUser.uid });
        loadParsedTransactions();
      } else {
        router.push('/auth');
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadParsedTransactions = () => {
    const stored = sessionStorage.getItem('parsedTransactions');
    if (!stored) {
      router.push('/import');
      return;
    }

    try {
      const data = JSON.parse(stored);
      const txns: EditableTransaction[] = data.transactions.map((t: ParsedTransaction & { date: string }, idx: number) => ({
        ...t,
        date: new Date(t.date),
        index: idx,
      }));

      setTransactions(txns);
      setAccountId(data.accountId);

      // Select all by default
      setSelectedIndices(new Set(txns.map((_, idx) => idx)));
    } catch (error) {
      console.error('Failed to load parsed transactions:', error);
      router.push('/import');
    }
  };

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const toggleEdit = (index: number) => {
    setTransactions(txns =>
      txns.map(t =>
        t.index === index ? { ...t, editing: !t.editing } : t
      )
    );
  };

  const updateTransaction = (index: number, field: keyof ParsedTransaction, value: string | number | Date) => {
    setTransactions(txns =>
      txns.map(t =>
        t.index === index ? { ...t, [field]: value } : t
      )
    );
  };

  const handleImport = async () => {
    if (!user) return;

    const selectedTransactions = transactions.filter(t => selectedIndices.has(t.index));
    if (selectedTransactions.length === 0) {
      alert('Please select at least one transaction to import');
      return;
    }

    setImporting(true);

    try {
      // Get existing hashes
      const existingHashes = await importedTransactionRepository.getImportedHashes(
        user.uid,
        'trustee'
      );

      let imported = 0;
      let duplicates = 0;
      let failed = 0;

      for (const parsed of selectedTransactions) {
        try {
          // Check for duplicate
          if (existingHashes.has(parsed.hash)) {
            duplicates++;
            continue;
          }

          // Create transaction
          const transactionId = await transactionRepository.create(
            user.uid,
            {
              accountId,
              type: parsed.type,
              amount: parsed.amount,
              description: parsed.description,
              date: parsed.date,
              merchantName: parsed.description,
              categoryId: '',
              tags: [],
            },
            parsed.currency
          );

          // Record import
          await importedTransactionRepository.create({
            userId: user.uid,
            transactionId,
            hash: parsed.hash,
            source: 'trustee',
            importDate: new Date(),
          });

          imported++;
        } catch (err) {
          console.error('Failed to import transaction:', err);
          failed++;
        }
      }

      // Clear session storage
      sessionStorage.removeItem('parsedTransactions');

      // Show results and redirect
      alert(`Import complete!\n\nImported: ${imported}\nDuplicates: ${duplicates}\nFailed: ${failed}`);
      router.push('/transactions');
    } catch (error) {
      console.error('Error importing transactions:', error);
      alert('Failed to import transactions');
    } finally {
      setImporting(false);
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

  const selectedCount = selectedIndices.size;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto p-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/import')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Review Transactions</h1>
          <div className="w-16"></div>
        </div>

        {/* Selection Summary */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {selectedCount} of {transactions.length} selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Tap transactions to select/deselect
                </p>
              </div>
              <Button
                onClick={() => setSelectedIndices(
                  selectedIndices.size === transactions.length
                    ? new Set()
                    : new Set(transactions.map((_, idx) => idx))
                )}
                variant="outline"
                size="sm"
              >
                {selectedIndices.size === transactions.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-2 mb-4">
          {transactions.map((txn) => (
            <Card
              key={txn.index}
              className={cn(
                'transition-all',
                selectedIndices.has(txn.index) ? 'ring-2 ring-primary' : 'opacity-60'
              )}
            >
              <CardContent className="p-3">
                {txn.editing ? (
                  // Edit mode
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Edit Transaction</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEdit(txn.index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">Description</label>
                      <Input
                        value={txn.description}
                        onChange={(e) => updateTransaction(txn.index, 'description', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Amount</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={txn.amount}
                          onChange={(e) => updateTransaction(txn.index, 'amount', parseFloat(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Currency</label>
                        <Input
                          value={txn.currency}
                          onChange={(e) => updateTransaction(txn.index, 'currency', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateTransaction(txn.index, 'type', txn.type === 'expense' ? 'income' : 'expense');
                        }}
                      >
                        Type: {txn.type}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => toggleEdit(txn.index)}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div
                    onClick={() => toggleSelection(txn.index)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{txn.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {txn.date.toLocaleDateString()} {txn.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {txn.type === 'expense' ? 'Expense' : 'Income'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'text-sm font-semibold',
                          txn.type === 'expense' ? 'text-destructive' : 'text-success'
                        )}>
                          {txn.type === 'expense' ? '-' : '+'}
                          {txn.amount.toFixed(2)} {txn.currency}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEdit(txn.index);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Import Button */}
        <Card>
          <CardContent className="p-4">
            <Button
              onClick={handleImport}
              disabled={importing || selectedCount === 0}
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              {importing ? 'Importing...' : `Import ${selectedCount} Transaction${selectedCount !== 1 ? 's' : ''}`}
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
