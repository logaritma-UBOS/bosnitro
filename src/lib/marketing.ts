const THRESHOLD_LOYAL_COUNT = 3;
const THRESHOLD_INACTIVE_DAYS = 90;
const THRESHOLD_CHURN_RISK_DAYS = 30;
const THRESHOLD_NEW_DAYS = 30;

export type SaleMinimal = { totalAmount: number; createdAt: Date | string };

export function calculateCustomerSegment(salesRaw: SaleMinimal[]) {
  // Sort sales securely by date ascending
  const sales = [...salesRaw].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const now = new Date();
  const totalTransactions = sales.length;
  const totalSpent = sales.reduce((sum: number, s: SaleMinimal) => sum + s.totalAmount, 0);
  const averageSpent = totalTransactions > 0 ? totalSpent / totalTransactions : 0;
  
  const firstTransaction = totalTransactions > 0 ? sales[0].createdAt : null;
  const lastTransaction = totalTransactions > 0 ? sales[sales.length - 1].createdAt : null;
  
  const daysSinceLastTransaction = lastTransaction 
    ? Math.floor((now.getTime() - new Date(lastTransaction).getTime()) / (1000 * 60 * 60 * 24))
    : null;
    
  const daysSinceFirstTransaction = firstTransaction
    ? Math.floor((now.getTime() - new Date(firstTransaction).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let derivedStatus = "BELUM_ADA_TRANSAKSI";
  let marketingSegment = "TIDAK_AKTIF"; // Default fallback
  
  if (totalTransactions > 0 && daysSinceLastTransaction !== null) {
    if (daysSinceLastTransaction > THRESHOLD_INACTIVE_DAYS) {
      derivedStatus = "TIDAK_AKTIF";
      marketingSegment = "TIDAK_AKTIF";
    } else if (daysSinceLastTransaction > THRESHOLD_CHURN_RISK_DAYS) {
      derivedStatus = "MULAI_TIDAK_AKTIF";
      marketingSegment = "BERISIKO";
    } else if (totalTransactions >= THRESHOLD_LOYAL_COUNT) {
      derivedStatus = "LOYAL";
      marketingSegment = "LOYAL";
    } else if (totalTransactions === 1 || (daysSinceFirstTransaction !== null && daysSinceFirstTransaction <= THRESHOLD_NEW_DAYS)) {
      derivedStatus = "BARU";
      marketingSegment = "BARU";
    } else {
      derivedStatus = "AKTIF";
      marketingSegment = "AKTIF";
    }
  }

  return {
    totalTransactions,
    totalSpent,
    averageSpent,
    firstTransaction,
    lastTransaction,
    daysSinceLastTransaction,
    derivedStatus,
    marketingSegment
  }
}