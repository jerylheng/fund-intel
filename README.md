# Finwise — Financial Planning Workspace

A Finjaro-inspired financial planning workspace prototype for financial advisers. The existing Fund Intel interface has been replaced with an original adviser workflow and visual identity.

## Prototype features
- Adviser overview dashboard and client directory
- Demo client profiles with income, expenses, cash, investments, CPF, property and liabilities
- Estimated net-worth and monthly-surplus calculations
- Interactive financial roadmap and retirement scenario controls
- Illustrative investment-return and inflation assumptions
- Life-milestone overview
- Protection review checklist covering healthcare, critical illness, income, family and legacy planning
- Responsive desktop and mobile layouts
- Add-client flow for a starter profile (currently held in page state only)

## Important prototype limitations
- All preloaded client profiles are fictitious demonstration data.
- Data is not persisted to a database and is not shared across users or devices.
- Authentication, role-based access, audit logs, secure document storage, exports and a production database have not yet been implemented.
- Financial projections are simplified illustrations, not forecasts or personalised recommendations. Actual outcomes can differ materially.
- This is an independent planning interface, not an official Finjaro or AIA website. It uses original branding and implementation.

## Local development
```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production build
```bash
npm run build
npm start
```

## Next implementation milestones
1. Verify the deployment build and polish responsive behaviour.
2. Add Supabase authentication and row-level security.
3. Persist adviser and client records with explicit ownership and audit trails.
4. Add editable assets, liabilities, goals, policies and dependants.
5. Implement validated Singapore-specific CPF, retirement and protection calculations.
6. Add client-ready PDF reports and controlled sharing.
