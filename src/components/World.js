import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as XLSX from 'xlsx';
import Controls from './Controls';
import VacuumScene from './VacuumScene';
import {
  cellKey,
  generateRandomDirty,
  parseCsvDirty,
  solveVacuumAStar,
} from './algorithms/vacuumAStar';

const DEFAULT_CONFIG = {
  rows: 8,
  cols: 10,
  startX: 1,
  startY: 1,
  dirtyCount: 6,
  seed: 15,
  excludeStart: true,
  maxExpansions: 200000,
};

const SPEEDS = {
  fast: 220,
  normal: 520,
  slow: 950,
};

const STUDENT_NAME = 'Hoàng Ngọc Thủy Thương';
const PROJECT_TITLE = 'Final Project — A* Search for a Vacuum-Cleaner Robot';
const INSTRUCTOR_NAME = 'Dr. Nguyễn An Tế';

function ensureInteger(value, label, min, max) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${label} must be an integer between ${min} and ${max}.`);
  }
  return number;
}

function readExcelDirty(arrayBuffer, rows, cols) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
  if (data.length === 0) throw new Error('The Excel file is empty.');

  const dirty = new Set();
  data.forEach((raw, index) => {
    const normalized = Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [String(key).trim().toLowerCase(), value])
    );
    const x = Number(normalized.x);
    const y = Number(normalized.y);
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      throw new Error(`Row ${index + 2} must contain integer values in the x and y columns.`);
    }
    if (x < 1 || x > cols || y < 1 || y > rows) {
      throw new Error(`Coordinate (${x}, ${y}) is outside the grid.`);
    }
    dirty.add(cellKey(x, y));
  });
  return dirty;
}

function downloadText(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function World() {
  const [draft, setDraft] = useState(DEFAULT_CONFIG);
  const [world, setWorld] = useState({
    rows: DEFAULT_CONFIG.rows,
    cols: DEFAULT_CONFIG.cols,
    start: { x: DEFAULT_CONFIG.startX, y: DEFAULT_CONFIG.startY },
  });
  const [sourceMode, setSourceMode] = useState('random');
  const [initialDirty, setInitialDirty] = useState(() =>
    generateRandomDirty({
      rows: DEFAULT_CONFIG.rows,
      cols: DEFAULT_CONFIG.cols,
      count: DEFAULT_CONFIG.dirtyCount,
      start: { x: DEFAULT_CONFIG.startX, y: DEFAULT_CONFIG.startY },
      seed: DEFAULT_CONFIG.seed,
      excludeStart: DEFAULT_CONFIG.excludeStart,
    })
  );
  const [importedDirty, setImportedDirty] = useState(null);
  const [importedFileName, setImportedFileName] = useState('');
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('fast');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [resetCameraToken, setResetCameraToken] = useState(0);
  const [status, setStatus] = useState({
    type: 'ready',
    text: 'Configure the world, then select “Visualize” to run A*.',
  });
  const fileInputRef = useRef();

  const currentState = result?.found
    ? result.states[Math.min(currentStep, result.states.length - 1)]
    : { x: world.start.x, y: world.start.y, dirty: initialDirty };

  const cumulativeCost = result?.found
    ? result.stepCosts.slice(0, currentStep).reduce((sum, value) => sum + value, 0)
    : 0;

  const currentAction = currentStep === 0
    ? 'START'
    : result?.actions[currentStep - 1] || '—';

  const maximumStep = result?.found ? result.actions.length : 0;

  const actionRows = useMemo(() => {
    if (!result?.found) return [];
    let cumulative = 0;
    return result.actions.map((action, index) => {
      cumulative += result.stepCosts[index];
      const state = result.states[index + 1];
      return {
        step: index + 1,
        action,
        position: `(${state.x}, ${state.y})`,
        remaining: state.dirty.size,
        stepCost: result.stepCosts[index],
        cumulative,
      };
    });
  }, [result]);

  useEffect(() => {
    if (!isPlaying || !result?.found) return undefined;
    if (currentStep >= maximumStep) {
      setIsPlaying(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCurrentStep((step) => Math.min(step + 1, maximumStep));
    }, SPEEDS[speed]);
    return () => window.clearTimeout(timer);
  }, [isPlaying, result, currentStep, maximumStep, speed]);

  function updateDraft(field, value) {
    setDraft((previous) => ({ ...previous, [field]: value }));
  }

  function validateDraft() {
    const rows = ensureInteger(draft.rows, 'Row count m', 2, 20);
    const cols = ensureInteger(draft.cols, 'Column count n', 2, 20);
    const startX = ensureInteger(draft.startX, 'Robot x-coordinate', 1, cols);
    const startY = ensureInteger(draft.startY, 'Robot y-coordinate', 1, rows);
    const dirtyCount = ensureInteger(draft.dirtyCount, 'Dirty-cell count', 0, rows * cols);
    const seed = ensureInteger(draft.seed, 'Random seed', -999999, 999999);
    const maxExpansions = ensureInteger(
      draft.maxExpansions,
      'Expansion limit',
      100,
      2000000
    );
    return {
      rows,
      cols,
      startX,
      startY,
      dirtyCount,
      seed,
      maxExpansions,
      excludeStart: Boolean(draft.excludeStart),
    };
  }

  function setupWorld() {
    try {
      const config = validateDraft();
      const start = { x: config.startX, y: config.startY };
      let dirty;

      if (sourceMode === 'random') {
        dirty = generateRandomDirty({
          rows: config.rows,
          cols: config.cols,
          count: config.dirtyCount,
          start,
          seed: config.seed,
          excludeStart: config.excludeStart,
        });
      } else {
        if (!importedDirty) {
          throw new Error('Select a CSV or Excel file before building the world.');
        }
        dirty = new Set(importedDirty);
        dirty.forEach((key) => {
          const [x, y] = key.split(',').map(Number);
          if (x < 1 || x > config.cols || y < 1 || y > config.rows) {
            throw new Error(`Coordinate (${x}, ${y}) from the file is outside the current grid.`);
          }
        });
      }

      setWorld({ rows: config.rows, cols: config.cols, start });
      setInitialDirty(dirty);
      setResult(null);
      setCurrentStep(0);
      setIsPlaying(false);
      setResetCameraToken((value) => value + 1);
      setStatus({
        type: 'success',
        text: `World created: ${config.rows} × ${config.cols} grid with ${dirty.size} dirty cells.`,
      });
    } catch (error) {
      setStatus({ type: 'error', text: error.message });
    }
  }

  function visualize() {
    try {
      const config = validateDraft();
      setIsPlaying(false);
      setStatus({ type: 'running', text: 'Running A* search…' });

      window.setTimeout(() => {
        const solution = solveVacuumAStar({
          rows: world.rows,
          cols: world.cols,
          start: world.start,
          dirtyCells: initialDirty,
          maxExpansions: config.maxExpansions,
        });
        setResult(solution);
        setCurrentStep(0);
        if (solution.found) {
          setStatus({
            type: 'success',
            text: `Optimal solution found: ${solution.actions.length} actions with a total cost of ${solution.totalCost}.`,
          });
          setIsPlaying(true);
        } else {
          setStatus({ type: 'error', text: solution.message });
        }
      }, 40);
    } catch (error) {
      setStatus({ type: 'error', text: error.message });
    }
  }

  function clearPath() {
    setResult(null);
    setCurrentStep(0);
    setIsPlaying(false);
    setStatus({ type: 'ready', text: 'The route was cleared. The grid and dirty cells were preserved.' });
  }

  function resetAgent() {
    setCurrentStep(0);
    setIsPlaying(false);
    setStatus({ type: 'ready', text: 'The robot returned to the initial state.' });
  }

  async function handleFile(file) {
    if (!file) return;
    try {
      const config = validateDraft();
      let dirty;
      if (file.name.toLowerCase().endsWith('.csv')) {
        dirty = parseCsvDirty(await file.text(), config.rows, config.cols);
      } else if (/\.xlsx?$/i.test(file.name)) {
        dirty = readExcelDirty(await file.arrayBuffer(), config.rows, config.cols);
      } else {
        throw new Error('Only CSV, XLS, and XLSX files are supported.');
      }
      setImportedDirty(dirty);
      setImportedFileName(file.name);
      setSourceMode('file');
      setStatus({
        type: 'success',
        text: `Loaded ${dirty.size} dirty-cell coordinates from “${file.name}”. Select “Build World” to apply them.`,
      });
    } catch (error) {
      setImportedDirty(null);
      setImportedFileName('');
      setStatus({ type: 'error', text: error.message });
    }
  }

  function downloadCsvTemplate() {
    const content = 'x,y\n1,1\n4,2\n3,4\n';
    downloadText(
      'dirty_cells_template.csv',
      content,
      'text/csv;charset=utf-8'
    );
    setStatus({
      type: 'success',
      text: 'CSV template downloaded. Keep the x and y column names unchanged.',
    });
  }

  function downloadExcelTemplate() {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['x', 'y'],
      [1, 1],
      [4, 2],
      [3, 4],
    ]);
    worksheet['!cols'] = [{ wch: 12 }, { wch: 12 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'dirty_cells');
    XLSX.writeFile(workbook, 'dirty_cells_template.xlsx');
    setStatus({
      type: 'success',
      text: 'Excel template downloaded. Keep the x and y column names unchanged.',
    });
  }

  function exportResult() {
    if (!result?.found) {
      setStatus({ type: 'error', text: 'There is no solution to export yet.' });
      return;
    }
    const header = 'step,action,x,y,remaining_dirty,step_cost,cumulative_cost\n';
    const content = actionRows
      .map((row) => {
        const state = result.states[row.step];
        return [
          row.step,
          row.action,
          state.x,
          state.y,
          row.remaining,
          row.stepCost,
          row.cumulative,
        ].join(',');
      })
      .join('\n');
    downloadText('Hoang_Ngoc_Thuy_Thuong_AStar_Result.csv', header + content, 'text/csv;charset=utf-8');
  }

  return (
    <main className="vacuum-app">
      <header className="top-toolbar">
        <div className="brand-block">
          <span className="brand-robot">◉</span>
          <div>
            <strong>A* Vacuum Robot</strong>
            <small>Final Project · {STUDENT_NAME}</small>
          </div>
        </div>

        <select className="toolbar-select" value="astar" disabled aria-label="Algorithm">
          <option value="astar">A* Search</option>
        </select>

        <select
          className="toolbar-select source-select"
          value={sourceMode}
          onChange={(event) => {
            setSourceMode(event.target.value);
            setSettingsOpen(true);
          }}
          aria-label="Dirty-cell source"
        >
          <option value="random">Random Dirty</option>
          <option value="file">CSV / Excel</option>
        </select>

        <button
          className={`toolbar-button primary settings-button ${settingsOpen ? 'active' : ''}`}
          onClick={() => setSettingsOpen((open) => !open)}
          title="Open world settings"
        >
          ⚙ World Settings
        </button>

        <button className="toolbar-button secondary" onClick={visualize}>
          Visualize
        </button>
        <button className="toolbar-button secondary" onClick={clearPath}>
          Clear Path
        </button>

        <select
          className="toolbar-select speed-select"
          value={speed}
          onChange={(event) => setSpeed(event.target.value)}
          aria-label="Animation speed"
        >
          <option value="fast">Fast</option>
          <option value="normal">Normal</option>
          <option value="slow">Slow</option>
        </select>

        <button className="toolbar-button primary" onClick={resetAgent}>
          Reset Agent
        </button>
      </header>

      <section className={`status-banner ${status.type}`}>{status.text}</section>

      <section className="scene-shell">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [110, 120, 140], fov: 48, near: 0.1, far: 5000 }}
          gl={{ antialias: true, alpha: false }}
        >
          <VacuumScene
            rows={world.rows}
            cols={world.cols}
            start={world.start}
            initialDirty={initialDirty}
            result={result}
            currentStep={currentStep}
          />
          <Controls
            resetToken={resetCameraToken}
            rows={world.rows}
            cols={world.cols}
          />
        </Canvas>

        <div className="origin-note">Origin (1,1) is at the bottom-left corner</div>

        <div className="author-badge">
          <b>{STUDENT_NAME}</b>
          <span>Final Project · A* Search</span>
        </div>

        <div className="legend-card">
          <span><i className="swatch clean" />Clean</span>
          <span><i className="swatch dirty" />Dirty</span>
          <span><i className="swatch explored" />Expanded</span>
          <span><i className="swatch path" />Optimal path</span>
          <span><i className="swatch start" />Start</span>
          <span><i className="swatch cleaned" />Cleaned</span>
        </div>

        <div className="stats-panel">
          <div><small>STEP</small><strong>{currentStep}/{maximumStep}</strong></div>
          <div><small>ACTION</small><strong>{currentAction}</strong></div>
          <div><small>COST</small><strong>{cumulativeCost}</strong></div>
          <div><small>TOTAL</small><strong>{result?.found ? result.totalCost : '—'}</strong></div>
          <div><small>DIRTY LEFT</small><strong>{currentState.dirty.size}</strong></div>
          <div><small>EXPANDED</small><strong>{result?.expandedNodes ?? 0}</strong></div>
        </div>

        <div className="playback-panel">
          <button
            onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
            disabled={!result?.found || currentStep === 0}
          >
            ◀
          </button>
          <button
            className="play-button"
            onClick={() => setIsPlaying((playing) => !playing)}
            disabled={!result?.found}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <button
            onClick={() => setCurrentStep((step) => Math.min(maximumStep, step + 1))}
            disabled={!result?.found || currentStep === maximumStep}
          >
            ▶
          </button>
          <input
            type="range"
            min="0"
            max={maximumStep}
            value={currentStep}
            disabled={!result?.found}
            aria-label={`Solution progress: step ${currentStep} of ${maximumStep}`}
            onChange={(event) => {
              setIsPlaying(false);
              setCurrentStep(Number(event.target.value));
            }}
          />
          <output
            className="step-indicator"
            aria-live="polite"
            aria-label={`Current step ${currentStep} of ${maximumStep}`}
          >
            {currentStep}/{maximumStep}
          </output>
        </div>

        {result?.found && (
          <aside className="route-card">
            <div className="route-card-header">
              <div>
                <strong>A* Route</strong>
                <small>{result.actions.length} actions</small>
              </div>
              <button onClick={exportResult}>Export CSV</button>
            </div>
            <div className="route-list">
              {actionRows.map((row) => (
                <button
                  key={row.step}
                  className={row.step === currentStep ? 'active' : ''}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep(row.step);
                  }}
                >
                  <b>{row.step}</b>
                  <span>{row.action}</span>
                  <em>{row.position}</em>
                  <small>+{row.stepCost} | Σ {row.cumulative}</small>
                </button>
              ))}
            </div>
          </aside>
        )}
      </section>

      <aside className={`settings-drawer ${settingsOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div>
            <strong>World Settings</strong>
            <small>Configure the A<sub>m,n</sub> grid</small>
          </div>
          <button onClick={() => setSettingsOpen(false)}>×</button>
        </div>

        <div className="form-grid">
          <label>
            <span>Rows (m)</span>
            <input
              type="number"
              min="2"
              max="20"
              value={draft.rows}
              onChange={(event) => updateDraft('rows', event.target.value)}
            />
          </label>
          <label>
            <span>Columns (n)</span>
            <input
              type="number"
              min="2"
              max="20"
              value={draft.cols}
              onChange={(event) => updateDraft('cols', event.target.value)}
            />
          </label>
          <label>
            <span>Robot x</span>
            <input
              type="number"
              min="1"
              value={draft.startX}
              onChange={(event) => updateDraft('startX', event.target.value)}
            />
          </label>
          <label>
            <span>Robot y</span>
            <input
              type="number"
              min="1"
              value={draft.startY}
              onChange={(event) => updateDraft('startY', event.target.value)}
            />
          </label>
        </div>

        <label className="full-field">
          <span>Dirty-cell source</span>
          <select value={sourceMode} onChange={(event) => setSourceMode(event.target.value)}>
            <option value="random">Random generation</option>
            <option value="file">Import CSV / Excel</option>
          </select>
        </label>

        {sourceMode === 'random' ? (
          <>
            <div className="form-grid">
              <label>
                <span>Number of dirty cells</span>
                <input
                  type="number"
                  min="0"
                  value={draft.dirtyCount}
                  onChange={(event) => updateDraft('dirtyCount', event.target.value)}
                />
              </label>
              <label>
                <span>Random seed</span>
                <input
                  type="number"
                  value={draft.seed}
                  onChange={(event) => updateDraft('seed', event.target.value)}
                />
              </label>
            </div>
            <label className="check-field">
              <input
                type="checkbox"
                checked={draft.excludeStart}
                onChange={(event) => updateDraft('excludeStart', event.target.checked)}
              />
              Exclude the robot start cell
            </label>
          </>
        ) : (
          <div className="file-field">
            <button className="file-upload-button" onClick={() => fileInputRef.current?.click()}>Choose CSV / Excel</button>
            <span>{importedFileName || 'No file selected'}</span>
            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <small>Required columns: <b>x</b> and <b>y</b>. Coordinates start at 1.</small>
            <div className="format-example" aria-label="File format example">
              <code>x,y</code>
              <code>1,1</code>
              <code>4,2</code>
            </div>
            <div className="template-actions">
              <button className="template-button" onClick={downloadCsvTemplate}>
                Download CSV Template
              </button>
              <button className="template-button" onClick={downloadExcelTemplate}>
                Download Excel Template
              </button>
            </div>
          </div>
        )}

        <label className="full-field">
          <span>Maximum expanded nodes</span>
          <input
            type="number"
            min="100"
            max="2000000"
            value={draft.maxExpansions}
            onChange={(event) => updateDraft('maxExpansions', event.target.value)}
          />
        </label>

        <div className="cost-rule">
          <b>Cost rule</b>
          <span>Step cost = 1 + the number of dirty cells remaining after the action.</span>
        </div>

        <button className="apply-button" onClick={() => {
          setupWorld();
          setSettingsOpen(false);
        }}>
          Build World
        </button>
      </aside>

      <button className="floating-info" onClick={() => setInfoOpen((open) => !open)}>i</button>
      <section className={`info-popover ${infoOpen ? 'open' : ''}`}>
        <button onClick={() => setInfoOpen(false)}>×</button>
        <h3>A* Search for a Vacuum-Cleaner Robot</h3>
        <p>
          A state contains the robot position and the set of remaining dirty cells. The robot can move
          left, right, up, or down, and can perform SUCK on its current cell.
        </p>
        <p>
          The heuristic combines the minimum unavoidable cleaning cost with the Manhattan distance to the nearest dirty cell.
        </p>
        <div className="project-signature">
          <p><b>Project:</b> {PROJECT_TITLE}</p>
          <p><b>Student:</b> {STUDENT_NAME}</p>
          <p><b>Instructor:</b> {INSTRUCTOR_NAME}</p>
        </div>
      </section>
    </main>
  );
}
