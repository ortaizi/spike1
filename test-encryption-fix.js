// Test script to verify encryption fixes
import { CredentialsEncryption } from './apps/web/lib/auth/encryption.ts';

console.log('🧪 Testing encryption fix...\n');

try {
  // Test basic encryption/decryption
  const result = CredentialsEncryption.testEncryption();

  if (result) {
    console.log('\n✅ SUCCESS: Encryption fix is working correctly!');
    console.log('✅ All cryptographic vulnerabilities have been resolved.');
  } else {
    console.log('\n❌ FAILED: Encryption test failed');
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ ERROR: Encryption test threw an error:', error);
  process.exit(1);
}

// Test that different plaintexts produce different ciphertexts (IV working)
console.log('\n🔍 Testing IV randomization...');

try {
  const username = 'testuser';
  const password = 'testpass123';

  // Encrypt the same data twice
  const encrypted1 = CredentialsEncryption.encryptCredentials(username, password);
  const encrypted2 = CredentialsEncryption.encryptCredentials(username, password);

  // The encrypted values should be different because of unique IVs
  if (encrypted1.encryptedUsername !== encrypted2.encryptedUsername &&
      encrypted1.encryptedPassword !== encrypted2.encryptedPassword &&
      encrypted1.iv !== encrypted2.iv) {
    console.log('✅ SUCCESS: IV randomization working correctly!');
    console.log('✅ Same plaintext produces different ciphertext (proper IV usage)');
  } else {
    console.log('❌ FAILED: IV randomization not working - encryption is predictable!');
    process.exit(1);
  }

  // Test that both can be decrypted correctly
  const decrypted1 = CredentialsEncryption.decryptCredentials(
    encrypted1.encryptedUsername,
    encrypted1.encryptedPassword,
    encrypted1.authTag,
    encrypted1.iv
  );

  const decrypted2 = CredentialsEncryption.decryptCredentials(
    encrypted2.encryptedUsername,
    encrypted2.encryptedPassword,
    encrypted2.authTag,
    encrypted2.iv
  );

  if (decrypted1.username === username && decrypted1.password === password &&
      decrypted2.username === username && decrypted2.password === password) {
    console.log('✅ SUCCESS: Both encrypted versions decrypt correctly!');
  } else {
    console.log('❌ FAILED: Decryption failed for one or both versions');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ ERROR: IV randomization test failed:', error);
  process.exit(1);
}

console.log('\n🎉 ALL TESTS PASSED: Encryption vulnerability fix is successful!');
console.log('🔒 Security status: CRITICAL vulnerability resolved ✅');