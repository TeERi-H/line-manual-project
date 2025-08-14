// 環境変数検証ユーティリティ
// システム起動時に必要な環境変数の存在と妥当性をチェック

/**
 * 必須環境変数の定義
 */
const REQUIRED_ENV_VARS = {
  // LINE設定
  LINE_CHANNEL_ACCESS_TOKEN: {
    name: 'LINE_CHANNEL_ACCESS_TOKEN',
    description: 'LINE Channel Access Token',
    pattern: /^[a-zA-Z0-9+/]{40,}={0,2}$/,
    example: 'your_line_channel_access_token_here'
  },
  LINE_CHANNEL_SECRET: {
    name: 'LINE_CHANNEL_SECRET',
    description: 'LINE Channel Secret',
    pattern: /^[a-zA-Z0-9]{32}$/,
    example: 'your_line_channel_secret_here'
  },
  
  // Google設定
  GOOGLE_SERVICE_ACCOUNT_EMAIL: {
    name: 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    description: 'Google Service Account Email',
    pattern: /^[^@]+@[^@]+\.iam\.gserviceaccount\.com$/,
    example: 'service-account@project.iam.gserviceaccount.com'
  },
  GOOGLE_PRIVATE_KEY: {
    name: 'GOOGLE_PRIVATE_KEY',
    description: 'Google Service Account Private Key',
    pattern: /^-----BEGIN PRIVATE KEY-----.*-----END PRIVATE KEY-----.*$/s,
    example: '"-----BEGIN PRIVATE KEY-----\\nkey_content\\n-----END PRIVATE KEY-----\\n"'
  },
  SPREADSHEET_ID: {
    name: 'SPREADSHEET_ID',
    description: 'Google Spreadsheet ID',
    pattern: /^[a-zA-Z0-9-_]{44}$/,
    example: 'your_spreadsheet_id_here'
  },
  
  // 管理者設定
  ADMIN_LINE_IDS: {
    name: 'ADMIN_LINE_IDS',
    description: 'Admin LINE User IDs (comma separated)',
    pattern: /^U[a-zA-Z0-9]{32}(,U[a-zA-Z0-9]{32})*$/,
    example: 'Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx,Uyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy'
  }
};

/**
 * オプション環境変数の定義
 */
const OPTIONAL_ENV_VARS = {
  NODE_ENV: {
    name: 'NODE_ENV',
    description: 'Node Environment',
    pattern: /^(development|production|test)$/,
    default: 'development'
  },
  DEBUG_MODE: {
    name: 'DEBUG_MODE',
    description: 'Debug Mode',
    pattern: /^(true|false)$/,
    default: 'false'
  },
  TZ: {
    name: 'TZ',
    description: 'Timezone',
    pattern: /^[\w/]+$/,
    default: 'Asia/Tokyo'
  }
};

/**
 * 環境変数の存在確認
 * @param {string} varName - 環境変数名
 * @returns {boolean} 存在するかどうか
 */
function checkEnvExists(varName) {
  return process.env[varName] !== undefined && process.env[varName] !== '';
}

/**
 * 環境変数の形式確認
 * @param {string} varName - 環境変数名
 * @param {string} value - 環境変数の値
 * @param {RegExp} pattern - 検証パターン
 * @returns {boolean} 形式が正しいかどうか
 */
function validateEnvFormat(varName, value, pattern) {
  if (!pattern) return true;
  
  // GOOGLE_PRIVATE_KEYの特別処理（\\nを\nに変換してからチェック）
  if (varName === 'GOOGLE_PRIVATE_KEY') {
    const normalizedValue = value.replace(/\\n/g, '\n');
    return pattern.test(normalizedValue);
  }
  
  return pattern.test(value);
}

/**
 * 必須環境変数の検証
 * @returns {Object} 検証結果
 */
