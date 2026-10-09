const fs = require('fs');
let code = fs.readFileSync('src/actions/inventory.ts', 'utf8');

// 1. Fix recordStockMovement
const rsTarget = `      // 2. Update actual stock in Ingredient
      if (data.ingredientId) {
        const item = await tx.ingredient.findUnique({ where: { id: data.ingredientId } })
        if (!item) throw new Error("Bahan tidak ditemukan")

        let newStock = item.currentStock
        if (data.type === "IN") {
          newStock += data.quantity
        } else if (data.type === "OUT" || data.type === "RETURN" || data.type === "WASTE") {
          newStock -= data.quantity
          if (newStock < 0) newStock = 0
        }

        await tx.ingredient.update({
          where: { id: data.ingredientId },
          data: { 
             currentStock: newStock,
             ...(data.supplierId && data.type === "IN" ? { supplierId: data.supplierId } : {})
          }
        })
      }`;

const rsReplacement = `      // 2. Update actual stock
      if (data.ingredientId) {
        const item = await tx.ingredient.findUnique({ where: { id: data.ingredientId } })
        if (!item) throw new Error("Bahan tidak ditemukan")

        let newStock = item.currentStock
        if (data.type === "IN") {
          newStock += data.quantity
        } else if (data.type === "OUT" || data.type === "RETURN" || data.type === "WASTE") {
          newStock -= data.quantity
          if (newStock < 0) newStock = 0
        }

        await tx.ingredient.update({
          where: { id: data.ingredientId },
          data: { 
             currentStock: newStock,
             ...(data.supplierId && data.type === "IN" ? { supplierId: data.supplierId } : {})
          }
        })
      } else if (data.productId) {
        const item = await tx.product.findUnique({ where: { id: data.productId } })
        if (!item) throw new Error("Barang tidak ditemukan")

        let newStock = item.currentStock
        if (data.type === "IN") {
          newStock += data.quantity
        } else if (data.type === "OUT" || data.type === "RETURN" || data.type === "WASTE") {
          newStock -= data.quantity
          if (newStock < 0) newStock = 0
        }

        await tx.product.update({
          where: { id: data.productId },
          data: { 
             currentStock: newStock,
             ...(data.supplierId && data.type === "IN" ? { supplierId: data.supplierId } : {})
          }
        })
      }`;

code = code.replace(rsTarget, rsReplacement);

// 2. Fix recordBulkStockMovement
const rbTarget = `        // 2. Update actual stock in Ingredient if applicable
        if (itemData.ingredientId) {
          const item = await tx.ingredient.findUnique({ where: { id: itemData.ingredientId } })
          if (!item) throw new Error("Bahan tidak ditemukan")

          let newStock = item.currentStock
          if (data.type === "IN") {
            newStock += itemData.quantity
          } else {
            newStock -= itemData.quantity
          }

          if (newStock < 0) newStock = 0

          await tx.ingredient.update({
            where: { id: item.id },
            data: { 
               currentStock: newStock,
               ...(data.supplierId && data.type === "IN" ? { supplierId: data.supplierId } : {})
            }
          })
        } else if (itemData.productId && data.supplierId && data.type === "IN") {
           await tx.product.update({
              where: { id: itemData.productId },
              data: { supplierId: data.supplierId }
           })
        }`;

const rbReplacement = `        // 2. Update actual stock
        if (itemData.ingredientId) {
          const item = await tx.ingredient.findUnique({ where: { id: itemData.ingredientId } })
          if (!item) throw new Error("Bahan tidak ditemukan")

          let newStock = item.currentStock
          if (data.type === "IN") {
            newStock += itemData.quantity
          } else {
            newStock -= itemData.quantity
          }

          if (newStock < 0) newStock = 0

          await tx.ingredient.update({
            where: { id: item.id },
            data: { 
               currentStock: newStock,
               ...(data.supplierId && data.type === "IN" ? { supplierId: data.supplierId } : {})
            }
          })
        } else if (itemData.productId) {
          const item = await tx.product.findUnique({ where: { id: itemData.productId } })
          if (!item) throw new Error("Barang tidak ditemukan")

          let newStock = item.currentStock
          if (data.type === "IN") {
            newStock += itemData.quantity
          } else {
            newStock -= itemData.quantity
          }

          if (newStock < 0) newStock = 0

          await tx.product.update({
            where: { id: item.id },
            data: { 
               currentStock: newStock,
               ...(data.supplierId && data.type === "IN" ? { supplierId: data.supplierId } : {})
            }
          })
        }`;

code = code.replace(rbTarget, rbReplacement);

fs.writeFileSync('src/actions/inventory.ts', code);
