# Security Specification for Roïva Firebase Integration

## 1. Data Invariants
- A user document can only be accessed by the owner (uid match).
- History items and snapshots are sub-collections of the user, ensuring strict relational sync.
- Timestamps and IDs must be validated.
- Key numeric fields like `unitPrice`, `volume`, and `ROI` cannot be negative (where applicable).

## 2. The "Dirty Dozen" Payloads (Denial Expected)

1. **Identity Spoofing**: Attempt to update `users/userA` while authenticated as `userB`.
2. **Path Poisoning**: Attempt to create a document with a 1MB string as ID.
3. **Ghost Fields**: Attempt to add `isAdmin: true` to a user document.
4. **Invalid Types**: Sending a string for `unitPrice` (number expected).
5. **Negative Volume**: Setting `volume` to -100.
6. **Self-Assigned Admin**: Attempting to write to a hypothetical `admins` collection.
7. **PII Leak**: Authenticated user trying to list all users in `/users`.
8. **Orphaned Write**: Creating a history item without a valid user document (enforced via path).
9. **Extreme String Size**: Setting `productName` to a 2MB string.
10. **Old Timestamp**: Attempting to set `createdAt` to a date in 2020.
11. **Batch Overflow**: Attempting to write 600 documents in one batch (Firestore limit but rules should be tight).
12. **Recursive Resource Exhaustion**: deeply nested paths or large arrays (though we use subcollections).

## 3. Test Runner (Mock Tests)
- `it('rejects cross-user access', ...)`
- `it('rejects invalid types', ...)`
- `it('rejects missing auth', ...)`
- `it('rejects 1MB IDs', ...)`
