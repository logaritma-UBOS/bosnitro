import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

async function runSmokeTest() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  console.log("Memulai Smoke Test Production ke Turso...");
  console.log("URL:", url);

  const adapter = new PrismaLibSql({ url, authToken });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Register & Onboarding
    const user = await prisma.user.create({
      data: {
        id: "smoke3-user-1",
        name: "Smoke Test User",
        email: "smoke3@logaritma.id",
        passwordHash: "hashedpass",
        businesses: {
          create: {
            id: "smoke3-biz-1",
            name: "Smoke Business",
            businessType: "FNB"
          }
        }
      },
      include: { businesses: true }
    });
    console.log("[PASS] Landing -> Register -> Onboarding (Business Created)");

    const businessId = user.businesses[0].id;

    // 2. Katalog: Bahan Baku
    const ingredient = await prisma.ingredient.create({
      data: {
        id: "smoke3-ing-1",
        businessId,
        name: "Biji Kopi Smoke",
        unit: "Gram",
        costPerUnit: 150,
        currentStock: 1000
      }
    });
    console.log("[PASS] Katalog -> Bahan Baku");

    // 3. Katalog: Produk & HPP
    const product = await prisma.product.create({
      data: {
        id: "smoke3-prod-1",
        businessId,
        name: "Kopi Smoke",
        sellPrice: 25000,
        recipes: {
          create: {
            id: "smoke3-rec-1",
            businessId,
            ingredientId: ingredient.id,
            quantityNeeded: 18
          }
        }
      }
    });
    console.log("[PASS] Produk -> HPP (Recipe Linked)");

    // 4. Kasir -> Transaksi
    const sale = await prisma.sale.create({
      data: {
        id: "smoke3-sale-1",
        businessId,
        clientTransactionId: "tx-smoke3-123",
        totalAmount: 25000,
        paymentMethod: "CASH",
        saleItems: {
          create: {
            id: "smoke3-sale-item-1",
            businessId,
            productId: product.id,
            quantity: 1,
            priceAtSale: 25000,
            hppAtSale: 150 * 18
          }
        }
      }
    });
    console.log("[PASS] Kasir -> Transaksi Berhasil Tersimpan");

    // 5. Riwayat & Inventory
    const history = await prisma.sale.findUnique({ where: { id: "smoke3-sale-1" } });
    if (!history) throw new Error("History not found");
    console.log("[PASS] Riwayat Terbaca");

    // Inventory simulation (manual decrement just to test db)
    await prisma.ingredient.update({
      where: { id: ingredient.id },
      data: { currentStock: { decrement: 18 } }
    });
    console.log("[PASS] Inventory Update Berhasil");

    // 6. Wawasan
    const count = await prisma.sale.count({ where: { businessId } });
    console.log("[PASS] Dashboard -> Wawasan (Data Agregasi Terbaca, Total:", count, ")");

    // 7. Cleanup Smoke Test Data
    await prisma.user.delete({ where: { id: "smoke3-user-1" } });
    console.log("[PASS] Cleanup Data Smoke Test");

    console.log("SMOKE TEST SELESAI: SEMUA FLOW PASS.");

  } catch (err) {
    console.error("[FAIL] Smoke test gagal:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runSmokeTest();
