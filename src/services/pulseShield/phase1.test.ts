/**
 * PULSE Shield - Phase 1 Testing
 * 
 * Quick verification that Tier 0 + Tier 1 + Vault work correctly
 * Run in browser console or Node.js
 * 
 * Usage:
 * import { runPhase1Tests } from './phase1.test';
 * runPhase1Tests();
 */

import { tier0Redact, type PIIEntity } from './redactors/tier0-regex';
import { Tier1Dictionary } from './redactors/tier1-dictionary';
import { piiVault } from './vault';
import { pulseShield } from './index';

export function runPhase1Tests(): void {
  console.log('='.repeat(60));
  console.log('PULSE Shield - Phase 1 Test Suite');
  console.log('='.repeat(60));

  // Test Group 1: Tier 0 Regex
  console.log('\n📌 Test Group 1: Tier 0 Regex Patterns');
  testTier0Aadhaar();
  testTier0Phone();
  testTier0Email();
  testTier0Pincode();
  testTier0Mixed();

  // Test Group 2: Tier 1 Dictionary
  console.log('\n📌 Test Group 2: Tier 1 Dictionary');
  testTier1Dictionary();

  // Test Group 3: Vault
  console.log('\n📌 Test Group 3: PII Vault');
  testVaultStore();
  testVaultRestore();
  testVaultExpiry();

  // Test Group 4: PulseShield Orchestrator
  console.log('\n📌 Test Group 4: PulseShield Orchestrator');
  testPulseShieldRedaction();
  testPulseShieldRestore();
  testPulseShieldMetrics();

  console.log('\n' + '='.repeat(60));
  console.log('✅ All Phase 1 tests completed!');
  console.log('='.repeat(60));
}

// ============ Test Functions ============

function testTier0Aadhaar() {
  console.log('\n▪ Test: Tier 0 - Aadhaar Detection');

  const testCases = [
    { input: 'Patient Aadhaar: 1234-5678-9012', expectedCount: 1 },
    { input: 'Aadhaar 1234 5678 9012', expectedCount: 1 },
    { input: 'ID: 1234567890012', expectedCount: 1 },
    { input: 'No PII here', expectedCount: 0 },
  ];

  testCases.forEach(({ input, expectedCount }) => {
    const entities = tier0Redact(input);
    const aadhaarCount = entities.filter(e => e.category === 'AADHAAR').length;
    const pass = aadhaarCount === expectedCount;
    console.log(`  ${pass ? '✅' : '❌'} "${input}" → ${aadhaarCount} Aadhaar (expected ${expectedCount})`);
  });
}

function testTier0Phone() {
  console.log('\n▪ Test: Tier 0 - Phone Number Detection');

  const testCases = [
    { input: 'Call +91-9876543210', expectedCount: 1 },
    { input: 'Mobile: 9876543210', expectedCount: 1 },
    { input: '+919876543210 is the number', expectedCount: 1 },
    { input: 'Invalid: 1234567890', expectedCount: 0 },
  ];

  testCases.forEach(({ input, expectedCount }) => {
    const entities = tier0Redact(input);
    const phoneCount = entities.filter(e => e.category === 'PHONE_NUMBER').length;
    const pass = phoneCount === expectedCount;
    console.log(`  ${pass ? '✅' : '❌'} "${input}" → ${phoneCount} phones (expected ${expectedCount})`);
  });
}

function testTier0Email() {
  console.log('\n▪ Test: Tier 0 - Email Detection');

  const testCases = [
    { input: 'Email: test@example.com', expectedCount: 1 },
    { input: 'john.doe@company.co.uk', expectedCount: 1 },
    { input: 'Not an email: test@', expectedCount: 0 },
  ];

  testCases.forEach(({ input, expectedCount }) => {
    const entities = tier0Redact(input);
    const emailCount = entities.filter(e => e.category === 'EMAIL').length;
    const pass = emailCount === expectedCount;
    console.log(`  ${pass ? '✅' : '❌'} "${input}" → ${emailCount} emails (expected ${expectedCount})`);
  });
}

function testTier0Pincode() {
  console.log('\n▪ Test: Tier 0 - PIN Code Detection');

  const testCases = [
    { input: 'PIN: 560001', expectedCount: 1 },
    { input: 'Bangalore 560001, Delhi 110001', expectedCount: 2 },
    { input: 'Invalid PIN 012345', expectedCount: 0 },
  ];

  testCases.forEach(({ input, expectedCount }) => {
    const entities = tier0Redact(input);
    const pinCount = entities.filter(e => e.category === 'PIN_CODE').length;
    const pass = pinCount === expectedCount;
    console.log(`  ${pass ? '✅' : '❌'} "${input}" → ${pinCount} pins (expected ${expectedCount})`);
  });
}

function testTier0Mixed() {
  console.log('\n▪ Test: Tier 0 - Mixed PII in One Text');

  const input = 'Patient Rajesh (Aadhaar: 1234-5678-9012, Phone: 9876543210, Email: rajesh@example.com, ZIP: 560001)';
  const entities = tier0Redact(input);

  const expected = {
    AADHAAR: 1,
    PHONE_NUMBER: 1,
    EMAIL: 1,
    PIN_CODE: 1,
  };

  let pass = true;
  for (const [category, count] of Object.entries(expected)) {
    const found = entities.filter(e => e.category === category).length;
    if (found !== count) pass = false;
  }

  console.log(
    `  ${pass ? '✅' : '❌'} Mixed PII: found ${entities.length} entities (expected ${Object.values(expected).reduce((a, b) => a + b)})`
  );
}

