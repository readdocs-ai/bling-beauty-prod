"use client";

export default function PrintOrderButton() {
  return <button type="button" onClick={() => window.print()} className="print:hidden rounded-xl bg-[#33241e] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Print order</button>;
}
