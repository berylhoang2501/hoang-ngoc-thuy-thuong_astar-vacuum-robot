const DIRECTIONS = [
  { action: 'MOVE_LEFT', dx: -1, dy: 0 },
  { action: 'MOVE_RIGHT', dx: 1, dy: 0 },
  { action: 'MOVE_UP', dx: 0, dy: 1 },
  { action: 'MOVE_DOWN', dx: 0, dy: -1 },
];

export const cellKey = (x, y) => `${x},${y}`;

const normalizeDirty = (dirtyCells) =>
  [...dirtyCells].sort((a, b) => {
    const [ax, ay] = a.split(',').map(Number);
    const [bx, by] = b.split(',').map(Number);
    return ay - by || ax - bx;
  });

const stateKey = (state) =>
  `${state.x},${state.y}|${normalizeDirty(state.dirty).join(';')}`;

const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export function heuristic(state) {
  const dirty = normalizeDirty(state.dirty);
  const k = dirty.length;
  if (k === 0) return 0;

  const minimumDistance = Math.min(
    ...dirty.map((key) => {
      const [x, y] = key.split(',').map(Number);
      return manhattan(state, { x, y });
    })
  );

  const minimumSuckCost = (k * (k + 1)) / 2;
  const minimumMoveCost = minimumDistance * (k + 1);
  return minimumSuckCost + minimumMoveCost;
}

function successors(state, rows, cols) {
  const output = [];
  const currentKey = cellKey(state.x, state.y);

  if (state.dirty.has(currentKey)) {
    const nextDirty = new Set(state.dirty);
    nextDirty.delete(currentKey);
    output.push({
      action: 'SUCK',
      stepCost: 1 + nextDirty.size,
      state: { x: state.x, y: state.y, dirty: nextDirty },
    });
  }

  DIRECTIONS.forEach(({ action, dx, dy }) => {
    const x = state.x + dx;
    const y = state.y + dy;
    if (x >= 1 && x <= cols && y >= 1 && y <= rows) {
      output.push({
        action,
        stepCost: 1 + state.dirty.size,
        state: { x, y, dirty: new Set(state.dirty) },
      });
    }
  });

  return output;
}

function reconstruct(goalKey, parent, stateByKey) {
  const states = [];
  const actions = [];
  const stepCosts = [];
  let key = goalKey;

  while (key !== null) {
    states.push(stateByKey.get(key));
    const edge = parent.get(key);
    if (!edge) break;
    actions.push(edge.action);
    stepCosts.push(edge.stepCost);
    key = edge.previousKey;
  }

  states.reverse();
  actions.reverse();
  stepCosts.reverse();
  return { states, actions, stepCosts };
}

export function solveVacuumAStar({
  rows,
  cols,
  start,
  dirtyCells,
  maxExpansions = 200000,
}) {
  const initial = {
    x: start.x,
    y: start.y,
    dirty: new Set(dirtyCells),
  };

  const initialKey = stateKey(initial);
  const open = [
    {
      key: initialKey,
      state: initial,
      g: 0,
      h: heuristic(initial),
      f: heuristic(initial),
      order: 0,
    },
  ];

  const gScore = new Map([[initialKey, 0]]);
  const parent = new Map([[initialKey, null]]);
  const stateByKey = new Map([[initialKey, initial]]);
  const visitedStateKeys = [];
  const visitedPositions = [];
  let generatedNodes = 0;
  let expandedNodes = 0;
  let insertionOrder = 1;

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f || a.h - b.h || a.order - b.order);
    const current = open.shift();

    if (current.g !== gScore.get(current.key)) continue;

    if (current.state.dirty.size === 0) {
      const solution = reconstruct(current.key, parent, stateByKey);
      return {
        found: true,
        ...solution,
        totalCost: current.g,
        expandedNodes,
        generatedNodes,
        visitedStateKeys,
        visitedPositions,
        message: 'Đã tìm thấy lời giải tối ưu.',
      };
    }

    expandedNodes += 1;
    visitedStateKeys.push(current.key);
    visitedPositions.push(cellKey(current.state.x, current.state.y));

    if (expandedNodes >= maxExpansions) {
      return {
        found: false,
        states: [],
        actions: [],
        stepCosts: [],
        totalCost: Infinity,
        expandedNodes,
        generatedNodes,
        visitedStateKeys,
        visitedPositions,
        message: 'Đã đạt giới hạn node mở rộng. Hãy giảm số ô dirty.',
      };
    }

    const nextStates = successors(current.state, rows, cols);
    for (const next of nextStates) {
      generatedNodes += 1;
      const key = stateKey(next.state);
      const tentativeG = current.g + next.stepCost;

      if (tentativeG < (gScore.get(key) ?? Infinity)) {
        const h = heuristic(next.state);
        gScore.set(key, tentativeG);
        parent.set(key, {
          previousKey: current.key,
          action: next.action,
          stepCost: next.stepCost,
        });
        stateByKey.set(key, next.state);
        open.push({
          key,
          state: next.state,
          g: tentativeG,
          h,
          f: tentativeG + h,
          order: insertionOrder,
        });
        insertionOrder += 1;
      }
    }
  }

  return {
    found: false,
    states: [],
    actions: [],
    stepCosts: [],
    totalCost: Infinity,
    expandedNodes,
    generatedNodes,
    visitedStateKeys,
    visitedPositions,
    message: 'Không tìm thấy lời giải.',
  };
}

export function seededRandom(seed) {
  let value = Number(seed) || 1;
  return function random() {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateRandomDirty({
  rows,
  cols,
  count,
  start,
  seed = 15,
  excludeStart = true,
}) {
  const available = [];
  for (let y = 1; y <= rows; y += 1) {
    for (let x = 1; x <= cols; x += 1) {
      if (excludeStart && x === start.x && y === start.y) continue;
      available.push(cellKey(x, y));
    }
  }

  if (count < 0 || count > available.length) {
    throw new Error(`Số ô dirty phải nằm trong khoảng 0–${available.length}.`);
  }

  const random = seededRandom(seed);
  for (let index = available.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [available[index], available[swapIndex]] = [available[swapIndex], available[index]];
  }
  return new Set(available.slice(0, count));
}

export function parseCsvDirty(text, rows, cols) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) throw new Error('File CSV đang rỗng.');

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const first = lines[0].split(delimiter).map((v) => v.trim().toLowerCase());
  const hasHeader = first.includes('x') && first.includes('y');
  const xIndex = hasHeader ? first.indexOf('x') : 0;
  const yIndex = hasHeader ? first.indexOf('y') : 1;
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const dirty = new Set();

  dataLines.forEach((line, index) => {
    const cells = line.split(delimiter).map((v) => v.trim());
    const x = Number(cells[xIndex]);
    const y = Number(cells[yIndex]);

    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      throw new Error(`Dòng ${index + (hasHeader ? 2 : 1)} có tọa độ không hợp lệ.`);
    }
    if (x < 1 || x > cols || y < 1 || y > rows) {
      throw new Error(`Tọa độ (${x}, ${y}) nằm ngoài ma trận.`);
    }
    dirty.add(cellKey(x, y));
  });

  return dirty;
}
