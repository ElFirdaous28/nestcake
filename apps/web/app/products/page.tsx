import { PublicProductsClient } from '@/src/components/Products/PublicProductsClient';
import { productsService, type ProductsResponse } from '@/src/services/products.service';

const PAGE_SIZE = 12;

export default async function ProductsPage() {
  let initialProducts: Awaited<ReturnType<typeof productsService.getAllForClient>>['data'] = [];
  let initialPagination: ProductsResponse['pagination'] = {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  };

  try {
    const response = await productsService.getAllForClient({ page: 1, limit: PAGE_SIZE });
    initialProducts = response.data;
    initialPagination = response.pagination;
  } catch {
    // Keep rendering with an empty list if server-side fetch fails.
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-brand-cream via-brand-cream-soft to-brand-cream px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <PublicProductsClient
          initialProducts={initialProducts}
          initialPagination={initialPagination}
        />
      </div>
    </main>
  );
}
