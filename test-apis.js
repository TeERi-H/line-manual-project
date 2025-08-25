// 直接APIテストを実行するスクリプト

import dotenv from 'dotenv';
import testConnectionHandler from './api/test-connection.js';
import systemTestHandler from './api/system-test.js';

// .env.localファイルを読み込み
dotenv.config({ path: '.env.local' });
console.log('📁 Environment file: .env.local loaded');

console.log('🧪 Running API tests...\n');

// モックreq/resオブジェクト
const createMockReq = (method = 'GET', query = {}) => ({
  method,
  query
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(data) { 
      console.log(`Status: ${this.statusCode}`);
      console.log(JSON.stringify(data, null, 2));
      return this;
    },
    end() { return this; }
  };
  return res;
};

async function runTests() {
  try {
    console.log('='.repeat(50));
    console.log('📋 Testing Connection API');
    console.log('='.repeat(50));
    
    const req1 = createMockReq();
    const res1 = createMockRes();
    await testConnectionHandler(req1, res1);
    
    console.log('\n' + '='.repeat(50));
    console.log('🧪 Testing System Test API (basic mode)');
    console.log('='.repeat(50));
    
    const req2 = createMockReq('GET', { mode: 'basic' });
    const res2 = createMockRes();
    await systemTestHandler(req2, res2);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

runTests();