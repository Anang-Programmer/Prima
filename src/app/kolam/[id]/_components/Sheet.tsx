"use client";

// Komponen presentasi kecil yang dipakai berulang di halaman detail kolam.
// Dipindah PERSIS dari page.tsx (ZERO perubahan).

export function Sheet({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      <button aria-label="Tutup" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[24px] bg-white px-4 pb-8 pt-3 md:relative z-10 md:max-h-[90vh] md:w-full md:max-w-md md:rounded-xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300" />
        <h3 className="mb-4 text-base font-bold text-slate-800">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 py-3">
      <span className="text-xs text-slate-500">{l}</span>
      <span className="text-xs font-bold text-slate-800">{v}</span>
    </div>
  );
}

export function Label({ children }: any) {
  return <p className="mb-1.5 text-[11px] font-semibold text-slate-800">{children}</p>;
}
