'use client';

import BottomNav from '@/shared/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">Categories</h1>
        </div>
      </header>

      <main className="px-4 py-4">
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Category management features will be implemented here.
            </p>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
