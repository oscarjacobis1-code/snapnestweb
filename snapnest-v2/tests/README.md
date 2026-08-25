# Business Readiness regression plan

This suite protects the repaired Business Readiness contracts. It uses Node's built-in test runner and loads the browser script into an isolated VM. No production requests are made.

Run from the repository root:

```powershell
node --test snapnest-v2/tests/readiness-regression.test.cjs
```

## Coverage

1. **Active-branch state integrity**
   - Reproduces the stale appointment-pain answer recommending Booking after appointments are removed from the active path.
   - Requires inactive branch answers to be cleaned during path rebuilding and ignored defensively during scoring.

2. **Pricing invariants**
   - Exhaustively checks that adding functionality cannot lower setup cost, and checks first-year monotonicity.
   - Checks equivalent module sets are order/path independent when operational scale is equivalent.
   - Verifies Staff Workflow, POS + Inventory, and Website + Booking use bespoke component pricing.
   - Verifies public package prices are not automatically imposed on bespoke estimates.
   - Verifies genuinely complex scopes are marked for manual quotation without forcing a fixed package price.
   - Verifies accumulated independent evidence can justify Website while an existing suitable Website suppresses duplication.
   - Verifies modules have no standalone monthly subscriptions and non-recurring additions do not change support pricing.
   - Verifies recurring bands change only when operational burden changes and calibrate a Laundry Loop-like scope at GYD 20,000/month.

3. **Submission reliability**
   - Defines result contracts for 2xx, network failure, 404, and 500.
   - Verifies duplicate-safe single-flight submission and the result-generation guard.

4. **Business stage**
   - Verifies stage changes urgency only, while preserving evidence and component pricing.

5. **Date/reference consistency**
   - Prevents separate UTC and local date derivations.

6. **Follow-up selection**
   - Prevents a materially rejectable module from reaching `need now` before its active follow-up is answered.
   - Reproduces a capped-flow case where Payments reaches `need now` although the Payments follow-up was omitted.

7. **Result completeness**
   - Prevents silent six/four-item truncation.

8. **Accessibility and wording**
   - Covers Locations label association, error announcements/associations, disclosure state, radio semantics, print/download wording, and production wording.
   - Covers explicit focus management for dynamic step changes.

## Acceptance policy

All approved contracts must pass. A TODO is permitted only for a genuinely unapproved commercial or interface contract.
