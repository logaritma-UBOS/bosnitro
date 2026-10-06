import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  await prisma.product.updateMany({
    where: { supplierId: "NONE" },
    data: { supplierId: null }
  });
  await prisma.ingredient.updateMany({
    where: { supplierId: "NONE" },
    data: { supplierId: null }
  });
  return NextResponse.json({ success: true, message: "Fixed NONE supplierIds" });
}
