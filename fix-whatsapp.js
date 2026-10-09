const fs = require('fs');
let content = fs.readFileSync('src/app/kasir/KasirClient.tsx', 'utf8');

const summaryTarget = `const summary = {
      clientTransactionId,
      date: new Date(),
      items: [...cart],
      total,
      paymentMethod,
      paidAmount: paymentMethod === "CASH" ? paidAmount : total,
      change: paymentMethod === "CASH" ? paidAmount - total : 0
    }`;

const summaryReplacement = `const summary = {
      clientTransactionId,
      date: new Date(),
      items: [...cart],
      total,
      paymentMethod,
      paidAmount: paymentMethod === "CASH" ? paidAmount : total,
      change: paymentMethod === "CASH" ? paidAmount - total : 0,
      customerPhone: selectedCustomerId ? localCustomers.find((c: any) => c.id === selectedCustomerId)?.phone : null
    }`;

content = content.replace(summaryTarget, summaryReplacement);

const waTarget = 'href={`https://wa.me/?text=${encodeURIComponent(`Halo! Terima kasih telah berbelanja.\\n\\nTotal Tagihan: ${formatRupiah(transactionSummary.total)}\\nMetode Pembayaran: ${transactionSummary.paymentMethod}\\n\\nLihat e-struk Anda di sini:\\n${typeof window !== \\\'undefined\\\' ? window.location.origin : \\\'\\\'}/kasir/struk/${transactionSummary.clientTransactionId}`)}`}';

const waReplacement = 'href={`https://wa.me/${transactionSummary.customerPhone ? transactionSummary.customerPhone.replace(/\\D/g, "").replace(/^0/, "62") : ""}?text=${encodeURIComponent(`Halo! Terima kasih telah berbelanja.\\n\\nTotal Tagihan: ${formatRupiah(transactionSummary.total)}\\nMetode Pembayaran: ${transactionSummary.paymentMethod}\\n\\nLihat e-struk Anda di sini:\\n${typeof window !== \\\'undefined\\\' ? window.location.origin : \\\'\\\'}/kasir/struk/${transactionSummary.clientTransactionId}`)}`}';

content = content.replace(waTarget, waReplacement);

fs.writeFileSync('src/app/kasir/KasirClient.tsx', content);
