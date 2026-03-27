import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo.svg"
        alt="NestCake"
        width={40}
        height={40}
        className="w-10 h-12"
      />
      <div className="text-lg font-bold text-brand-ink">
        <span className="font-bold">Nest</span><span className="font-normal">Cake</span>
      </div>
    </div>
  );
}
