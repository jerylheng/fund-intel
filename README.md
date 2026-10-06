# Fund Intel

AIA-focused fund research, comparison and investment projection web app.

## Current MVP
- AIA-focused fund catalogue
- Search and category filtering
- Fund comparison for up to five funds
- Historical-return comparison view
- Investment simulator
- Automatic vs manual expected-return assumption
- Responsive UI
- No adviser login

## Data
The current repository uses a clearly labelled illustrative seed dataset. Before client-facing use, replace/validate each fund record against authorised AIA Singapore data and any separately licensed third-party data. AIA's official fund pages provide fund prices, performance periods, historical prices and fund documents.

## Local development
```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production
```bash
npm run build
npm start
```

The app is designed for deployment on Vercel or another Next.js-compatible host.

## Important
This tool is an independent research/projection interface and is not an official AIA website. Past performance is not indicative of future performance. Projections are mathematical illustrations, not guarantees.
