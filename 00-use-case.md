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
**Last Phase Completed**: Green
**Last Updated**: 2026-10-01 01:16
**Test Count**: 6 tests (6 fast)
**Test File**: `tests/create-employee.test.ts`

### Scenarios (GWT)

**Scenario 1 — Happy path: create a valid employee**
```gherkin
Given a valid payload with FirstName, LastName, Department, and Email
When POST /employees is called
Then the response status is 201
And the response body contains the generated Id (Long Integer, > 0)
And the response body echoes back FirstName, LastName, Department, and Email
```

**Scenario 2 — Duplicate email rejected**
```gherkin
Given an employee with email "alice@example.com" already exists
When POST /employees is called with email "alice@example.com"
Then the response status is 409
And the response body contains an error message referencing the duplicate email
```

**Scenario 3 — Missing required field (e.g. Email omitted)**
```gherkin
Given a payload that omits the Email field
When POST /employees is called
Then the response status is 400
And the response body contains an Errors array naming the missing field
```

**Scenario 4 — Empty request body**
```gherkin
Given a request with no body
When POST /employees is called
Then the response status is 400
And the response body contains { "Errors": ["The request body is missing."], "StatusCode": 400 }
```

---

## Use Case #2: Filter Active Employees by Department
**Description**:
Retrieve all active employees belonging to a specific department, ignoring inactive staff.
