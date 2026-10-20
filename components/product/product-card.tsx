import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/product-types";
export function ProductCard({product}:{product:Product}) {
 const img=product.images?.find(Boolean);
 return <Link href={`/product/${product.slug}`} className="luxury-product group block overflow-hidden"><div className="relative aspect-[4/5] overflow-hidden bg-[#eae1d7]">{img ? <Image src={img} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"/>:<div className="flex h-full items-center justify-center font-display text-6xl italic text-[#b4a18e]">B.</div>}{product.badge && <span className="absolute left-4 top-4 bg-[#f9f5ee] px-3 py-2 text-[10px] uppercase tracking-widest">{product.badge}</span>}</div><div className="px-1 py-6"><div className="text-[10px] uppercase tracking-[.22em] text-[#9a7e68]">THE PRESTIGE EDIT</div><h3 className="mt-3 font-display text-2xl leading-tight">{product.name}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-[#786a5e]">{product.short}</p><div className="mt-5 flex items-center justify-between border-t border-[#ded3c8] pt-4"><span className="text-lg">£{Number(product.price_gbp).toFixed(2)}</span><span className="text-xs uppercase tracking-widest">Discover ↗</span></div></div></Link>;
}
