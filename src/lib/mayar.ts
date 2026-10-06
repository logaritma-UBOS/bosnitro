export async function disburseMayar(amount: number, bankCode: string, accountNumber: string, accountName: string, description: string) {
    const API_KEY = process.env.MAYAR_API_KEY;
    if (!API_KEY) {
        console.warn("[MAYAR] API_KEY not set. Simulating disbursement.");
        return { success: true, mock: true, message: "Simulated transfer to " + bankCode + " " + accountNumber };
    }

    try {
        // This is a standard structure for Payment Gateway Disbursement APIs
        // E.g., Mayar, Xendit, Midtrans
        const res = await fetch("https://api.mayar.id/v1/disbursements", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount: amount,
                bank_code: bankCode,
                account_number: accountNumber,
                account_name: accountName,
                description: description
            })
        });

        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || "Gagal melakukan transfer dana melalui Mayar");
        }

        return { success: true, data };
    } catch (error: any) {
        throw new Error("Mayar API Error: " + error.message);
    }
}

export async function getMayarBalance() {
    const API_KEY = process.env.MAYAR_API_KEY;
    if (!API_KEY) return { success: false, balance: 0, message: "MAYAR_API_KEY not set" };

    try {
        const res = await fetch("https://api.mayar.id/v1/balance", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${API_KEY}`
            },
            next: { revalidate: 60 } // Cache 60 seconds
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            return { success: false, balance: 0, message: data.message || "Failed to fetch" };
        }
        
        return { success: true, balance: data.balance || data.data?.balance || 0 };
    } catch (error: any) {
        return { success: false, balance: 0, message: error.message };
    }
}
