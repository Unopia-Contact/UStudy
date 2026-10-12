## Summary

- What changed:
- Why:

## Verification

- [ ] `pnpm run typecheck:test`
- [ ] `pnpm run test:unit`
- [ ] `pnpm run build`
- [ ] Checked affected desktop UI
- [ ] Checked affected mobile UI
- [ ] Android workflow passed when native or mobile behavior changed
- [ ] `pnpm run typecheck` was checked, or existing unrelated TypeScript debt is noted

## Data and compatibility

- [ ] No localStorage key or encrypted payload format changed
- [ ] Import/export and extension contracts remain compatible
- [ ] Migration or rollback path is documented when storage changed
