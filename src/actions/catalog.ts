"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { updateProductHpp } from "@/lib/engines/hppEngine"
import { redirect } from "next/navigation"
import { trackEvent, logError } from "@/actions/analytics"
import { uploadImage, destroyImage } from "@/lib/cloudinary"

async function getBusinessId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
  const business = await prisma.business.findFirst({ where: whereClause })
  if (!business) throw new Error("Business not found")
  return business.id
}

export async function bulkAssignSupplier(supplierId: string, itemIds: string[], type: 'PRODUCT' | 'INGREDIENT') {
  try {
    const businessId = await getBusinessId()
    
    if (type === 'PRODUCT') {
      await prisma.product.updateMany({
        where: { id: { in: itemIds }, businessId },
        data: { supplierId: supplierId === "NONE" || supplierId === "" ? null : supplierId }
      })
    } else {
      await prisma.ingredient.updateMany({
        where: { id: { in: itemIds }, businessId },
        data: { supplierId: supplierId === "NONE" || supplierId === "" ? null : supplierId }
      })
    }
    
    revalidatePath("/katalog", "layout")
    revalidatePath("/stok", "layout")
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function addIngredient(prevState: any, formData: FormData) {
  try {
    const businessId = await getBusinessId()
    const name = formData.get("name") as string
    const unit = formData.get("unit") as string
    
    const manualCostPerUnit = parseFloat(formData.get("manualCostPerUnit") as string) || 0
    const purchasePrice = parseFloat(formData.get("purchasePrice") as string) || 0
    const purchaseQuantity = parseFloat(formData.get("purchaseQuantity") as string) || 0
    
    let costPerUnit = manualCostPerUnit;
    if (purchasePrice > 0 && purchaseQuantity > 0) {
      costPerUnit = purchasePrice / purchaseQuantity;
    }
    
    // Fallback currentStock to purchaseQuantity if empty
    let currentStock = parseFloat(formData.get("currentStock") as string);
    if (isNaN(currentStock)) {
      currentStock = purchaseQuantity || 0;
    }

    if (!name || !unit) return { error: "Nama dan satuan wajib diisi" }

    const supplierId = formData.get("supplierId") as string;

    await prisma.ingredient.create({
      data: { 
        businessId, 
        name, 
        unit, 
        costPerUnit, 
        currentStock,
        supplierId: supplierId === "NONE" || supplierId === "" ? null : supplierId
      }
    })
    trackEvent(businessId, "catalog_updated", { type: "ingredient_created" }).catch(()=>{})
  } catch (e: any) {
    logError("CATALOG_ERROR", e.message, undefined, e.stack, "/katalog/bahan/tambah").catch(()=>{})
    return { error: e.message }
  }
  redirect("/katalog")
}

export async function addRecipeItem(formData: FormData) {
  try {
    const businessId = await getBusinessId()
    const productId = formData.get("productId") as string
    const ingredientId = formData.get("ingredientId") as string
    const quantityNeeded = parseFloat(formData.get("quantityNeeded") as string) || 0

    // SECURITY: Verifikasi kepemilikan
    const p = await prisma.product.findFirst({ where: { id: productId, businessId } })
    const i = await prisma.ingredient.findFirst({ where: { id: ingredientId, businessId } })
    if (!p || !i) return { error: "Unauthorized" }

    await prisma.recipe.create({
      data: { businessId, productId, ingredientId, quantityNeeded }
    })

    // Trigger HPP Engine
    await updateProductHpp(productId)
    trackEvent(businessId, "hpp_created", { productId }).catch(()=>{})

  } catch (e: any) {
    return { error: e.message }
  }
  revalidatePath(`/katalog/produk/${formData.get("productId")}`, "layout")
  return { success: true }
}

export async function addProduct(prevState: any, formData: FormData) {
  try {
    const businessId = await getBusinessId()
    const name = formData.get("name") as string
    const sellPrice = parseFloat(formData.get("sellPrice") as string) || 0
    if (!name || sellPrice <= 0) return { error: "Nama dan Harga Jual wajib diisi" }
    
    // Process image
    const image = formData.get("image") as File | null
    let imageUrl = null
    let imagePublicId = null
    
    if (image && image.size > 0) {
      if (image.size > 5 * 1024 * 1024) return { error: "Ukuran foto maksimal 5MB" }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
        return { error: "Format foto harus JPG, PNG, atau WebP" }
      }
      
      const uploaded = await uploadImage(image)
      if (uploaded) {
        imageUrl = uploaded.secure_url
        imagePublicId = uploaded.public_id
      }
    }
    
    const itemType = formData.get("itemType") as string
    let hasBOM = false
    let trackInventory = false
    let isPurchasable = false
    let purchaseCost = 0
    let initialStock = 0

    if (itemType === "BOM") {
      hasBOM = true
    } else if (itemType === "RETAIL") {
      trackInventory = true
      isPurchasable = true
      purchaseCost = parseFloat(formData.get("purchaseCost") as string) || 0
      initialStock = parseFloat(formData.get("initialStock") as string) || 0
    }

    const calculatedHpp = itemType === "RETAIL" ? purchaseCost : 0
    const calculatedMargin = sellPrice > 0 ? ((sellPrice - calculatedHpp) / sellPrice) * 100 : 0

    await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          businessId,
          name,
          sellPrice,
          hasBOM,
          trackInventory,
          isPurchasable,
          purchaseCost,
          calculatedHpp,
          calculatedMargin,
          imageUrl,
          imagePublicId,
          supplierId: (formData.get("supplierId") as string) || null,
        }
      })

      if (itemType === "RETAIL" && initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            businessId,
            productId: p.id,
            type: "IN",
            quantity: initialStock,
            referenceType: "ADJUSTMENT"
          }
        })
      }

      // Pemrosesan Dinamis untuk Bahan Baku (BOM / Racikan)
      if (itemType === "BOM") {
        const iNames = formData.getAll("ingredientName") as string[]
        const iUnits = formData.getAll("ingredientUnit") as string[]
        const iPurchaseQtys = formData.getAll("ingredientPurchaseQty") as string[]
        const iPurchaseTotals = formData.getAll("ingredientPurchaseTotal") as string[]
        const iRecipeQtys = formData.getAll("ingredientRecipeQty") as string[]
        const recipeYield = parseFloat(formData.get("recipeYield") as string) || 1
        
        let totalHppPerPortion = 0;

        for (let i = 0; i < iNames.length; i++) {
          const iname = iNames[i]?.trim()
          const iunit = iUnits[i]?.trim() || "Unit"
          const pQty = parseFloat(iPurchaseQtys[i]) || 0
          const pTotal = parseFloat(iPurchaseTotals[i]) || 0
          const rQty = parseFloat(iRecipeQtys[i]) || 0

          if (iname && pQty > 0 && rQty > 0) {
            const costPerUnit = pTotal / pQty;
            const qtyPerPortion = rQty / recipeYield;

            // Cari bahan baku dengan nama yang sama persis (case insensitive)
            let ingredient = await tx.ingredient.findFirst({
              where: { businessId, name: { equals: iname } } 
            });

            // Jika belum ada, buatkan otomatis
            if (!ingredient) {
              ingredient = await tx.ingredient.create({
                data: {
                  businessId,
                  name: iname,
                  unit: iunit,
                  costPerUnit: costPerUnit,
                  currentStock: pQty // Sisa akan tetap jadi stok karena dibeli full
                }
              });
              
              await tx.stockMovement.create({
                data: {
                  businessId,
                  ingredientId: ingredient.id,
                  type: "IN",
                  quantity: pQty,
                  referenceType: "PURCHASE"
                }
              });
            } else {
              // Jika bahan sudah ada, update harga modal jika baru, dan tambah stok dari belanjanya
              ingredient = await tx.ingredient.update({
                where: { id: ingredient.id },
                data: { 
                  unit: iunit, // update satuan jika diganti
                  costPerUnit: costPerUnit,
                  currentStock: ingredient.currentStock + pQty
                }
              });
              
              await tx.stockMovement.create({
                data: {
                  businessId,
                  ingredientId: ingredient.id,
                  type: "IN",
                  quantity: pQty,
                  referenceType: "PURCHASE"
                }
              });
            }

            // Gabungkan produk & bahan jadi resep per 1 porsi jual
            await tx.recipe.create({
              data: {
                businessId,
                productId: p.id,
                ingredientId: ingredient.id,
                quantityNeeded: qtyPerPortion
              }
            });

            totalHppPerPortion += (costPerUnit * qtyPerPortion);
          }
        }

        // Hitung ulang HPP dan margin total
        if (totalHppPerPortion > 0) {
          const marginBOM = sellPrice > 0 ? ((sellPrice - totalHppPerPortion) / sellPrice) * 100 : 0;
          await tx.product.update({
            where: { id: p.id },
            data: { 
              calculatedHpp: totalHppPerPortion,
              calculatedMargin: marginBOM
            }
          });
        }
      }
    })

    trackEvent(businessId, "product_created", { name }).catch(()=>{})
  } catch (e: any) {
    logError("CATALOG_ERROR", e.message, undefined, e.stack, "/katalog/produk/tambah").catch(()=>{})
    return { error: e.message }
  }
  revalidatePath("/katalog", "layout")
  redirect("/katalog")
}

