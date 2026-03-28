import { ProductCatalogClient } from '@/src/components/Products/ProductCatalogClient';

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">
      <ProductCatalogClient
        scope="client"
        title="Browse Products"
        description="Discover ready-to-order and custom cake options from verified professionals."
        containerClassName="mx-auto max-w-6xl space-y-6"
        titleClassName="text-3xl font-bold text-brand-ink"
        emptyStateClassName="rounded-xl border border-dashed border-brand-line bg-white py-14 text-center text-brand-ink-soft"
        gridClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        searchPlaceholder="Search by product name or description"
      />
    </main>
  );
}
