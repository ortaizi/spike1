import { CredentialsEncryption } from './lib/auth/encryption';

console.log('🧪 Testing encryption fix...\n');

async function testEncryptionFix() {
  try {
    // Test basic encryption/decryption
    console.log('Running built-in test...');
    const result = CredentialsEncryption.testEncryption();

    if (result) {
      console.log('\n✅ SUCCESS: Built-in encryption test passed!');
    } else {
      console.log('\n❌ FAILED: Built-in encryption test failed');
      return false;
    }

    // Test IV randomization
    console.log('\n🔍 Testing IV randomization...');
    const username = 'testuser';
    const password = 'testpass123';

    // Encrypt the same data twice
    const encrypted1 = CredentialsEncryption.encryptCredentials(username, password);
    const encrypted2 = CredentialsEncryption.encryptCredentials(username, password);

    console.log('First encryption IV:', encrypted1.iv);
    console.log('Second encryption IV:', encrypted2.iv);

    // The encrypted values should be different because of unique IVs
    if (
      encrypted1.encryptedUsername !== encrypted2.encryptedUsername &&
      encrypted1.encryptedPassword !== encrypted2.encryptedPassword &&
      encrypted1.iv !== encrypted2.iv
    ) {
      console.log('✅ SUCCESS: IV randomization working correctly!');
      console.log('✅ Same plaintext produces different ciphertext (proper IV usage)');
    } else {
      console.log('❌ FAILED: IV randomization not working - encryption is predictable!');
      return false;
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

    if (
      decrypted1.username === username &&
      decrypted1.password === password &&
      decrypted2.username === username &&
      decrypted2.password === password
    ) {
      console.log('✅ SUCCESS: Both encrypted versions decrypt correctly!');
      console.log('\n🎉 ALL TESTS PASSED: Encryption vulnerability fix is successful!');
      console.log('🔒 Security status: CRITICAL vulnerability resolved ✅');
      return true;
    } else {
      console.log('❌ FAILED: Decryption failed for one or both versions');
      return false;
    }
  } catch (error) {
    console.error('❌ ERROR: Encryption test failed:', error);
    return false;
  }
}

testEncryptionFix();