export async function editProduct(prevState: any, formData: FormData) {
  try {
    const businessId = await getBusinessId()
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const sellPrice = parseFloat(formData.get("sellPrice") as string) || 0
    if (!name || sellPrice <= 0) return { error: "Nama dan Harga Jual wajib diisi" }
    
    // SECURITY: Verifikasi kepemilikan
    const existing = await prisma.product.findFirst({ where: { id, businessId } })
    if (!existing) return { error: "Unauthorized" }

    const isRetail = !existing.hasBOM && existing.trackInventory;
    const updateData: any = { 
      name, 
      sellPrice,
    };
    if (formData.has("supplierId")) {
      const val = formData.get("supplierId") as string;
        updateData.supplierId = (val === "NONE" || val === "") ? null : val;
    }

    if (isRetail) {
      const newCost = parseFloat(formData.get("purchaseCost") as string) || 0;
      updateData.purchaseCost = newCost;
      updateData.calculatedHpp = newCost;
      updateData.calculatedMargin = sellPrice > 0 ? ((sellPrice - newCost) / sellPrice) * 100 : 0;
    }

    // Process image
    const image = formData.get("image") as File | null
    if (image && image.size > 0) {
      if (image.size > 5 * 1024 * 1024) return { error: "Ukuran foto maksimal 5MB" }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
        return { error: "Format foto harus JPG, PNG, atau WebP" }
      }
      
      const uploaded = await uploadImage(image)
      if (uploaded) {
        updateData.imageUrl = uploaded.secure_url
        updateData.imagePublicId = uploaded.public_id
        
        if (existing.imagePublicId) {
          await destroyImage(existing.imagePublicId)
        }
      }
    }

    await prisma.product.update({ where: { id }, data: updateData })
    
    if (existing.hasBOM) {
      await updateProductHpp(id)
    }
  } catch (e: any) {
    return { error: e.message }
  }
  revalidatePath("/katalog", "layout")
  redirect("/katalog")
}

