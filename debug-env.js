import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('GOOGLE_PRIVATE_KEY check:');
console.log('Exists:', !!process.env.GOOGLE_PRIVATE_KEY);
console.log('Length:', process.env.GOOGLE_PRIVATE_KEY?.length || 0);
console.log('First 50 chars:', process.env.GOOGLE_PRIVATE_KEY?.substring(0, 50));
console.log('Last 50 chars:', process.env.GOOGLE_PRIVATE_KEY?.substring(process.env.GOOGLE_PRIVATE_KEY.length - 50));

const pattern = /^-----BEGIN PRIVATE KEY-----.*-----END PRIVATE KEY-----.*$/s;
console.log('Pattern test:', pattern.test(process.env.GOOGLE_PRIVATE_KEY || ''));