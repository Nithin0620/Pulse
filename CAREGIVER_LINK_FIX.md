# Caregiver Link Feature Fix

## Problem
The caregiver link feature was failing with the error:
```
FirebaseError: Missing or insufficient permissions.
```

Both generating invite codes and linking caregivers were being blocked by Firestore security rules.

## Root Cause
The `firestore.rules` file was missing security rules for the `caregiverLinks` collection. Without explicit rules, Firestore denies all operations by default.

## Solution
Fixed Firestore security rules in two key areas:

### A. User Profiles and Subcollections
Updated rules to allow caregiver-patient data sharing:

**Main User Document (`users/{userId}`)**
- Any authenticated user can **read** user profiles (needed for displaying caregiver/patient names)
- Users can **write** their own document
- **Special case**: Allow updating `linkedPatientIds` and `linkedCaregiverIds` arrays during the linking process

**Subcollections (`users/{userId}/medications`, `users/{userId}/logs`, etc.)**
- **Read access**: 
  - Users can read their own subcollections
  - **Linked caregivers** can read patient subcollections (verified by checking if caregiver UID is in patient's `linkedCaregiverIds` array)
- **Write access**: Only the document owner can write (caregivers have read-only access)

### B. Caregiver Links Collection
Added comprehensive security rules for the `caregiverLinks` collection with three main access patterns:

### 1. **Read Access**
- Patients can read all their own links (where `patientId == user.uid`)
- Caregivers can read links they're already connected to (where `caregiverId == user.uid`)
- **Any authenticated user can read pending invites** — This is critical so caregivers can query by invite code to find and accept invites

### 2. **Create Access**
Patients can create new invite codes with the following constraints:
- `patientId` must be their own UID
- `status` must be 'pending'
- `caregiverId` must be null (not yet linked)
- Required fields: `inviteCode`, `expiresAtMs`, `permissions`

### 3. **Update Access**
Two scenarios are allowed:
- **Patients** can update their own links (to revoke, cancel, or change permissions)
- **Caregivers** can accept pending invites by:
  - Setting `caregiverId` to their own UID
  - Changing `status` from 'pending' to 'active'

### 4. **Delete Access**
Deletion is explicitly disabled (`allow delete: if false`) to maintain audit trail.

## Files Modified

### `firestore.rules`
Added the `caregiverLinks` security rules section between the SOS events rules and the legacy sosAlerts rules.

### `.firebaserc` (Created)
Created this file to set the default Firebase project to `kunal-projects`, so future deployments don't require the `--project` flag.

## Deployment
The updated rules were successfully deployed to Firebase using:
```bash
firebase deploy --only firestore:rules --project kunal-projects
```

## Testing Recommendations
1. **Patient Flow**:
   - Log in as a patient
   - Generate an invite code
   - Verify the code appears with a countdown timer
   - Copy the code
   - Cancel or let it expire

2. **Caregiver Flow**:
   - Log in as a caregiver
   - Enter a valid 6-character invite code
   - Verify the link is created and the patient appears in the switcher
   - Check that permissions (view medicines, view documents, add medicines) work correctly

3. **Revoke Flow**:
   - As a patient, revoke a caregiver's access
   - Verify the caregiver is removed from the active list
   - Verify the caregiver no longer sees this patient in their switcher

## Security Considerations
The rules balance security with usability:
- Pending invites are readable by all authenticated users, which is necessary for the code-based lookup flow
- This is acceptable because:
  - Codes are 6-character random strings (36^6 = ~2 billion possibilities)
  - Codes expire after 24 hours
  - Codes are single-use (status changes from pending to active)
  - Only the patient who created the code can revoke it
  - Access requires an authenticated Firebase user

## Future Enhancements
Consider adding:
- Rate limiting on invite code generation
- Logging of all caregiver link operations
- Email/SMS notifications when a caregiver accepts an invite
- Ability to regenerate expired codes
- Multiple permission presets (read-only, full access, etc.)