function testTier1Dictionary() {
  console.log('\n▪ Test: Tier 1 - Dictionary Matching');

  const profile = {
    fullName: 'Rajesh Kumar',
    displayName: 'Rajesh',
    emergencyContact: { name: 'Priya Kumar' },
    conditions: ['Diabetes', 'Hypertension'],
    bloodGroup: 'O+',
  };

  const dict = new Tier1Dictionary(profile);
  console.log(`  Built dictionary with ${dict.size()} entries`);

  const text = 'Patient Rajesh Kumar has Diabetes and Hypertension. Emergency contact: Priya Kumar. Blood group: O+';
  const entities = dict.redact(text);

  const pass = entities.length >= 4; // At least name + 2 conditions + blood group
  console.log(`  ${pass ? '✅' : '❌'} Detected ${entities.length} dictionary entries (expected ≥ 4)`);
}

function testVaultStore() {
  console.log('\n▪ Test: Vault - Store and Retrieve');

  const entities: PIIEntity[] = [
    { original: 'Rajesh Kumar', placeholder: '[PATIENT_1]', category: 'PATIENT_NAME', tier: 1, startIndex: 0, endIndex: 13 },
    { original: '9876543210', placeholder: '[PHONE_1]', category: 'PHONE_NUMBER', tier: 0, startIndex: 20, endIndex: 30 },
  ];

  const key = piiVault.store(entities, 'TEST');
  const retrieved = piiVault.retrieve(key);

  const pass = retrieved !== null && retrieved.length === 2;
  console.log(`  ${pass ? '✅' : '❌'} Stored and retrieved ${retrieved?.length || 0} entities`);
}

function testVaultRestore() {
  console.log('\n▪ Test: Vault - Restore Placeholders');

  const entities: PIIEntity[] = [
    { original: 'Rajesh Kumar', placeholder: '[PATIENT_1]', category: 'PATIENT_NAME', tier: 1, startIndex: 0, endIndex: 13 },
  ];

  const key = piiVault.store(entities);
  const redacted = 'Hello [PATIENT_1], how are you?';
  const restored = piiVault.restore(redacted, key);

  const pass = restored === 'Hello Rajesh Kumar, how are you?';
  console.log(`  ${pass ? '✅' : '❌'} Redacted: "${redacted}" → "${restored}"`);
}

function testVaultExpiry() {
  console.log('\n▪ Test: Vault - Auto-Expiry (instant check)');

  const entities: PIIEntity[] = [];
  const key = piiVault.store(entities);
  const retrievedImmediately = piiVault.retrieve(key);

  const pass = retrievedImmediately !== null;
  console.log(`  ${pass ? '✅' : '❌'} Entry exists immediately after store: ${pass}`);
  console.log(`  (Full expiry test would take 1+ hour; skipped for speed)`);
}

function testPulseShieldRedaction() {
  console.log('\n▪ Test: PulseShield - Full Redaction Pipeline');

  const text = 'Patient Rajesh Kumar (9876543210) has Diabetes. Aadhaar: 1234-5678-9012. Emergency: Priya (wife)';
  const result = pulseShield.redact(text, 'TEST_FEATURE');

  const pass = result.entities.length > 0 && result.redactedText.includes('[');
  console.log(`  ${pass ? '✅' : '❌'} Redacted to: "${result.redactedText}"`);
  console.log(`     Detected: ${result.tier0Count} Tier-0 + ${result.tier1Count} Tier-1 = ${result.entities.length} total`);
}

function testPulseShieldRestore() {
  console.log('\n▪ Test: PulseShield - Restoration');

  const original = 'Call Rajesh Kumar at 9876543210';
  const result = pulseShield.redact(original);
  const restored = pulseShield.restore(result.redactedText, result.vaultKey);

  const pass = restored === original;
  console.log(`  ${pass ? '✅' : '❌'} Original → Redacted → Restored`);
  if (!pass) {
    console.log(`     Original: "${original}"`);
    console.log(`     Restored: "${restored}"`);
  }
}

function testPulseShieldMetrics() {
  console.log('\n▪ Test: PulseShield - Performance Metrics');

  pulseShield.reset();

  // Run a few redactions
  pulseShield.redact('Test data 1 with Aadhaar 1234-5678-9012');
  pulseShield.redact('Test data 2 with phone 9876543210');

  const metrics = pulseShield.getMetrics();
  const pass = metrics.redactCount === 2 && metrics.totalEntitiesRedacted > 0;

  console.log(`  ${pass ? '✅' : '❌'} Metrics:`);
  console.log(`     Redactions: ${metrics.redactCount}`);
  console.log(`     Avg time: ${metrics.avgRedactionTimeMs.toFixed(2)}ms`);
  console.log(`     Total entities: ${metrics.totalEntitiesRedacted}`);
}

// ============ Auto-run if in test environment ============

// Uncomment to auto-run:
// if (typeof window !== 'undefined') {
//   runPhase1Tests();
// }
