# Upload this update to GitHub

This update groups controls by purpose and moves animation speed to the playback bar.

## Changed files

- `src/components/World.js`
- `src/App.scss`
- `build/`
- `README.md`

## Upload steps

1. Open the repository on GitHub.
2. Choose **Add file → Upload files**.
3. Upload the following items from this package:
   - `src/`
   - `build/`
   - `README.md`
4. Commit with:

```text
Group toolbar controls and move speed to playback
```

5. Wait for GitHub Actions to finish.
6. Reload the demo with **Command + Shift + R** on macOS or **Ctrl + Shift + R** on Windows.

## Expected interface

- The algorithm is displayed as a compact `Algorithm A*` badge.
- `Random Dirty / CSV–Excel` and `World Settings` are grouped under **WORLD**.
- `Visualize`, `Clear Path`, and `Reset Agent` are grouped under **A* SEARCH**.
- Speed is located beside the progress bar and uses `0.5×`, `1×`, `1.5×`, and `2×`.
