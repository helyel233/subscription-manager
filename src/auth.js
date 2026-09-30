// 工具函数
import { DEFAULT_EXCHANGE_RATES } from './dashboard.js';

function generateRandomSecret() {
  // 生成一个64字符的随机密钥
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ==================== 密码哈希（PBKDF2） ====================
// 哈希存储格式：pbkdf2$<iterations>$<saltHex>$<hashHex>
const PBKDF2_ITERATIONS = 100000;

function isPasswordHash(password) {
  return typeof password === 'string' && password.startsWith('pbkdf2$');
}

// 将明文密码哈希为 PBKDF2 格式
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = await pbkdf2Hex(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

// 校验密码：支持哈希比对与旧明文迁移
async function verifyPassword(inputPassword, storedPassword) {
  try {
    if (isPasswordHash(storedPassword)) {
      const [scheme, iterations, saltHex, hashHex] = storedPassword.split('$');
      if (scheme !== 'pbkdf2' || !saltHex || !hashHex) {
        return false;
      }
      const salt = new Uint8Array(saltHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
      const inputHash = await pbkdf2Hex(inputPassword, salt, Number(iterations) || PBKDF2_ITERATIONS);
      return constantTimeEquals(inputHash, hashHex);
    }

    // 兼容旧明文密码
    return inputPassword === storedPassword;
  } catch (error) {
    console.error('[安全] 密码校验失败:', error);
    return false;
  }
}

async function pbkdf2Hex(password, saltBuffer, iterations) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 常量时间字符串比较，避免时序攻击
function constantTimeEquals(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function getConfig(env) {
  try {
    if (!env.SUBSCRIPTIONS_KV) {
      console.error('[配置] KV存储未绑定');
      throw new Error('KV存储未绑定');
    }

    const data = await env.SUBSCRIPTIONS_KV.get('config');
    console.log('[配置] 从KV读取配置:', data ? '成功' : '空配置');

    const config = data ? JSON.parse(data) : {};

    // 确保JWT_SECRET的一致性
    let jwtSecret = config.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key') {
      jwtSecret = generateRandomSecret();
      console.log('[配置] 生成新的JWT密钥');

      // 保存新的JWT密钥
      const updatedConfig = { ...config, JWT_SECRET: jwtSecret };
      await env.SUBSCRIPTIONS_KV.put('config', JSON.stringify(updatedConfig));
    }

    const finalConfig = {
      ADMIN_USERNAME: config.ADMIN_USERNAME || 'admin',
      ADMIN_PASSWORD: config.ADMIN_PASSWORD || 'password',
      JWT_SECRET: jwtSecret,
      TG_BOT_TOKEN: config.TG_BOT_TOKEN || '',
      TG_CHAT_ID: config.TG_CHAT_ID || '',
      NOTIFYX_API_KEY: config.NOTIFYX_API_KEY || '',
      WEBHOOK_URL: config.WEBHOOK_URL || '',
      WEBHOOK_METHOD: config.WEBHOOK_METHOD || 'POST',
      WEBHOOK_HEADERS: config.WEBHOOK_HEADERS || '',
      WEBHOOK_TEMPLATE: config.WEBHOOK_TEMPLATE || '',
      SHOW_LUNAR: config.SHOW_LUNAR === true,
      WECHATBOT_WEBHOOK: config.WECHATBOT_WEBHOOK || '',
      WECHATBOT_MSG_TYPE: config.WECHATBOT_MSG_TYPE || 'text',
      WECHATBOT_AT_MOBILES: config.WECHATBOT_AT_MOBILES || '',
      WECHATBOT_AT_ALL: config.WECHATBOT_AT_ALL || 'false',
      RESEND_API_KEY: config.RESEND_API_KEY || '',
      EMAIL_FROM: config.EMAIL_FROM || '',
      EMAIL_FROM_NAME: config.EMAIL_FROM_NAME || '',
      EMAIL_TO: config.EMAIL_TO || '',
      BARK_DEVICE_KEY: config.BARK_DEVICE_KEY || '',
      BARK_SERVER: config.BARK_SERVER || 'https://api.day.app',
      BARK_IS_ARCHIVE: config.BARK_IS_ARCHIVE || 'false',
      DINGTALK_WEBHOOK: config.DINGTALK_WEBHOOK || '',
      DINGTALK_SECRET: config.DINGTALK_SECRET || '',
      FEISHU_WEBHOOK: config.FEISHU_WEBHOOK || '',
      FEISHU_SECRET: config.FEISHU_SECRET || '',
      SERVERCHAN_SENDKEY: config.SERVERCHAN_SENDKEY || '',
      PUSHPLUS_TOKEN: config.PUSHPLUS_TOKEN || '',
      WXPUSHER_APP_TOKEN: config.WXPUSHER_APP_TOKEN || '',
      WXPUSHER_UID: config.WXPUSHER_UID || '',
      DISCORD_WEBHOOK: config.DISCORD_WEBHOOK || '',
      SLACK_WEBHOOK: config.SLACK_WEBHOOK || '',
      NTFY_SERVER: config.NTFY_SERVER || 'https://ntfy.sh',
      NTFY_TOPIC: config.NTFY_TOPIC || '',
      NTFY_TOKEN: config.NTFY_TOKEN || '',
      PUSHOVER_TOKEN: config.PUSHOVER_TOKEN || '',
      PUSHOVER_USER: config.PUSHOVER_USER || '',
      PUSHDEER_SERVER: config.PUSHDEER_SERVER || 'https://api2.pushdeer.com',
      PUSHDEER_KEY: config.PUSHDEER_KEY || '',
      ENABLED_NOTIFIERS: config.ENABLED_NOTIFIERS || ['notifyx'],
      TIMEZONE: config.TIMEZONE || 'UTC', // 新增时区字段
      NOTIFICATION_HOURS: Array.isArray(config.NOTIFICATION_HOURS) ? config.NOTIFICATION_HOURS : [],
      THIRD_PARTY_API_TOKEN: config.THIRD_PARTY_API_TOKEN || '',
      WEBDAV_URL: config.WEBDAV_URL || '',
      WEBDAV_DIR: config.WEBDAV_DIR || 'SubsTracker',
      DASHBOARD_CARDS: (config.DASHBOARD_CARDS && typeof config.DASHBOARD_CARDS === 'object' && !Array.isArray(config.DASHBOARD_CARDS)) ? config.DASHBOARD_CARDS : {},
      WEBDAV_USERNAME: config.WEBDAV_USERNAME || '',
      WEBDAV_PASSWORD: config.WEBDAV_PASSWORD || '',
      EXCHANGE_RATES: { ...DEFAULT_EXCHANGE_RATES, ...(config.EXCHANGE_RATES || {}) }
    };

    console.log('[配置] 最终配置用户名:', finalConfig.ADMIN_USERNAME);
    return finalConfig;
  } catch (error) {
    console.error('[配置] 获取配置失败:', error);
    const defaultJwtSecret = generateRandomSecret();

    return {
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'password',
      JWT_SECRET: defaultJwtSecret,
      WEBDAV_URL: '',
      WEBDAV_DIR: 'SubsTracker',
      DASHBOARD_CARDS: {},
      WEBDAV_USERNAME: '',
      WEBDAV_PASSWORD: '',
      TG_BOT_TOKEN: '',
      TG_CHAT_ID: '',
      NOTIFYX_API_KEY: '',
      WEBHOOK_URL: '',
      WEBHOOK_METHOD: 'POST',
      WEBHOOK_HEADERS: '',
      WEBHOOK_TEMPLATE: '',
      SHOW_LUNAR: true,
      WECHATBOT_WEBHOOK: '',
      WECHATBOT_MSG_TYPE: 'text',
      WECHATBOT_AT_MOBILES: '',
      WECHATBOT_AT_ALL: 'false',
      RESEND_API_KEY: '',
      EMAIL_FROM: '',
      EMAIL_FROM_NAME: '',
      EMAIL_TO: '',
      DINGTALK_WEBHOOK: '',
      DINGTALK_SECRET: '',
      FEISHU_WEBHOOK: '',
      FEISHU_SECRET: '',
      SERVERCHAN_SENDKEY: '',
      PUSHPLUS_TOKEN: '',
      WXPUSHER_APP_TOKEN: '',
      WXPUSHER_UID: '',
      DISCORD_WEBHOOK: '',
      SLACK_WEBHOOK: '',
      NTFY_SERVER: 'https://ntfy.sh',
      NTFY_TOPIC: '',
      NTFY_TOKEN: '',
      PUSHOVER_TOKEN: '',
      PUSHOVER_USER: '',
      PUSHDEER_SERVER: 'https://api2.pushdeer.com',
      PUSHDEER_KEY: '',
      ENABLED_NOTIFIERS: ['notifyx'],
      NOTIFICATION_HOURS: [],
      TIMEZONE: 'UTC', // 新增时区字段
      THIRD_PARTY_API_TOKEN: '',
      EXCHANGE_RATES: { ...DEFAULT_EXCHANGE_RATES }
    };
  }
}

// JWT 有效期（毫秒）：24 小时
const JWT_EXPIRY_MS = 24 * 60 * 60 * 1000;

async function generateJWT(username, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { username, iat: now, exp: now + Math.floor(JWT_EXPIRY_MS / 1000) };

  const headerBase64 = btoa(JSON.stringify(header));
  const payloadBase64 = btoa(JSON.stringify(payload));

  const signatureInput = headerBase64 + '.' + payloadBase64;
  const signature = await CryptoJS.HmacSHA256(signatureInput, secret);

  return headerBase64 + '.' + payloadBase64 + '.' + signature;
}

async function verifyJWT(token, secret) {
  try {
    if (!token || !secret) {
      console.log('[JWT] Token或Secret为空');
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('[JWT] Token格式错误，部分数量:', parts.length);
      return null;
    }

    const [headerBase64, payloadBase64, signature] = parts;
    const signatureInput = headerBase64 + '.' + payloadBase64;
    const expectedSignature = await CryptoJS.HmacSHA256(signatureInput, secret);

    if (signature !== expectedSignature) {
      console.log('[JWT] 签名验证失败');
      return null;
    }

    const payload = JSON.parse(atob(payloadBase64));

    // 校验令牌是否过期
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log('[JWT] Token已过期，用户:', payload.username);
      return null;
    }

    console.log('[JWT] 验证成功，用户:', payload.username);
    return payload;
  } catch (error) {
    console.error('[JWT] 验证过程出错:', error);
    return null;
  }
}

function getCookieValue(cookieString, key) {
  if (!cookieString) return null;

  const match = cookieString.match(new RegExp('(^| )' + key + '=([^;]+)'));
  return match ? match[2] : null;
}
const CryptoJS = {
  HmacSHA256: function(message, key) {
    const keyData = new TextEncoder().encode(key);
    const messageData = new TextEncoder().encode(message);

    return Promise.resolve().then(() => {
      return crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: {name: "SHA-256"} },
        false,
        ["sign"]
      );
    }).then(cryptoKey => {
      return crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        messageData
      );
    }).then(buffer => {
      const hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
  }
};

export { generateRandomSecret, getConfig, generateJWT, verifyJWT, getCookieValue, hashPassword, verifyPassword, isPasswordHash };
