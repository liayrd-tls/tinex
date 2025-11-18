'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import BottomNav from '@/shared/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui';
import Modal from '@/shared/components/ui/Modal';
import FAB from '@/shared/components/ui/FAB';
import AddAccountForm from '@/modules/accounts/AddAccountForm';
import { Plus, Wallet, Trash2 } from 'lucide-react';
import { accountRepository } from '@/core/repositories/AccountRepository';
import { userSettingsRepository } from '@/core/repositories/UserSettingsRepository';
import { Account, CreateAccountInput, CURRENCIES, UserSettings } from '@/core/models';
import { convertMultipleCurrencies, formatCurrency } from '@/shared/services/currencyService';
import { cn } from '@/shared/utils/cn';

export default function AccountsPage() {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({ uid: currentUser.uid });
        await loadAccounts(currentUser.uid);
      } else {
        router.push('/auth');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadAccounts = async (userId: string) => {
    try {
      const [userAccounts, settings] = await Promise.all([
        accountRepository.getByUserId(userId),
        userSettingsRepository.getOrCreate(userId),
      ]);

      setAccounts(userAccounts);
      setUserSettings(settings);

      // Calculate total balance in base currency
      if (userAccounts.length > 0) {
        const balancesConverted = await convertMultipleCurrencies(
          userAccounts.map((acc) => ({ amount: acc.balance, currency: acc.currency })),
          settings.baseCurrency
        );
        setTotalBalance(balancesConverted);
      } else {
        setTotalBalance(0);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleAddAccount = async (data: CreateAccountInput) => {
    if (!user) return;

    try {
      await accountRepository.create(user.uid, data);
      await loadAccounts(user.uid);
      setShowAddAccount(false);
    } catch (error) {
      console.error('Failed to add account:', error);
      throw error;
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      await accountRepository.delete(accountId);
      await loadAccounts(user.uid);
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    if (!user) return;

    try {
      await accountRepository.setDefault(user.uid, accountId);
      await loadAccounts(user.uid);
    } catch (error) {
      console.error('Failed to set default account:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getCurrencySymbol = (currency: string) => {
    return CURRENCIES.find((c) => c.value === currency)?.symbol || currency;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">Accounts</h1>
          <p className="text-xs text-muted-foreground">Manage your accounts</p>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Total Balance Summary */}
        {accounts.length > 0 && (
          <Card className={cn(
            "bg-gradient-to-br",
            totalBalance >= 0
              ? "from-primary/20 to-primary/5"
              : "from-destructive/20 to-destructive/5"
          )}>
            <CardHeader>
              <CardDescription>Total Balance ({userSettings?.baseCurrency || 'USD'})</CardDescription>
              <CardTitle className={cn(
                "text-3xl",
                totalBalance < 0 && "text-destructive"
              )}>
                {formatCurrency(totalBalance, userSettings?.baseCurrency || 'USD')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {accounts.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No Accounts</CardTitle>
              <CardDescription>Create your first account to start tracking finances</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <Button
                variant="default"
                onClick={() => setShowAddAccount(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Account
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Accounts List */}
        {accounts.length > 0 && (
          <div className="space-y-3">
            {accounts.map((account) => (
              <Card key={account.id} className="overflow-hidden">
                <Link href={`/accounts/${account.id}`}>
                  <CardContent className="p-4 hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold truncate">{account.name}</h3>
                            {account.isDefault && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary flex-shrink-0">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">
                            {account.type.replace('_', ' ')}
                          </p>
                          <p className={cn(
                            "text-lg font-bold mt-2",
                            account.balance < 0 && "text-destructive"
                          )}>
                            {getCurrencySymbol(account.currency)} {account.balance.toFixed(2)}
                          </p>
                          {account.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{account.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
                <div className="flex gap-1 px-4 pb-3 border-t border-border/50 pt-2">
                  {!account.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSetDefault(account.id);
                      }}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive flex-1"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteAccount(account.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <FAB
        className="bottom-24 right-4"
        onClick={() => setShowAddAccount(true)}
      >
        <Plus className="h-6 w-6" />
      </FAB>

      {/* Add Account Modal */}
      <Modal
        isOpen={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        title="Add Account"
      >
        <AddAccountForm
          onSubmit={handleAddAccount}
          onCancel={() => setShowAddAccount(false)}
        />
      </Modal>

      <BottomNav />
    </div>
  );
}
