import { ProductCatalogClient } from '@/src/components/Products/ProductCatalogClient';

export default function ProfessionalProductsRoutePage() {
  return (
    <ProductCatalogClient
      scope="professional"
      title="My Products"
      description="Manage and review your full product catalog."
      containerClassName="space-y-6"
      titleClassName="text-2xl font-bold text-brand-ink"
      emptyStateClassName="rounded-xl border border-dashed border-brand-line py-14 text-center text-brand-ink-soft"
      gridClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      searchPlaceholder="Search your products"
      enableManagement
    />
  );
}