export function validateRequiredEnvVars() {
  const results = [];
  let allValid = true;

  Object.values(REQUIRED_ENV_VARS).forEach(envVar => {
    const exists = checkEnvExists(envVar.name);
    let formatValid = true;
    let errorMessage = null;

    if (!exists) {
      allValid = false;
      errorMessage = `Missing required environment variable: ${envVar.name}`;
    } else {
      const value = process.env[envVar.name];
      formatValid = validateEnvFormat(envVar.name, value, envVar.pattern);
      
      if (!formatValid) {
        allValid = false;
        errorMessage = `Invalid format for ${envVar.name}. Expected pattern: ${envVar.pattern}`;
      }
    }

    results.push({
      name: envVar.name,
      description: envVar.description,
      exists,
      formatValid,
      valid: exists && formatValid,
      errorMessage,
      example: envVar.example
    });
  });

  return {
    allValid,
    results,
    summary: {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length
    }
  };
}

/**
 * オプション環境変数の検証とデフォルト値設定
 * @returns {Object} 検証結果
 */
export function validateOptionalEnvVars() {
  const results = [];

  Object.values(OPTIONAL_ENV_VARS).forEach(envVar => {
    const exists = checkEnvExists(envVar.name);
    let value = process.env[envVar.name];
    let formatValid = true;
    let usingDefault = false;

    if (!exists && envVar.default) {
      value = envVar.default;
      usingDefault = true;
      // デフォルト値を実際にセット
      process.env[envVar.name] = envVar.default;
    }

    if (value) {
      formatValid = validateEnvFormat(envVar.name, value, envVar.pattern);
    }

    results.push({
      name: envVar.name,
      description: envVar.description,
      exists,
      formatValid,
      value,
      usingDefault,
      valid: formatValid
    });
  });

  return {
    results,
    summary: {
      total: results.length,
      usingDefaults: results.filter(r => r.usingDefault).length
    }
  };
}

/**
 * 全環境変数の包括的検証
 * @returns {Object} 完全な検証結果
 */
export function validateAllEnvVars() {
  const requiredValidation = validateRequiredEnvVars();
  const optionalValidation = validateOptionalEnvVars();

  const allResults = [
    ...requiredValidation.results,
    ...optionalValidation.results
  ];

  return {
    success: requiredValidation.allValid,
    required: requiredValidation,
    optional: optionalValidation,
    summary: {
      totalVars: allResults.length,
      requiredVars: requiredValidation.results.length,
      optionalVars: optionalValidation.results.length,
      validRequired: requiredValidation.summary.valid,
      invalidRequired: requiredValidation.summary.invalid,
      usingDefaults: optionalValidation.summary.usingDefaults
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * 環境変数検証エラーのフォーマット
 * @param {Object} validation - 検証結果
 * @returns {string} フォーマットされたエラーメッセージ
 */
export function formatValidationErrors(validation) {
  if (validation.success) {
    return 'All environment variables are valid';
  }

  const errors = validation.required.results
    .filter(result => !result.valid)
    .map(result => `❌ ${result.errorMessage}\n   Example: ${result.example}`)
    .join('\n\n');

  const summary = `
🔧 Environment Variable Validation Failed

${errors}

💡 Please check your .env.local file and ensure all required variables are set correctly.
📖 See .env.example for the complete template.
`;

  return summary;
}

/**
 * 環境変数の安全な表示（秘密情報をマスク）
 * @param {Object} validation - 検証結果
 * @returns {Object} マスクされた検証結果
 */
export function getSafeValidationSummary(validation) {
  const safeSummary = {
    success: validation.success,
    summary: validation.summary,
    timestamp: validation.timestamp,
    variables: {}
  };

  // 必須変数の安全な要約
  validation.required.results.forEach(result => {
    safeSummary.variables[result.name] = {
      exists: result.exists,
      valid: result.valid,
      description: result.description
    };
  });

  // オプション変数の安全な要約
  validation.optional.results.forEach(result => {
    safeSummary.variables[result.name] = {
      exists: result.exists,
      valid: result.valid,
      usingDefault: result.usingDefault,
      description: result.description
    };
  });

  return safeSummary;
}