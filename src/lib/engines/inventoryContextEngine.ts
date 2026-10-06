export type ProductInventoryFact = {
  productId: string
  hasRecipe: boolean
  stockAvailable: number | null
  isOutOfStock: boolean
  isLowStock: boolean
  limitingIngredientName?: string
}

export type RecipeInput = {
  productId: string
  quantityNeeded: number
  ingredient: {
    id: string
    name: string
    currentStock: number
    minStock: number
  }
}

export function generateInventoryContext(
  productIds: string[],
  recipes: RecipeInput[]
): Record<string, ProductInventoryFact> {
  const result: Record<string, ProductInventoryFact> = {}

  // Group recipes by productId
  const recipeMap = new Map<string, RecipeInput[]>()
  for (const r of recipes) {
    if (!recipeMap.has(r.productId)) {
      recipeMap.set(r.productId, [])
    }
    recipeMap.get(r.productId)!.push(r)
  }

  for (const pid of productIds) {
    const prodRecipes = recipeMap.get(pid)

    if (!prodRecipes || prodRecipes.length === 0) {
      // Untracked product / No Recipe
      result[pid] = {
        productId: pid,
        hasRecipe: false,
        stockAvailable: null,
        isOutOfStock: false,
        isLowStock: false
      }
      continue
    }

    let minProduces = Infinity
    let isLowStock = false
    let limitingIngName: string | undefined = undefined

    for (const r of prodRecipes) {
      if (r.quantityNeeded <= 0) continue

      const produces = Math.floor(r.ingredient.currentStock / r.quantityNeeded)
      if (produces < minProduces) {
        minProduces = produces
        limitingIngName = r.ingredient.name
      }

      if (r.ingredient.currentStock <= r.ingredient.minStock) {
        isLowStock = true
      }
    }

    // Edge case if somehow all quantityNeeded were 0
    if (minProduces === Infinity) {
      minProduces = 0
    }

    result[pid] = {
      productId: pid,
      hasRecipe: true,
      stockAvailable: minProduces,
      isOutOfStock: minProduces <= 0,
      isLowStock: isLowStock,
      limitingIngredientName: limitingIngName
    }
  }

  return result
}
