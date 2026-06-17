# Upload this update to GitHub

The project already contains the production `build` folder used by the GitHub Pages workflow.

## Browser upload

1. Extract the ZIP file.
2. Open the extracted `AStar-Vacuum-Robot-Visualizer-English-UI` folder.
3. In the GitHub repository, choose **Add file → Upload files**.
4. Drag all files and folders from the extracted folder into the upload area.
5. Use the commit message: `Personalize project and improve English UI`.
6. Commit directly to `main`.
7. Open **Actions** and wait for the deployment workflow to finish.

The important updated paths are:

- `src/components/World.js`
- `src/components/algorithms/vacuumAStar.js`
- `src/App.scss`
- `public/index.html`
- `public/manifest.json`
- `build/`
- `README.md`
- `notebook/AStar_Vacuum_Robot.ipynb`

The `build` folder must be uploaded because GitHub Pages deploys that folder directly.
