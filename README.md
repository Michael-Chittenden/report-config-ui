# IRP Report Configuration UI

Interactive prototype for the CAPTRUST Institutional Reporting Platform (IRP) Report Configuration module.

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18 or later
- [Git](https://git-scm.com/)

### Setup
```bash
git clone https://github.com/Michael-Chittenden/report-config-ui.git
cd report-config-ui
npm install
npm run dev
```

Open http://localhost:5173 in your browser (port may vary if 5173 is in use).

### Portable Node.js (Restricted Machines)
If you cannot install Node.js via the standard installer:
1. Download the **Windows Binary (.zip)** from [nodejs.org](https://nodejs.org/en/download)
2. Extract to `C:\node`
3. Open a command prompt and run:
```cmd
set PATH=C:\node;%PATH%
```
4. Then proceed with `npm install` and `npm run dev` as above

## Keeping Up to Date
```bash
git pull
npm install   # only needed if package.json changed
npm run dev
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
