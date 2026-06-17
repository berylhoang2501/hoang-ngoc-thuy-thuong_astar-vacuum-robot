# Upload this update to GitHub

This update adds a YouTube-style step indicator beside the playback progress bar.

Example: `0/27`, `12/27`, `27/27`.

Upload and replace these folders/files in the repository root:

- `src/components/World.js`
- `src/App.scss`
- `build/`

Commit message suggestion:

`Add playback step indicator`

The existing GitHub Pages workflow deploys directly from `build/`, so uploading the updated `build/` folder is required.
