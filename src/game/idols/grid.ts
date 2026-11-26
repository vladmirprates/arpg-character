/**
 * Placement geometry, knowing nothing about items: a grid whose cells can be blocked, and rectangular
 * pieces placed by their top-left cell. The bag and the idol board are both grids. Cells are numbered
 * row by row from 0.
 */
export interface Shape {
  w: number;
  h: number;
}

export interface GridPlan {
  columns: number;
  rows: number;
  blocked: ReadonlySet<number>;
  empowered: ReadonlySet<number>;
}

/** A piece on a grid: its top-left cell and its size. */
export interface Occupant {
  index: number;
  shape: Shape;
}

export const SINGLE: Shape = { w: 1, h: 1 };

/** A grid with nothing blocked. */
export const openPlan = (columns: number, rows: number): GridPlan => ({
  columns,
  rows,
  blocked: new Set(),
  empowered: new Set(),
});

/** Reads a plan from rows of equal length: "." open, "#" blocked, "*" empowered. */
export function parsePlan(rows: readonly string[]): GridPlan {
  const blocked = new Set<number>();
  const empowered = new Set<number>();
  rows
    .join("")
    .split("")
    .forEach((cell, index) => {
      if (cell === "#") blocked.add(index);
      if (cell === "*") empowered.add(index);
    });
  return { columns: rows[0]?.length ?? 0, rows: rows.length, blocked, empowered };
}

/** The cells a piece covers, or null when it would stick out of the grid. */
export function footprint(plan: GridPlan, index: number, shape: Shape): number[] | null {
  if (!Number.isInteger(index) || index < 0 || index >= plan.columns * plan.rows) return null;
  const x = index % plan.columns;
  const y = Math.floor(index / plan.columns);
  if (x + shape.w > plan.columns || y + shape.h > plan.rows) return null;
  const cells: number[] = [];
  for (let row = y; row < y + shape.h; row++) {
    for (let col = x; col < x + shape.w; col++) cells.push(row * plan.columns + col);
  }
  return cells;
}

/** True when a piece is on the grid and clear of blocked cells, whatever else is there. */
export function isLegal(plan: GridPlan, index: number, shape: Shape): boolean {
  const cells = footprint(plan, index, shape);
  return !!cells && !cells.some((cell) => plan.blocked.has(cell));
}

/** The occupants that a piece at `index` would overlap. */
export function overlapping<T extends Occupant>(plan: GridPlan, occupants: readonly T[], index: number, shape: Shape) {
  const cells = new Set(footprint(plan, index, shape) ?? []);
  return occupants.filter((o) => footprint(plan, o.index, o.shape)?.some((cell) => cells.has(cell)));
}

/** True when a piece can sit at `index` without moving anything. */
export function fits(plan: GridPlan, occupants: readonly Occupant[], index: number, shape: Shape): boolean {
  return isLegal(plan, index, shape) && overlapping(plan, occupants, index, shape).length === 0;
}

/** The first cell, reading row by row, where a piece fits; -1 when there is none. */
export function firstFit(plan: GridPlan, occupants: readonly Occupant[], shape: Shape): number {
  for (let index = 0; index < plan.columns * plan.rows; index++) {
    if (fits(plan, occupants, index, shape)) return index;
  }
  return -1;
}

/**
 * Every legal top-left cell for a piece dropped on `target`, best first: those covering the target,
 * nearest to centring the piece on it. Dropping on a blocked cell or an edge therefore snaps to the
 * closest spot instead of failing. A blocked target accepts only spots right beside it.
 */
export function candidateAnchors(plan: GridPlan, target: number, shape: Shape): number[] {
  const tx = target % plan.columns;
  const ty = Math.floor(target / plan.columns);
  const wantX = tx - Math.floor((shape.w - 1) / 2);
  const wantY = ty - Math.floor((shape.h - 1) / 2);
  const onBlocked = plan.blocked.has(target);
  const found: { index: number; distance: number }[] = [];
  for (let index = 0; index < plan.columns * plan.rows; index++) {
    const cells = footprint(plan, index, shape);
    if (!cells || !isLegal(plan, index, shape)) continue;
    const x = index % plan.columns;
    const y = Math.floor(index / plan.columns);
    const reach = Math.abs(x - tx) + Math.abs(y - ty);
    if (onBlocked ? reach > shape.w + shape.h - 1 : !cells.includes(target)) continue;
    found.push({ index, distance: Math.abs(x - wantX) + Math.abs(y - wantY) });
  }
  return found.sort((a, b) => a.distance - b.distance || a.index - b.index).map((c) => c.index);
}

/** A piece is empowered when any cell it covers is an empowered one. */
export function isEmpowered(plan: GridPlan, index: number, shape: Shape): boolean {
  return (footprint(plan, index, shape) ?? []).some((cell) => plan.empowered.has(cell));
}

/** The bonus an empowered cell grants. */
export const EMPOWERED_PERCENT = 50;
export const empower = (value: number) => Math.floor((value * (100 + EMPOWERED_PERCENT)) / 100);
