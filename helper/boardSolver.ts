// Solver for the color fill game ("Flood-It"). Finds a sequence of color
// moves that captures the whole board, starting from the top-left square.
//
// Strategy:
//   1. Collapse the grid into a graph of same-color regions (the real unit of
//      capture — adjacent same-color squares always flood together).
//   2. Small boards: A* search with an admissible heuristic -> provably
//      optimal solution.
//   3. Large boards (or A* budget exceeded): beam search -> near-optimal.
//
// Usage:
//   const result = solveBoard(colorList);          // flat array, row-major
//   result.moves        -> ColorKey[] to play in order
//   result.provenOptimal -> true when A* completed within budget

export type SolverColorKey = 0 | 1 | 2 | 3 | 4;

const NUM_COLORS = 5;

export interface SolveOptions {
  /** Force a strategy instead of choosing automatically. */
  strategy?: "auto" | "astar" | "beam";
  /** Max A* node expansions before falling back to beam search. */
  maxAStarExpansions?: number;
  /** Max wall-clock ms for A* before falling back to beam search. */
  aStarTimeLimitMs?: number;
  /** Number of candidate states kept per depth in beam search. */
  beamWidth?: number;
}

export interface SolveResult {
  moves: SolverColorKey[];
  moveCount: number;
  /** True when the solution is provably the shortest possible. */
  provenOptimal: boolean;
  strategy: "astar" | "beam";
}

// ---------------------------------------------------------------------------
// Region graph
// ---------------------------------------------------------------------------

interface RegionGraph {
  regionCount: number;
  /** Color of each region. */
  color: Uint8Array;
  /** Cell count of each region. */
  size: Uint16Array;
  /** Adjacent region ids for each region (regions never share a color). */
  neighbors: number[][];
  /** Region containing the top-left square. */
  startRegion: number;
  totalCells: number;
}

export function buildRegionGraph(colors: number[]): RegionGraph {
  const totalCells = colors.length;
  const side = Math.round(Math.sqrt(totalCells));
  if (side * side !== totalCells) {
    throw new Error(`Board must be square, got ${totalCells} cells`);
  }

  const label = new Int16Array(totalCells).fill(-1);
  let regionCount = 0;
  const sizes: number[] = [];
  const regionColors: number[] = [];

  // Label connected same-color components with a BFS flood fill.
  const queue = new Int32Array(totalCells);
  for (let cell = 0; cell < totalCells; cell++) {
    if (label[cell] !== -1) continue;
    const id = regionCount++;
    const color = colors[cell];
    let head = 0;
    let tail = 0;
    queue[tail++] = cell;
    label[cell] = id;
    let cellCount = 0;
    while (head < tail) {
      const cur = queue[head++];
      cellCount++;
      const row = Math.floor(cur / side);
      const col = cur % side;
      if (col > 0 && label[cur - 1] === -1 && colors[cur - 1] === color) {
        label[cur - 1] = id;
        queue[tail++] = cur - 1;
      }
      if (col < side - 1 && label[cur + 1] === -1 && colors[cur + 1] === color) {
        label[cur + 1] = id;
        queue[tail++] = cur + 1;
      }
      if (row > 0 && label[cur - side] === -1 && colors[cur - side] === color) {
        label[cur - side] = id;
        queue[tail++] = cur - side;
      }
      if (row < side - 1 && label[cur + side] === -1 && colors[cur + side] === color) {
        label[cur + side] = id;
        queue[tail++] = cur + side;
      }
    }
    sizes.push(cellCount);
    regionColors.push(color);
  }

  // Region adjacency from cell adjacency.
  const neighborSets: Set<number>[] = Array.from(
    { length: regionCount },
    () => new Set<number>()
  );
  for (let cell = 0; cell < totalCells; cell++) {
    const col = cell % side;
    const a = label[cell];
    if (col < side - 1) {
      const b = label[cell + 1];
      if (a !== b) {
        neighborSets[a].add(b);
        neighborSets[b].add(a);
      }
    }
    if (cell + side < totalCells) {
      const b = label[cell + side];
      if (a !== b) {
        neighborSets[a].add(b);
        neighborSets[b].add(a);
      }
    }
  }

  return {
    regionCount,
    color: Uint8Array.from(regionColors),
    size: Uint16Array.from(sizes),
    neighbors: neighborSets.map((s) => [...s]),
    startRegion: label[0],
    totalCells,
  };
}

// ---------------------------------------------------------------------------
// Captured-set bitmask helpers
// ---------------------------------------------------------------------------

type Mask = Uint32Array;

const hasBit = (mask: Mask, i: number) => (mask[i >> 5] & (1 << (i & 31))) !== 0;
const setBit = (mask: Mask, i: number) => {
  mask[i >> 5] |= 1 << (i & 31);
};
const maskKey = (mask: Mask) => mask.join(",");

/**
 * For every color, the set of uncaptured regions bordering the captured area.
 * These are exactly the regions gained by playing that color (regions of the
 * same color are never adjacent, so one layer is the full flood).
 */
