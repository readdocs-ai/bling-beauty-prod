import Image from 'next/image';

type Props = { src: string; alt: string; sizes: string; compact?: boolean };

export function CollectionImage({ src, alt, sizes, compact = false }: Props) {
  return <div className={`relative overflow-hidden bg-[#f1e9df] ${compact ? 'h-full w-full' : 'aspect-[128/83]'}`}>
    <Image src={src} alt={alt} fill sizes={sizes} className="object-cover object-top" style={compact ? {height: '106%'} : undefined} />
  </div>;
}
