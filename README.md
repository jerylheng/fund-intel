# Finwise — Private Financial Review

Finwise is a browser-only consultation workspace for Singapore financial advisers. The default page opens without a login and is designed for use during live client meetings. Client inputs are held in page memory, calculations run in the browser, and a client-ready report can be printed or saved as PDF from the browser.

## Privacy model

- No sign-in is required for the default workspace.
- The current review is held in React page state only; this page does not write client details to localStorage, cookies, Supabase, or Finwise API routes.
- Starting a new review clears the current inputs after confirmation.
- The PDF is generated through the browser's print dialog; Finwise does not upload or store the PDF.
- This is not a guarantee that a device or hosting platform leaves no metadata. Avoid shared/public devices, clear the session between meetings, protect exported PDFs, and follow your firm's policies and applicable PDPA requirements.
- The older authenticated Supabase API/schema remains in the repository but is not used by this default review screen.

## Included in the private workspace

- No-login client snapshot with optional name/adviser fields
- Income, expenses, monthly surplus, savings rate, assets, liabilities and estimated net worth
- CPF OA, SA/MediSave and RA balances kept as separate inputs
- Retirement target adjusted for inflation, contribution and asset projections, and a simplified capital-gap indicator
- Manually entered CPF LIFE payout estimate, sourced from the official CPF Board Retirement Payout Planner
- Singapore CPF reference points for members turning 55 in 2026: BRS $110,200, FRS $220,400 and ERS $440,800, with official illustrative CPF LIFE payout references
- Automatically generated strengths, gaps and suggested next steps
- Print-optimised client report suitable for “Save as PDF”
- Responsive mobile and desktop layouts

## Calculation notes and limitations

This is a planning aid, not an official CPF calculation, product illustration, guarantee or personalised recommendation. It does not model all CPF contribution allocation rules, age-based contribution rates, account closures/transfers, property-related CPF use, tax, fees, insurance cash values or sequence-of-returns risk. The CPF balance projection uses the selected illustrative annual growth rate; the CPF LIFE payout is entered manually because the actual amount depends on individual details and CPF Board rules. The 25× annual retirement-income-gap benchmark is a simplified heuristic and must not be treated as a guarantee. Confirm client-specific CPF LIFE estimates and retirement sums with official CPF Board tools.

Official references:
- [CPF retirement sums](https://www.cpf.gov.sg/service/article/what-are-the-retirement-sums-basic-retirement-sum-brs-full-retirement-sum-frs-and-enhanced-retirement-sum-ers)
- [CPF LIFE monthly payout estimates](https://www.cpf.gov.sg/service/article/how-much-cpf-payouts-can-i-get-every-month)

## Development

Built with Next.js, React, TypeScript, Recharts and Lucide icons.

```bash
npm install
npm run dev
npm run build
```

The app is deployed as a web application; the browser needs an internet connection to open it. After the page loads, client inputs and projections run locally in the browser and are not submitted by the review page. Build validation is configured in GitHub Actions.

## Future considerations

- Validate the report layout on mobile browsers and desktop PDF print engines.
- Add an explicit, tested “clear review” workflow for shared devices.
- Add deeper CPF modelling only with verified official assumptions and clear cohort/age-specific logic.
- If persistent client records are reintroduced later, keep them separate from this private quick-review mode and require explicit opt-in, authentication and access controls.
