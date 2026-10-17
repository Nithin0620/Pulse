# Caregiver Link Feature - Test Checklist

## Prerequisites
- [ ] Firestore rules deployed successfully
- [ ] Have two test accounts ready (one patient, one caregiver)
- [ ] Dev server is running (`npm run dev`)

## Patient Tests (Generate Invite Code)

### Test 1: Generate Invite Code
- [ ] Log in as a patient
- [ ] Navigate to Caregiver Link page
- [ ] Click "Generate" button
- [ ] **Expected**: 6-character code appears (e.g., "ABC123")
- [ ] **Expected**: Countdown timer shows ~24 hours
- [ ] **Expected**: No console errors

### Test 2: Copy Invite Code
- [ ] Click "Copy" button on generated code
- [ ] **Expected**: Button text changes to "Copied!"
- [ ] **Expected**: Code is in clipboard
- [ ] Paste code somewhere to verify

### Test 3: Multiple Pending Codes
- [ ] Generate another invite code
- [ ] **Expected**: Both codes appear in the list
- [ ] **Expected**: Each has its own countdown timer
- [ ] **Expected**: Newest code appears first

### Test 4: Cancel Pending Code
- [ ] Click "Cancel" on a pending code
- [ ] **Expected**: Code disappears from pending list
- [ ] **Expected**: No console errors

## Caregiver Tests (Accept Invite)

### Test 5: Enter Invalid Code
- [ ] Log in as a caregiver
- [ ] Navigate to home dashboard
- [ ] Enter a random 6-character code (e.g., "XXXXXX")
- [ ] Click submit or press Enter
- [ ] **Expected**: Error message: "That invite code is invalid or has been used."
- [ ] **Expected**: No console errors

### Test 6: Enter Valid Code
- [ ] Get a valid pending code from patient
- [ ] Enter the code (case-insensitive)
- [ ] Click submit or press Enter
- [ ] **Expected**: Success message appears
- [ ] **Expected**: Patient appears in caregiver's patient switcher
- [ ] **Expected**: No console errors

### Test 7: Reuse Same Code
- [ ] Try entering the same code again
- [ ] **Expected**: Error message about code being invalid/used
- [ ] **Expected**: Code cannot be reused

## Patient Tests (Manage Active Caregivers)

### Test 8: View Active Caregiver
- [ ] Log back in as patient
- [ ] Check "Active caregivers" section
- [ ] **Expected**: Linked caregiver appears with name/avatar
- [ ] **Expected**: Status shows "Active" or "सक्रिय"

### Test 9: Toggle Permissions
- [ ] Click on "View Medicines" toggle
- [ ] **Expected**: Toggle switches state immediately
- [ ] **Expected**: Background color changes (accent vs gray)
- [ ] Repeat for "View Documents" and "Add Medicines"
- [ ] **Expected**: All toggles work independently

### Test 10: Revoke Caregiver Access
- [ ] Click "Revoke" button on active caregiver
- [ ] **Expected**: Confirmation dialog appears
- [ ] Confirm revocation
- [ ] **Expected**: Caregiver disappears from active list
- [ ] **Expected**: No console errors

### Test 11: Verify Revocation from Caregiver Side
- [ ] Log in as caregiver
- [ ] Check patient switcher
- [ ] **Expected**: Revoked patient no longer appears in list
- [ ] **Expected**: Cannot access revoked patient's data

## Edge Cases

### Test 12: Expired Code
- [ ] Generate a code
- [ ] Wait for expiration (or manually adjust `expiresAtMs` in Firestore)
- [ ] Try to use expired code as caregiver
- [ ] **Expected**: Error message about code being expired

### Test 13: Code Expiration Countdown
- [ ] Generate a code
- [ ] Watch countdown timer
- [ ] **Expected**: Timer counts down in real-time (HH:MM:SS format)
- [ ] **Expected**: When expired, code disappears from pending list

### Test 14: Language Toggle
- [ ] Switch language to Hindi (हिंदी)
- [ ] **Expected**: All labels, buttons, and messages appear in Hindi
- [ ] Generate code and verify Hindi text
- [ ] Switch back to English
- [ ] **Expected**: Text switches back to English

### Test 15: Multiple Caregivers
- [ ] Generate multiple invite codes
- [ ] Link 2-3 different caregivers
- [ ] **Expected**: All appear in active caregivers list
- [ ] **Expected**: Each has independent permission toggles
- [ ] **Expected**: Revoking one doesn't affect others

### Test 16: Console Errors Check
- [ ] Open browser DevTools (F12)
- [ ] Go through all tests above
- [ ] **Expected**: No "ERR_BLOCKED_BY_CLIENT" errors
- [ ] **Expected**: No "Missing or insufficient permissions" errors
- [ ] **Expected**: Only normal info/debug logs

## Browser Compatibility

### Test 17: Mobile View
- [ ] Test on mobile device or mobile emulator (F12 > Toggle device toolbar)
- [ ] **Expected**: All buttons are tap-friendly (48px minimum)
- [ ] **Expected**: Layout is responsive
- [ ] **Expected**: Code is readable on small screen

### Test 18: Clipboard on Mobile
- [ ] Try copying invite code on mobile
- [ ] **Expected**: Copy works (may require HTTPS for some browsers)

## Security Validation

### Test 19: Cross-User Access
- [ ] Try to manually access another patient's invite code (modify Firestore directly or inspect network)
- [ ] **Expected**: Firestore rules prevent unauthorized access
- [ ] **Expected**: Cannot read/modify other users' caregiverLinks

### Test 20: Unauthenticated Access
- [ ] Log out
- [ ] Try to access Caregiver Link page
- [ ] **Expected**: Redirected to login or shows auth required message

---

## Success Criteria
- [ ] All 20 tests pass
- [ ] No console errors related to Firestore permissions
- [ ] Patient can generate and manage invite codes
- [ ] Caregiver can accept invites and link to patients
- [ ] Permission toggles work correctly
- [ ] Revocation flow works bidirectionally
- [ ] UI is responsive and accessible

## Notes
- If any test fails, check browser console for errors
- Check Firestore rules in Firebase Console: https://console.firebase.google.com/project/kunal-projects/firestore/rules
- Check Firestore data structure in Firebase Console: https://console.firebase.google.com/project/kunal-projects/firestore/data
- Rules deployment can take 1-2 minutes to propagate
