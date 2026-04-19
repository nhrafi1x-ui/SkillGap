# Firestore Security Specification - SkillGAP

## 1. Data Invariants
- A `User` profile must be created by the owner and the `role` must default to `user`.
- A `Todo` or `Application` cannot exist without being part of a user's subcollection, effectively belonging to that user.
- Timestamps (`createdAt`, `updatedAt`) must be set by the server.
- Document IDs for todos and applications must be valid alphanumeric strings to prevent long-string attacks.
- Sensitive fields like `role` can only be changed by an admin (if implemented) or remain immutable for standard users.

## 2. The "Dirty Dozen" Payloads (Deny Test Cases)

1. **Identity Spoofing**: Attempting to create a profile for `userB` as `userA`.
2. **Role Escalation**: Setting `role: 'admin'` during user registration.
3. **Shadow Update**: Adding a `isVerified: true` field to a user profile update.
4. **ID Poisoning**: Creating a todo with a 1MB junk string as the document ID.
5. **Orphaned Write**: Creating a todo for a user ID that doesn't match the auth UID.
6. **Terminal State Bypass**: Modifying an application status after it has been marked `Rejected` or `Offer` (if we implement terminal locking).
7. **Size Attack**: Sending a 500KB string for the `fullName` field.
8. **Type Mismatch**: Sending a boolean for the `points` field.
9. **Timestamp Forgery**: Sending a hardcoded past date as `updatedAt` instead of `serverTimestamp()`.
10. **Query Scraping**: Attempting to list all users without being an admin.
11. **PII Leak**: A user attempting to `get` the profile of another user.
12. **Key Injection**: Including unplanned keys in a `Todo` document.

## 3. Test Runner Concept
The tests would involve authenticated and unauthenticated requests to various paths with malicious payloads. These are formally verified in `src/firestore.rules.test.ts`.

---

## 4. Relationship Mapping
- **Owner**: The user with `uid` matching the document ID in `/users/{userId}`.
- **Access**: Subcollections `/users/{userId}/todos` and `/users/{userId}/applications` inherit permissions from the owner's identity.
