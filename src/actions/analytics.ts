"use server"

// Lightweight event tracking (safe stub / logger)
export async function trackEvent(businessId: string, eventName: string, metadata?: any) {
  // Safe logger without relying on removed pilot models
  if (process.env.NODE_ENV === "development") {
    console.log(`[Event Logged] ${eventName} for business: ${businessId}`, metadata || "");
  }
}

// Global error logger
export async function logError(
  errorType: string, 
  message: string, 
  businessId?: string, 
  stackTrace?: string, 
  path?: string
) {
  console.error(`[Error Logger] ${errorType}: ${message}`, { businessId, path, stackTrace });
}

// User feedback mechanism
export async function submitFeedback(businessId: string, category: string, content: string) {
  console.log(`[Feedback] from business ${businessId} (${category}):`, content);
  return { success: true };
}
