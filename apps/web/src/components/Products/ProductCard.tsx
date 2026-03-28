import Link from 'next/link';
import { type ProductItem } from '@/src/services/products.service';

type ProductCardProps = {
  product: ProductItem;
  detailsHref?: string;
  actions?: React.ReactNode;
};

const prettyLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function ProductCard({ product, detailsHref, actions }: ProductCardProps) {
  const href = detailsHref ?? `/products/${product.id}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={href} className="block">
        <img
          src={product.image}
          alt={product.name}
          className="h-44 w-full object-cover"
          loading="lazy"
        />
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={href} className="text-base font-semibold text-brand-ink hover:underline">
              {product.name}
            </Link>
            {product.description && (
              <p className="mt-1 line-clamp-2 text-sm text-brand-ink-soft">{product.description}</p>
            )}
          </div>

        </div>

        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-brand-ink">${product.price.toFixed(2)}</p>
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              product.isAvailable
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {product.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>

        {actions ? <div className="pt-1">{actions}</div> : null}
      </div>
    </article>
  );
}
