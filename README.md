# A* Vacuum Robot Visualizer

**Final Project:** A* Search for a Vacuum-Cleaner Robot  
**Student:** Hoàng Ngọc Thủy Thương  
**Instructor:** Dr. Nguyễn An Tế  
**Submission:** April 2026

## About this project

For this final project, I implemented the A* algorithm for a vacuum-cleaner robot moving on a rectangular grid `A(m,n)`. The coordinate origin `(1,1)` is placed at the bottom-left corner, and each cell is either clean or dirty.

The robot can perform one action at a time:

- `MOVE_LEFT`
- `MOVE_RIGHT`
- `MOVE_UP`
- `MOVE_DOWN`
- `SUCK`

I calculate the cost of each action using:

```text
step cost = 1 + number of dirty cells remaining after the action
```

The goal is to clean all dirty cells with the minimum total cost.

## Main features

- Custom grid dimensions and robot start position
- Random dirty-cell generation with a reproducible seed
- Dirty-cell input from CSV or XLSX files
- Downloadable CSV and XLSX templates
- Interactive 3D visualization with camera rotation and zoom
- A* route animation with play, pause, previous, next, timeline, and playback speed controls
- Current step, action, accumulated cost, dirty cells left, total cost, and expanded-node statistics
- Route export to CSV
- A Python notebook containing the complete A* implementation and saved results

## Input file format

The CSV or XLSX file must contain two columns named `x` and `y`.

```csv
x,y
1,1
4,2
3,4
```

The interface provides **Download CSV Template** and **Download Excel (.xlsx) Template** buttons in **World Settings**.

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
- `notebook/Hoang_Ngoc_Thuy_Thuong_AStar_Vacuum_Robot.ipynb`: main Python notebook with saved execution results
- `notebook/Hoang_Ngoc_Thuy_Thuong_AStar_Result.csv`: sample route result exported from the notebook
- `notebook/dirty_cells_sample.csv` and `notebook/dirty_cells_sample.xlsx`: input templates for the notebook
- `samples/`: CSV and XLSX examples for the web interface

## Implementation

The Python notebook contains my main A* implementation, including the state representation, action generation, heuristic, cost calculation, route reconstruction, and result visualization.

I also developed the React/Three.js application to present the same problem as an interactive 3D simulation.

