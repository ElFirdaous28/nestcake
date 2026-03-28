import { ProductDetailsPage } from '@/src/components/Products/ProductDetailsPage';

type ProductDetailsRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailsRoutePage({
  params,
}: ProductDetailsRoutePageProps) {
  const { id } = await params;

  return <ProductDetailsPage productId={id} />;
}
