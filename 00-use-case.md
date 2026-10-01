# Project Context
- **Application**: Employee Catalog Service
- **Platform**: OutSystems (ODC / O11)
- **Harness / Test Tool**: Vitest (or BDDFramework via API triggers)
- **Test Command**: `npm test`
- **Architecture**: Service Actions / REST Endpoints over Core Entities

---

# Use Case Catalog

## Use Case #1: Create Employee Record
**Description**:
An HR user wants to create an employee record with FirstName, LastName, Department, and Email. The system must generate a unique identifier and reject any duplicate email addresses.

**Status**: In Progress
**Current Phase**: Green
**Last Phase Completed**: Green (verified against the live ODC tenant)
**Last Updated**: 2026-10-02 06:45
**Test Count**: 6 tests (Scenario 1 has 3 tests)
**Test File**: `tests/create-employee.test.ts`
**Last Live Run**: 2026-10-02, against the ODC Development tenant (OUTSYSTEMS_BASE_URL set). All 6 Use Case #1 tests passed: S1 (3 tests) 201 + generated Id + echoed fields; S2 self-seeds (create 201, then duplicate 409); S3 400 with Errors array; S4 400 with the ODC built-in `errors.ValidationErrors` body.

> Note: Green here reflects a live run against the ODC app. A mock run (OUTSYSTEMS_BASE_URL unset) also passes 20/20 but is not sufficient to claim Green on its own — it exercises stubbed fetch, not the tenant.

### Scenarios (GWT)

**Scenario 1 — Happy path: create a valid employee**
```gherkin
Given a valid payload with FirstName, LastName, Department, and an Email that is unique to this test run
When POST /employees is called
Then the response status is 201
And the response body contains the generated Id (Long Integer, > 0)
And the response body echoes back FirstName, LastName, Department, and Email
```

**Scenario 2 — Duplicate email rejected**
```gherkin
Given an employee has just been created with a unique email for this test run
When POST /employees is called again with the same email
Then the response status is 409
And the response body contains an error message referencing the duplicate email
```

**Scenario 3 — Missing required field (e.g. Email omitted)**
```gherkin
Given a payload that omits the Email field
When POST /employees is called
Then the response status is 400
And the response body contains { "Errors": [...], "StatusCode": 400 } with an Errors entry naming the missing field
```

**Scenario 4 — Empty request body**
```gherkin
Given a request with no body
When POST /employees is called
Then the response status is 400
And the response body contains { "errors": { "ValidationErrors": ["The request body is missing."] } }
Note: this body is produced by the ODC framework before the action flow runs, so it differs from the Errors/StatusCode shape used by Scenario 3.
```

---

## Use Case #2: Filter Active Employees by Department
**Description**:
Retrieve all active employees belonging to a specific department, ignoring inactive staff.