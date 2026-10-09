const MAYAR_API_KEY = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzExZTAxZi01ZjI4LTQ3MDgtYTc1Yy1iODE2ZjczZjM3YmQiLCJhY2NvdW50SWQiOiJjMTQyNmNkNi1lNTJiLTRmNzktYjlhNS1iMGY4ZmRjMjc2YzMiLCJjcmVhdGVkQXQiOiIxNzg4MDcwMjg2MDAxIiwicm9sZSI6ImRldmVsb3BlciIsInNjb3BlIjp7InJlYWQiOnRydWUsIndyaXRlIjp0cnVlfSwic3ViIjoibG9nYXJpdG1hLnRpbUBnbWFpbC5jb20iLCJuYW1lIjoiTG9nYXJpdG1hIiwibGluayI6ImxvZ2FyaXRtYS1wYXkiLCJpc1NlbGZEb21haW4iOmZhbHNlLCJpYXQiOjE3ODgwNzAyODZ9.i-0x6ok50c2ys7PpkbAEuLESGZHZ6glNpe-OjHnbnnXHjEAYgn2SkrhRxBUcWvDQvOaV8uIs9wo7La4aM0KtDcoHfbiH7jEtrSgEqLPG_50ZbUbhFN-alCT-_CUOUXMhbEbD3Xrh3L-QHOmwwI74-AqhUwius0d762VvF6tfQG8CHvabcn1GJHuYTikAAiKWNpiILDoyReoF2jcGn_vN4zrEoVb8Ma0oed2kBxYZRnEGytnDn45rrMt3TfP96hWBCcQZZO3Yo4UZfbSyiYem3QmT2iNTRw4quUONdcF73Hy7acaUqunIioy52p6PC3gHJVx1eKxsAbzalRZbYjKDLw";

async function main() {
  // Fetch all invoices pages
  let allTrx = [];
  for (let p = 1; p <= 10; p++) {
    const res = await fetch(`https://api.mayar.id/hl/v1/invoice?page=${p}`, {
      headers: { "Authorization": `Bearer ${MAYAR_API_KEY}` }
    });
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      allTrx = allTrx.concat(data.data);
    }
    if (!data.hasMore) break;
  }

  // Filter PAID only
  const paid = allTrx.filter(t => {
    const s = (t.status || "").toUpperCase();
    return s === "PAID" || s === "SETTLED" || s === "SUCCESS" || s === "COMPLETED";
  });

  console.log("=== PAID TRANSACTIONS ===");
  for (const t of paid) {
    const cust = t.customer || {};
    console.log(`Name: ${cust.name || t.name || "-"} | Email: ${cust.email || t.email || "-"} | Phone: ${cust.mobile || cust.phone || t.phone || "-"} | Amount: ${t.amount} | Status: ${t.status}`);
  }
  console.log(`\nTotal paid: ${paid.length}`);
  console.log(`Total all: ${allTrx.length}`);
}
main().catch(console.error);