function frontierByColor(graph: RegionGraph, mask: Mask): number[][] {
  const buckets: number[][] = Array.from({ length: NUM_COLORS }, () => []);
  const seen = new Uint8Array(graph.regionCount);
  for (let r = 0; r < graph.regionCount; r++) {
    if (!hasBit(mask, r)) continue;
    for (const nb of graph.neighbors[r]) {
      if (!seen[nb] && !hasBit(mask, nb)) {
        seen[nb] = 1;
        buckets[graph.color[nb]].push(nb);
      }
    }
  }
  return buckets;
}

/**
 * Admissible lower bound on remaining moves:
 *  - every distinct color still on the board needs at least one move, and
 *  - each move grows the border by at most one region layer, so the BFS
 *    distance to the farthest region is also a lower bound.
 */
function lowerBound(graph: RegionGraph, mask: Mask): number {
  const dist = new Int16Array(graph.regionCount).fill(-1);
  const queue = new Int32Array(graph.regionCount);
  let head = 0;
  let tail = 0;
  const colorsSeen = new Uint8Array(NUM_COLORS);
  let distinctColors = 0;
  for (let r = 0; r < graph.regionCount; r++) {
    if (hasBit(mask, r)) {
      dist[r] = 0;
      queue[tail++] = r;
    } else if (!colorsSeen[graph.color[r]]) {
      colorsSeen[graph.color[r]] = 1;
      distinctColors++;
    }
  }
  let maxDist = 0;
  while (head < tail) {
    const cur = queue[head++];
    for (const nb of graph.neighbors[cur]) {
      if (dist[nb] === -1) {
        dist[nb] = dist[cur] + 1;
        if (dist[nb] > maxDist) maxDist = dist[nb];
        queue[tail++] = nb;
      }
    }
  }
  return Math.max(distinctColors, maxDist);
}

// ---------------------------------------------------------------------------
// A* — exact, for small/medium region graphs
// ---------------------------------------------------------------------------

interface AStarNode {
  mask: Mask;
  g: number;
  f: number;
  capturedCells: number;
  parent: number; // index into node arena, -1 for root
  move: number; // color played to reach this node
}

class MinHeap {
  private items: number[] = [];
  constructor(private nodes: AStarNode[]) {}

  get length() {
    return this.items.length;
  }

  private less(a: number, b: number) {
    const na = this.nodes[this.items[a]];
    const nb = this.nodes[this.items[b]];
    // Lower f first; among equal f prefer deeper nodes (closer to a goal).
    return na.f !== nb.f ? na.f < nb.f : na.g > nb.g;
  }

  push(idx: number) {
    this.items.push(idx);
    let i = this.items.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(i, p)) break;
      [this.items[i], this.items[p]] = [this.items[p], this.items[i]];
      i = p;
    }
  }

  pop(): number {
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let best = i;
        if (l < this.items.length && this.less(l, best)) best = l;
        if (r < this.items.length && this.less(r, best)) best = r;
        if (best === i) break;
        [this.items[i], this.items[best]] = [this.items[best], this.items[i]];
        i = best;
      }
    }
    return top;
  }
}

function solveAStar(
  graph: RegionGraph,
  maxExpansions: number,
  timeLimitMs: number
): SolverColorKey[] | null {
  const words = (graph.regionCount + 31) >> 5;
  const startMask = new Uint32Array(words);
  setBit(startMask, graph.startRegion);

  const nodes: AStarNode[] = [];
  const heap = new MinHeap(nodes);
  const bestG = new Map<string, number>();

  const root: AStarNode = {
    mask: startMask,
    g: 0,
    f: lowerBound(graph, startMask),
    capturedCells: graph.size[graph.startRegion],
    parent: -1,
    move: -1,
  };
  nodes.push(root);
  heap.push(0);
  bestG.set(maskKey(startMask), 0);

  const startTime = Date.now();
  let expansions = 0;

  while (heap.length > 0) {
    if (++expansions > maxExpansions) return null;
    if ((expansions & 1023) === 0 && Date.now() - startTime > timeLimitMs) {
      return null;
    }

    const idx = heap.pop();
    const node = nodes[idx];

    if (node.capturedCells === graph.totalCells) {
      // Goal — walk parent pointers to recover the move sequence.
      const moves: SolverColorKey[] = [];
      for (let cur = idx; nodes[cur].parent !== -1; cur = nodes[cur].parent) {
        moves.push(nodes[cur].move as SolverColorKey);
      }
      return moves.reverse();
    }

    // Stale heap entry (already reached this state cheaper).
    const key = maskKey(node.mask);
    if ((bestG.get(key) ?? Infinity) < node.g) continue;

    const buckets = frontierByColor(graph, node.mask);

    // Optimality-preserving reduction: if one move wipes out a color entirely,
    // it never hurts to play it immediately — expand only that move.
    let forcedColor = -1;
    const remainingByColor = new Int32Array(NUM_COLORS);
    for (let r = 0; r < graph.regionCount; r++) {
      if (!hasBit(node.mask, r)) remainingByColor[graph.color[r]]++;
    }
    for (let c = 0; c < NUM_COLORS; c++) {
      if (buckets[c].length > 0 && buckets[c].length === remainingByColor[c]) {
        forcedColor = c;
        break;
      }
    }

    for (let c = 0; c < NUM_COLORS; c++) {
      if (forcedColor !== -1 && c !== forcedColor) continue;
      const gained = buckets[c];
      if (gained.length === 0) continue;

      const newMask = node.mask.slice();
      let gainedCells = 0;
      for (const r of gained) {
        setBit(newMask, r);
        gainedCells += graph.size[r];
      }

      const g = node.g + 1;
      const newKey = maskKey(newMask);
      if ((bestG.get(newKey) ?? Infinity) <= g) continue;
      bestG.set(newKey, g);

      nodes.push({
        mask: newMask,
        g,
        f: g + lowerBound(graph, newMask),
        capturedCells: node.capturedCells + gainedCells,
        parent: idx,
        move: c,
      });
      heap.push(nodes.length - 1);
    }
  }
  return null; // unreachable for valid boards
}