export async function editIngredient(prevState: any, formData: FormData) {
  try {
    const businessId = await getBusinessId()
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const unit = formData.get("unit") as string
    
    const manualCostPerUnit = parseFloat(formData.get("manualCostPerUnit") as string) || 0
    const purchasePrice = parseFloat(formData.get("purchasePrice") as string) || 0
    const purchaseQuantity = parseFloat(formData.get("purchaseQuantity") as string) || 0
    
    let costPerUnit = manualCostPerUnit;
    if (purchasePrice > 0 && purchaseQuantity > 0) {
      costPerUnit = purchasePrice / purchaseQuantity;
    }
    
    const currentStock = parseFloat(formData.get("currentStock") as string) || 0
    if (!name || !unit) return { error: "Nama dan Satuan wajib diisi" }
    
    // SECURITY: Verifikasi kepemilikan
    const existing = await prisma.ingredient.findFirst({ where: { id, businessId } })
    if (!existing) return { error: "Unauthorized" }

    const updateData: any = { name, unit, costPerUnit, currentStock };
    if (formData.has("supplierId")) {
      const val = formData.get("supplierId") as string;
        updateData.supplierId = (val === "NONE" || val === "") ? null : val;
    }
    await prisma.ingredient.update({ 
      where: { id }, 
      data: updateData 
    })
    
    // Auto update HPP for all products using this ingredient
    const recipes = await prisma.recipe.findMany({ where: { ingredientId: id } })
    for (const r of recipes) {
      await updateProductHpp(r.productId)
    }
  } catch (e: any) {
    return { error: e.message }
  }
  revalidatePath("/katalog", "layout")
  redirect("/katalog")
}

export async function deleteProductSecure(id: string) {
  const businessId = await getBusinessId()
  await prisma.product.deleteMany({ where: { id, businessId } })
  revalidatePath("/katalog", "layout")
}

export async function deleteIngredientSecure(id: string) {
  const businessId = await getBusinessId()
  await prisma.ingredient.deleteMany({ where: { id, businessId } })
  revalidatePath("/katalog", "layout")
}

export async function deleteRecipeItemSecure(id: string, productId: string) {
  const businessId = await getBusinessId()
  // Ensure the recipe belongs to this business (by joining product)
  const product = await prisma.product.findFirst({ where: { id: productId, businessId } })
  if (product) {
    await prisma.recipe.deleteMany({ where: { id, productId: product.id } })
    await updateProductHpp(productId)
  }
  revalidatePath(`/katalog/produk/${productId}`, "layout")
}

