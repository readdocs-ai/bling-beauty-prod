import { ButtonLink } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/product-form";

export default function NewProduct() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ButtonLink href="/admin" variant="ghost">← Back</ButtonLink>
      <h1 className="mt-6 font-display text-4xl">New product</h1>
      <div className="mt-8"><ProductForm /></div>
    </div>
  );
}