// ---------------------------------------------------------------------------
// Beam search — near-optimal, scales to any board size
// ---------------------------------------------------------------------------

interface BeamState {
  mask: Mask;
  capturedCells: number;
  moves: SolverColorKey[];
  score: number; // g + lower bound, lower is more promising
}

function solveBeam(graph: RegionGraph, beamWidth: number): SolverColorKey[] {
  const words = (graph.regionCount + 31) >> 5;
  const startMask = new Uint32Array(words);
  setBit(startMask, graph.startRegion);

  let level: BeamState[] = [
    {
      mask: startMask,
      capturedCells: graph.size[graph.startRegion],
      moves: [],
      score: lowerBound(graph, startMask),
    },
  ];

  while (true) {
    const next: BeamState[] = [];
    const seen = new Set<string>();
    for (const state of level) {
      const buckets = frontierByColor(graph, state.mask);
      for (let c = 0; c < NUM_COLORS; c++) {
        const gained = buckets[c];
        if (gained.length === 0) continue;

        const newMask = state.mask.slice();
        let gainedCells = 0;
        for (const r of gained) {
          setBit(newMask, r);
          gainedCells += graph.size[r];
        }
        const capturedCells = state.capturedCells + gainedCells;
        const moves = [...state.moves, c as SolverColorKey];

        if (capturedCells === graph.totalCells) {
          return moves; // all states at this depth used the same move count
        }

        const key = maskKey(newMask);
        if (seen.has(key)) continue;
        seen.add(key);

        next.push({
          mask: newMask,
          capturedCells,
          moves,
          score: moves.length + lowerBound(graph, newMask),
        });
      }
    }

    // Keep the most promising states: lowest bound first, then most cells.
    next.sort((a, b) =>
      a.score !== b.score ? a.score - b.score : b.capturedCells - a.capturedCells
    );
    level = next.slice(0, beamWidth);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Solve a board given its flat, row-major color list (the same format
 * squareGenerator consumes). Returns the colors to play in order.
 */
export function solveBoard(
  colors: number[],
  options: SolveOptions = {}
): SolveResult {
  const {
    strategy = "auto",
    maxAStarExpansions = 400_000,
    aStarTimeLimitMs = 10_000,
    beamWidth = 512,
  } = options;

  const graph = buildRegionGraph(colors);

  // Already solved (single-color board).
  if (graph.size[graph.startRegion] === graph.totalCells) {
    return { moves: [], moveCount: 0, provenOptimal: true, strategy: "astar" };
  }

  const tryAStar =
    strategy === "astar" || (strategy === "auto" && graph.regionCount <= 130);

  if (tryAStar) {
    const moves = solveAStar(graph, maxAStarExpansions, aStarTimeLimitMs);
    if (moves) {
      return {
        moves,
        moveCount: moves.length,
        provenOptimal: true,
        strategy: "astar",
      };
    }
  }

  const moves = solveBeam(graph, beamWidth);
  return { moves, moveCount: moves.length, provenOptimal: false, strategy: "beam" };
}

/**
 * Replay a move sequence against a board. Returns true when the moves
 * capture every square — handy for validating solver output.
 */
export function verifySolution(colors: number[], moves: SolverColorKey[]): boolean {
  const graph = buildRegionGraph(colors);
  const words = (graph.regionCount + 31) >> 5;
  const mask = new Uint32Array(words);
  setBit(mask, graph.startRegion);
  let captured = graph.size[graph.startRegion];
  for (const move of moves) {
    const buckets = frontierByColor(graph, mask);
    for (const r of buckets[move]) {
      setBit(mask, r);
      captured += graph.size[r];
    }
  }
  return captured === graph.totalCells;
}
