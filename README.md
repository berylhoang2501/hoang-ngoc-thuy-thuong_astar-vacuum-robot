# A* Vacuum Robot Visualizer

**Final Project:** A* Search for a Vacuum-Cleaner Robot  
**Student:** Hoàng Ngọc Thủy Thương  
**Instructor:** Dr. Nguyễn An Tế  
**Submission:** April 2026

## Project overview

This project applies the A* algorithm to a vacuum-cleaner robot operating on a rectangular grid `A(m,n)`. The coordinate origin `(1,1)` is located at the bottom-left corner. Every cell is either clean or dirty.

The robot can perform one action at a time:

- `MOVE_LEFT`
- `MOVE_RIGHT`
- `MOVE_UP`
- `MOVE_DOWN`
- `SUCK`

The cost of each action is calculated as:

```text
step cost = 1 + number of dirty cells remaining after the action
```

The goal is to clean all dirty cells with the minimum total cost.

## Main features

- User-defined grid dimensions and robot start position
- Random dirty-cell generation with a reproducible seed
- CSV, XLS, and XLSX dirty-cell import
- Downloadable CSV and Excel input templates
- Interactive 3D visualization with camera rotation and zoom
- A* route animation with play, pause, previous, next, and timeline controls
- Per-step cost, cumulative cost, total cost, and expanded-node statistics
- Route export to CSV
- Python notebook included for the official `.ipynb` assignment requirement

## Input file format

CSV and Excel files must contain two columns named `x` and `y`:

```csv
x,y
1,1
4,2
3,4
```

The interface includes **Download CSV Template** and **Download Excel Template** buttons under **World Settings → Import CSV / Excel**.

## Run locally

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## Build

```bash
npm run build
```

## Project files

- `src/components/World.js`: interface and application logic
- `src/components/algorithms/vacuumAStar.js`: A* implementation
- `src/components/VacuumScene.js`: 3D scene
- `notebook/`: Python notebook and sample files
- `samples/`: CSV and Excel examples

## Academic note

The React/Three.js interface is a visualization supplement. The Python notebook is the primary submission artifact because the assignment specifically requires Python in `.ipynb` format.

## Credits

The 3D interface structure was adapted from the open-source project listed in [`CREDITS.md`](CREDITS.md). The vacuum-cleaner state model, cost function, A* solver, file import, route output, and notebook were created for this assignment.
