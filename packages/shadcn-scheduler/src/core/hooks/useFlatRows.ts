import { useMemo } from "react"
import type { Resource, FlatRow } from "../types"

/**
 * Computes the flat virtualizer row array for the employee-per-row tree model.
 *
 * For each category:
 *   1. Emit a "category" header row (always visible)
 *   2. If not collapsed, emit one "employee" row per employee in that category
 *
 * The result drives useVirtualizer: one item per FlatRow.
 *
 * Usage:
 *   const flatRows = useFlatRows(CATEGORIES, ALL_EMPLOYEES, collapsed)
 *   const virtualizer = useVirtualizer({ count: flatRows.length, ... })
 */
export function useFlatRows(
  categories: Resource[],
  employees: Resource[],
  collapsed: Set<string>,
): FlatRow[] {
  return useMemo(() => {
    const rows: FlatRow[] = []
    for (const cat of categories) {
      // Category header row
      rows.push({
        key: `cat:${cat.id}`,
        kind: "category",
        category: cat,
        depth: 0,
      })
      // Employee rows — skip if category is collapsed
      if (!collapsed.has(cat.id)) {
        const catEmployees = employees.filter((e) => e.categoryId === cat.id)
        for (const emp of catEmployees) {
          rows.push({
            key: `emp:${cat.id}:${emp.id}`,
            kind: "employee",
            category: cat,
            employee: emp,
            depth: 1,
          })
        }
      }
    }
    return rows
  }, [categories, employees, collapsed])
}

/**
 * Given a flat row array and the virtualizer's measured item sizes,
 * builds a map from categoryId → top pixel offset of first employee row in that category.
 * Used by dragEngine.getCategoryAtY and getCategoryAtY in GridView.
 */
export function buildFlatRowTops(
  flatRows: FlatRow[],
  getItemOffset: (index: number) => number,
): Record<string, number> {
  const tops: Record<string, number> = {}
  flatRows.forEach((row, i) => {
    if (row.kind === "employee" && row.employee) {
      // Key by employeeId for per-employee targeting
      tops[`emp:${row.employee.id}`] = getItemOffset(i)
    } else if (row.kind === "category") {
      tops[`cat:${row.category.id}`] = getItemOffset(i)
    }
  })
  return tops
}
