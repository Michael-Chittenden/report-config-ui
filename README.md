# IRP Report Configuration UI

Interactive prototype for the CAPTRUST Institutional Reporting Platform (IRP) Report Configuration module.

## Setup Instructions

### Step 1: Install Git
1. Download from https://git-scm.com/download/win
2. Install with defaults

### Step 2: Install Node.js (Portable)
1. Download the Node.js standalone binary (.zip) from https://nodejs.org/en/download
2. Create a `C:\Node` folder
3. Unzip the contents of the `win-x64` folder to `C:\Node`

### Step 3: Clone and Run
1. Create a `C:\Git` folder on your C drive
2. Open Command Prompt and run:
```cmd
cd C:\Git
git clone https://github.com/Michael-Chittenden/report-config-ui.git
cd report-config-ui
C:\node\npm install
C:\node\npm run dev
```
3. Open http://localhost:5173 in your browser

### Updating to Latest
```cmd
cd C:\Git\report-config-ui
git pull
C:\node\npm install
C:\node\npm run dev
```

## What This Is
A working interactive mockup that demonstrates the full report configuration workflow:

- **Single Plan** -- per-plan config with QDIA, fund changes, exhibit menu, bulk run scheduling
- **Multi Plan** -- plan group selection with aggregated investments and fund changes
- **Combo** -- combines single + multi plan configs with duplicate plan detection
- **Bulk Dashboard** -- centralized view of all bulk-scheduled report configs across clients

Data is stored in browser localStorage (no backend required). Use **Demo Data > Export/Import** to transfer data between machines.

## Documentation
- `docs/IRP-Database-Schema.docx` -- Full SQL Server schema specification
- `docs/IRP-Developer-Guide.docx` -- Architecture, component guide, setup instructions
- `CHANGELOG.md` -- Version history

## Tech Stack
- React 18 + Vite 8
- Ant Design 5
- Browser localStorage for persistence
