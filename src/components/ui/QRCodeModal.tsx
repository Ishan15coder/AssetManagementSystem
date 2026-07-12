import React, { useRef } from "react";
import { X, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeModalProps {
  asset: { tag: string; name: string };
  onClose: () => void;
}

export function QRCodeModal({ asset, onClose }: QRCodeModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    // Create a temporary printable version of the page
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
        ${printContents}
      </div>
    `;
    window.print();
    // Restore the original React app root
    document.body.innerHTML = originalContents;
    window.location.reload(); // Quickest way to re-attach React events after wiping innerHTML
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="erp-card bg-[var(--surface)] w-full max-w-sm flex flex-col items-center gap-6 p-8 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-bold text-[var(--fg)]">Asset Tag QR Code</h2>
          <p className="text-xs text-[var(--muted)] mt-1">Scan this code to load asset details</p>
        </div>

        {/* This div is the one that gets printed */}
        <div ref={printRef} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <QRCodeSVG value={asset.tag} size={180} level={"H"} />
          <div className="mt-4 text-center text-black">
            <div className="font-bold text-lg tracking-wider font-mono">{asset.tag}</div>
            <div className="text-xs mt-1 max-w-[180px] truncate">{asset.name}</div>
          </div>
        </div>

        <button onClick={handlePrint} className="erp-btn-primary w-full justify-center">
          <Printer size={16} className="mr-2" /> Print Tag
        </button>
      </div>
    </div>
  );
}
