import { getConfig, generateJWT, verifyJWT, getCookieValue } from './auth.js';
import {
  getAllSubscriptions,
  getSubscription,
  saveSubscription,
  deleteSubscriptionKey,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  manualRenewSubscription,
  deletePaymentRecord,
  updatePaymentRecord,
  toggleSubscriptionStatus
} from './store.js';
import {
  sendNotificationToAllChannels,
  sendTelegramNotification,
  sendNotifyXNotification,
  sendWebhookNotification,
  sendWechatBotNotification,
  sendEmailNotification,
  sendBarkNotification,
  sendDingtalkNotification,
  sendFeishuNotification,
  sendServerchanNotification,
  sendPushplusNotification,
  sendWxpusherNotification,
  sendDiscordNotification,
  sendSlackNotification,
  sendNtfyNotification,
  sendPushoverNotification,
  sendPushdeerNotification
} from './notify.js';
import { extractTagsFromSubscriptions } from './pages.js';
import { lunarCalendar } from './lunar.js';
import {
  calculateMonthlyExpense,
  calculateYearlyExpense,
  getRecentPayments,
  getUpcomingRenewals,
  getExpenseByType,
  getExpenseByCategory,
  getMonthlyExpenseTrend,
  getCurrencyDistribution,
  getMonthlyBreakdown,
  getNextExpiry
} from './dashboard.js';
import { formatTimeInTimezone, formatTimezoneDisplay, getCurrentTimeInTimezone, MS_PER_DAY } from './timezone.js';
import { DEFAULT_EXCHANGE_RATES } from './dashboard.js';
import { hashPassword, verifyPassword, isPasswordHash } from './auth.js';

// ==================== 登录限流（基于 KV） ====================
const LOGIN_RATE_KEY = 'login_rate_limit';
const LOGIN_MAX_ATTEMPTS = 5;      // 最大连续失败次数
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 锁定窗口：15 分钟

// 读取当前登录失败状态
async function getLoginRateState(env) {
  try {
    const data = await env.SUBSCRIPTIONS_KV.get(LOGIN_RATE_KEY);
    return data ? JSON.parse(data) : { count: 0, windowStart: 0 };
  } catch (error) {
    return { count: 0, windowStart: 0 };
  }
}

// 记录一次登录失败
async function recordLoginFailure(env) {
  const now = Date.now();
  const state = await getLoginRateState(env);
  if (now - state.windowStart > LOGIN_WINDOW_MS) {
    state.count = 0;
    state.windowStart = now;
  }
  state.count += 1;
  await env.SUBSCRIPTIONS_KV.put(LOGIN_RATE_KEY, JSON.stringify(state), { expirationTtl: 900 });
}

// 登录成功后重置失败计数
async function resetLoginFailures(env) {
  await env.SUBSCRIPTIONS_KV.delete(LOGIN_RATE_KEY);
}

// 解析汇率配置（支持对象或 JSON 字符串）
function parseExchangeRates(rawRates) {
  if (!rawRates) {
    return { ...DEFAULT_EXCHANGE_RATES };
  }
  if (typeof rawRates === 'object') {
    return { ...DEFAULT_EXCHANGE_RATES, ...rawRates };
  }
  try {
    const parsed = JSON.parse(rawRates);
    if (parsed && typeof parsed === 'object') {
      return { ...DEFAULT_EXCHANGE_RATES, ...parsed };
    }
  } catch (error) {
    console.warn('[汇率] 配置格式错误，使用默认汇率:', error.message);
  }
  return { ...DEFAULT_EXCHANGE_RATES };
}

// 处理API请求

// 与前端一致的分类切割正则，用于服务端分类筛选
const CATEGORY_SEPARATOR_REGEX = /[\/,，\s]+/;

// 导入数据时生成新 ID，避免覆盖现有订阅
function generateImportId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString() + '_' + Math.random().toString(36).slice(2, 11);
}

// 将导入的订阅列表写入 KV：merge 模式跳过重复 ID，replace 模式清空现有数据后导入
async function applyImportedSubscriptions(env, importedSubscriptions, mode) {
  if (mode === 'replace') {
    const existing = await getAllSubscriptions(env);
    await Promise.all(existing.map(sub => deleteSubscriptionKey(sub.id, env)));
  }

  const existingSubscriptions = mode === 'merge' ? await getAllSubscriptions(env) : [];
  const existingIds = new Set(existingSubscriptions.map(sub => sub.id));

  let importedCount = 0;
  let skippedCount = 0;
  for (const subscription of importedSubscriptions) {
    if (!subscription || !subscription.name || !subscription.expiryDate) {
      skippedCount += 1;
      continue;
    }

    // 缺失 ID 或与现有数据冲突时重新生成，避免覆盖
    if (!subscription.id || existingIds.has(subscription.id)) {
      if (subscription.id && existingIds.has(subscription.id) && mode === 'merge') {
        skippedCount += 1;
        continue;
      }
      subscription.id = generateImportId();
    }

    await saveSubscription(subscription, env);
    existingIds.add(subscription.id);
    importedCount += 1;
  }

  return { importedCount, skippedCount };
}

// ==================== WebDAV 云备份 ====================

// 规范化 WebDAV 目录地址：去除结尾斜杠
export function normalizeWebdavUrl(url) {
  return (url || '').trim().replace(/\/+$/, '');
}

// 备份统一存放在配置目录下的专用子目录（可自定义，默认 SubsTracker），避免与其他文件混在一起
const WEBDAV_BACKUP_DIR = 'SubsTracker';

// 规范化备份子目录名：去除首尾斜杠，为空或含路径穿越时回退默认值
export function normalizeWebdavDirName(dir) {
  const name = (dir || '').trim().replace(/^\/+|\/+$/g, '');
  if (!name || name.includes('..')) {
    return WEBDAV_BACKUP_DIR;
  }
  return name;
}

// 计算备份实际存放的远端目录地址
export function buildWebdavDirUrl(url, dir) {
  return normalizeWebdavUrl(url) + '/' + normalizeWebdavDirName(dir);
}

// 从配置中提取 WebDAV 连接信息，未配置地址时返回 null
function getWebdavConfig(config) {
  const baseUrl = normalizeWebdavUrl(config.WEBDAV_URL);
  if (!baseUrl) {
    return null;
  }
  const raw = (config.WEBDAV_USERNAME || '') + ':' + (config.WEBDAV_PASSWORD || '');
  return { baseUrl, dirUrl: buildWebdavDirUrl(baseUrl, config.WEBDAV_DIR), authHeader: 'Basic ' + btoa(unescape(encodeURIComponent(raw))) };
}

// 确保 WebDAV 备份目录存在（逐级创建，目录已存在时服务器返回 405，忽略即可）
async function ensureWebdavDirectory(webdav) {
  for (const dirUrl of [webdav.baseUrl, webdav.dirUrl]) {
    try {
      await fetch(dirUrl + '/', {
        method: 'MKCOL',
        headers: { Authorization: webdav.authHeader }
      });
    } catch (error) {
      console.error('[WebDAV] 创建目录失败:', error);
    }
  }
}

// 解析 PROPFIND（Depth: 1）响应中的备份文件列表
export function parseWebdavPropfindXml(xml) {
  const results = [];
  const blocks = xml.match(/<(?:\w+:)?response\b[\s\S]*?<\/(?:\w+:)?response>/g) || [];
  for (const block of blocks) {
    const href = ((block.match(/<(?:\w+:)?href\b[^>]*>([\s\S]*?)<\/(?:\w+:)?href>/) || [])[1] || '').trim();
    const lastModified = ((block.match(/<(?:\w+:)?getlastmodified\b[^>]*>([\s\S]*?)<\/(?:\w+:)?getlastmodified>/) || [])[1] || '').trim();
    const size = ((block.match(/<(?:\w+:)?getcontentlength\b[^>]*>([\s\S]*?)<\/(?:\w+:)?getcontentlength>/) || [])[1] || '').trim();
    const rawName = href.split('/').filter(Boolean).pop() || '';
    let name = rawName;
    try {
      name = decodeURIComponent(rawName);
    } catch (error) {
      // 名称含非法编码时保留原值
    }
    if (name.toLowerCase().endsWith('.json')) {
      results.push({ name, size: Number(size) || 0, lastModified });
    }
  }
  return results;
}

const api = {
  async handleRequest(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.slice(4);
    const method = request.method;

    const config = await getConfig(env);

    if (path === '/login' && method === 'POST') {
      // 登录限流：窗口期内失败次数达到上限后拒绝请求
      const rateState = await getLoginRateState(env);
      if (rateState.count >= LOGIN_MAX_ATTEMPTS && Date.now() - rateState.windowStart <= LOGIN_WINDOW_MS) {
        return new Response(
          JSON.stringify({ success: false, message: '登录失败次数过多，请 15 分钟后重试' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const body = await request.json();

      const usernameValid = body.username === config.ADMIN_USERNAME;
      const passwordValid = usernameValid && body.password && await verifyPassword(body.password, config.ADMIN_PASSWORD);

      if (usernameValid && passwordValid) {
        await resetLoginFailures(env);

        // 旧明文密码自动升级为哈希存储
        if (!isPasswordHash(config.ADMIN_PASSWORD)) {
          try {
            const upgradedConfig = { ...config, ADMIN_PASSWORD: await hashPassword(config.ADMIN_PASSWORD) };
            await env.SUBSCRIPTIONS_KV.put('config', JSON.stringify(upgradedConfig));
            console.log('[安全] 已将明文密码升级为 PBKDF2 哈希存储');
          } catch (error) {
            console.error('[安全] 密码哈希升级失败:', error);
          }
        }

        const token = await generateJWT(body.username, config.JWT_SECRET);

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': 'token=' + token + '; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400'
            }
          }
        );
      } else {
        await recordLoginFailure(env);
        return new Response(
          JSON.stringify({ success: false, message: '用户名或密码错误' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (path === '/logout' && (method === 'GET' || method === 'POST')) {
      return new Response('', {
        status: 302,
        headers: {
          'Location': '/',
          'Set-Cookie': 'token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0'
        }
      });
    }

    const token = getCookieValue(request.headers.get('Cookie'), 'token');
    const user = token ? await verifyJWT(token, config.JWT_SECRET) : null;

    if (!user && path !== '/login') {
      return new Response(
        JSON.stringify({ success: false, message: '未授权访问' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/config') {
      if (method === 'GET') {
        const { JWT_SECRET, ADMIN_PASSWORD, ...safeConfig } = config;
        return new Response(
          JSON.stringify(safeConfig),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (method === 'POST') {
        try {
          const newConfig = await request.json();

          const updatedConfig = {
            ...config,
            ADMIN_USERNAME: newConfig.ADMIN_USERNAME || config.ADMIN_USERNAME,
            TG_BOT_TOKEN: newConfig.TG_BOT_TOKEN || '',
            TG_CHAT_ID: newConfig.TG_CHAT_ID || '',
            NOTIFYX_API_KEY: newConfig.NOTIFYX_API_KEY || '',
            WEBHOOK_URL: newConfig.WEBHOOK_URL || '',
            WEBHOOK_METHOD: newConfig.WEBHOOK_METHOD || 'POST',
            WEBHOOK_HEADERS: newConfig.WEBHOOK_HEADERS || '',
            WEBHOOK_TEMPLATE: newConfig.WEBHOOK_TEMPLATE || '',
            SHOW_LUNAR: newConfig.SHOW_LUNAR === true,
            WECHATBOT_WEBHOOK: newConfig.WECHATBOT_WEBHOOK || '',
            WECHATBOT_MSG_TYPE: newConfig.WECHATBOT_MSG_TYPE || 'text',
            WECHATBOT_AT_MOBILES: newConfig.WECHATBOT_AT_MOBILES || '',
            WECHATBOT_AT_ALL: newConfig.WECHATBOT_AT_ALL || 'false',
            RESEND_API_KEY: newConfig.RESEND_API_KEY || '',
            EMAIL_FROM: newConfig.EMAIL_FROM || '',
            EMAIL_FROM_NAME: newConfig.EMAIL_FROM_NAME || '',
            EMAIL_TO: newConfig.EMAIL_TO || '',
            BARK_DEVICE_KEY: newConfig.BARK_DEVICE_KEY || '',
            BARK_SERVER: newConfig.BARK_SERVER || 'https://api.day.app',
            BARK_IS_ARCHIVE: newConfig.BARK_IS_ARCHIVE || 'false',
            DINGTALK_WEBHOOK: newConfig.DINGTALK_WEBHOOK || '',
            DINGTALK_SECRET: newConfig.DINGTALK_SECRET || '',
            FEISHU_WEBHOOK: newConfig.FEISHU_WEBHOOK || '',
            FEISHU_SECRET: newConfig.FEISHU_SECRET || '',
            SERVERCHAN_SENDKEY: newConfig.SERVERCHAN_SENDKEY || '',
            PUSHPLUS_TOKEN: newConfig.PUSHPLUS_TOKEN || '',
            WXPUSHER_APP_TOKEN: newConfig.WXPUSHER_APP_TOKEN || '',
            WXPUSHER_UID: newConfig.WXPUSHER_UID || '',
            DISCORD_WEBHOOK: newConfig.DISCORD_WEBHOOK || '',
            SLACK_WEBHOOK: newConfig.SLACK_WEBHOOK || '',
            NTFY_SERVER: newConfig.NTFY_SERVER || 'https://ntfy.sh',
            NTFY_TOPIC: newConfig.NTFY_TOPIC || '',
            NTFY_TOKEN: newConfig.NTFY_TOKEN || '',
            PUSHOVER_TOKEN: newConfig.PUSHOVER_TOKEN || '',
            PUSHOVER_USER: newConfig.PUSHOVER_USER || '',
            PUSHDEER_SERVER: newConfig.PUSHDEER_SERVER || 'https://api2.pushdeer.com',
            PUSHDEER_KEY: newConfig.PUSHDEER_KEY || '',
            ENABLED_NOTIFIERS: newConfig.ENABLED_NOTIFIERS || ['notifyx'],
            TIMEZONE: newConfig.TIMEZONE || config.TIMEZONE || 'UTC',
            THIRD_PARTY_API_TOKEN: newConfig.THIRD_PARTY_API_TOKEN || '',
                        WEBDAV_URL: newConfig.WEBDAV_URL || '',
                        WEBDAV_DIR: normalizeWebdavDirName(newConfig.WEBDAV_DIR),
                        DASHBOARD_CARDS: (newConfig.DASHBOARD_CARDS && typeof newConfig.DASHBOARD_CARDS === 'object' && !Array.isArray(newConfig.DASHBOARD_CARDS))
                          ? newConfig.DASHBOARD_CARDS
                          : (config.DASHBOARD_CARDS || {}),
                        WEBDAV_USERNAME: newConfig.WEBDAV_USERNAME || '',
                        WEBDAV_PASSWORD: newConfig.WEBDAV_PASSWORD || '',
            EXCHANGE_RATES: parseExchangeRates(
              newConfig.EXCHANGE_RATES !== undefined ? newConfig.EXCHANGE_RATES : config.EXCHANGE_RATES
            )
          };

          const rawNotificationHours = Array.isArray(newConfig.NOTIFICATION_HOURS)
            ? newConfig.NOTIFICATION_HOURS
            : typeof newConfig.NOTIFICATION_HOURS === 'string'
              ? newConfig.NOTIFICATION_HOURS.split(',')
              : [];

          const sanitizedNotificationHours = rawNotificationHours
            .map(value => String(value).trim())
            .filter(value => value.length > 0)
            .map(value => {
              const upperValue = value.toUpperCase();
              if (upperValue === '*' || upperValue === 'ALL') {
                return '*';
              }
              const numeric = Number(upperValue);
              if (!isNaN(numeric)) {
                return String(Math.max(0, Math.min(23, Math.floor(numeric)))).padStart(2, '0');
              }
              return upperValue;
            });

          updatedConfig.NOTIFICATION_HOURS = sanitizedNotificationHours;

          if (newConfig.ADMIN_PASSWORD) {
            // 密码以 PBKDF2 哈希存储，不再保存明文
            updatedConfig.ADMIN_PASSWORD = await hashPassword(newConfig.ADMIN_PASSWORD);
          }

          // 确保JWT_SECRET存在且安全
          if (!updatedConfig.JWT_SECRET || updatedConfig.JWT_SECRET === 'your-secret-key') {
            updatedConfig.JWT_SECRET = generateRandomSecret();
            console.log('[安全] 生成新的JWT密钥');
          }

          await env.SUBSCRIPTIONS_KV.put('config', JSON.stringify(updatedConfig));

          return new Response(
            JSON.stringify({ success: true }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('配置保存错误:', error);
          return new Response(
            JSON.stringify({ success: false, message: '更新配置失败: ' + error.message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // 仪表盘卡片显示偏好：保存到配置以实现跨设备同步
    const DASHBOARD_CARD_IDS = [
      'statMonthly', 'statYearly', 'statActive', 'statDaily', 'statCountdown', 'statPaidPending',
      'trendCard', 'currencyCard', 'recentCard', 'upcomingCard', 'typeCard', 'categoryCard'
    ];
    
    if (path === '/dashboard/cards' && method === 'POST') {
          try {
            const body = await request.json();
            const rawCards = body && typeof body.cards === 'object' && body.cards !== null && !Array.isArray(body.cards)
              ? body.cards
              : null;
            if (!rawCards) {
              return new Response(
                JSON.stringify({ success: false, message: '非法的卡片配置' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
              );
            }
    
            // 仅接受已知卡片 ID，统一存储全部布尔值
            const cards = {};
            DASHBOARD_CARD_IDS.forEach(id => {
              cards[id] = rawCards[id] !== false;
            });
    
            const newConfig = { ...config, DASHBOARD_CARDS: cards };
            await env.SUBSCRIPTIONS_KV.put('config', JSON.stringify(newConfig));
    
            return new Response(
              JSON.stringify({ success: true, data: cards }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          } catch (error) {
            console.error('保存仪表盘卡片偏好失败:', error);
            return new Response(
              JSON.stringify({ success: false, message: '保存卡片偏好失败: ' + error.message }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
    
    if (path === '/dashboard/stats' && method === 'GET') {
      try {
        const subscriptions = await getAllSubscriptions(env);
        const timezone = config?.TIMEZONE || 'UTC';
        const exchangeRates = parseExchangeRates(config.EXCHANGE_RATES);
        const period = url.searchParams.get('period') === '12m' ? '12m' : 'year';
        const daysParam = Number(url.searchParams.get('days'));
        const upcomingDays = [3, 7, 30, 60, 180].includes(daysParam) ? daysParam : 7;

        const monthlyExpense = calculateMonthlyExpense(subscriptions, timezone, exchangeRates);
        const yearlyExpense = calculateYearlyExpense(subscriptions, timezone, exchangeRates);
        const recentPayments = getRecentPayments(subscriptions, timezone, exchangeRates);
        const upcomingRenewals = getUpcomingRenewals(subscriptions, timezone, exchangeRates, upcomingDays);
        const expenseByType = getExpenseByType(subscriptions, timezone, exchangeRates, period);
        const expenseByCategory = getExpenseByCategory(subscriptions, timezone, exchangeRates, period);
        const monthlyTrend = getMonthlyExpenseTrend(subscriptions, timezone, exchangeRates);
        const currencyDistribution = getCurrencyDistribution(subscriptions, exchangeRates);
        const monthlyBreakdown = getMonthlyBreakdown(subscriptions, timezone, exchangeRates);
        const nextExpiry = getNextExpiry(subscriptions, timezone);

        const activeSubscriptions = subscriptions.filter(s => s.isActive);
        const now = getCurrentTimeInTimezone(timezone);
        const sevenDaysLater = new Date(now.getTime() + 7 * MS_PER_DAY);
        const expiringSoon = activeSubscriptions.filter(s => {
          const expiryDate = new Date(s.expiryDate);
          return expiryDate >= now && expiryDate <= sevenDaysLater;
        }).length;

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              monthlyExpense,
              yearlyExpense,
              activeSubscriptions: {
                active: activeSubscriptions.length,
                total: subscriptions.length,
                expiringSoon
              },
              recentPayments,
              upcomingRenewals,
              expenseByType,
              expenseByCategory,
              monthlyTrend,
              currencyDistribution,
              monthlyBreakdown,
              nextExpiry
            }
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('获取仪表盘统计失败:', error);
        return new Response(
          JSON.stringify({ success: false, message: '获取统计数据失败: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (path === '/test-notification' && method === 'POST') {
      try {
        const body = await request.json();
        let success = false;
        let message = '';

        if (body.type === 'telegram') {
          const testConfig = {
            ...config,
            TG_BOT_TOKEN: body.TG_BOT_TOKEN,
            TG_CHAT_ID: body.TG_CHAT_ID
          };

          const content = '*测试通知*\n\n这是一条测试通知，用于验证Telegram通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');
          success = await sendTelegramNotification(content, testConfig);
          message = success ? 'Telegram通知发送成功' : 'Telegram通知发送失败，请检查配置';
        } else if (body.type === 'notifyx') {
          const testConfig = {
            ...config,
            NOTIFYX_API_KEY: body.NOTIFYX_API_KEY
          };

          const title = '测试通知';
          const content = '## 这是一条测试通知\n\n用于验证NotifyX通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');
          const description = '测试NotifyX通知功能';

          success = await sendNotifyXNotification(title, content, description, testConfig);
          message = success ? 'NotifyX通知发送成功' : 'NotifyX通知发送失败，请检查配置';
        } else if (body.type === 'webhook') {
          const testConfig = {
            ...config,
            WEBHOOK_URL: body.WEBHOOK_URL,
            WEBHOOK_METHOD: body.WEBHOOK_METHOD,
            WEBHOOK_HEADERS: body.WEBHOOK_HEADERS,
            WEBHOOK_TEMPLATE: body.WEBHOOK_TEMPLATE
          };

          const title = '测试通知';
          const content = '这是一条测试通知，用于验证Webhook 通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');

          success = await sendWebhookNotification(title, content, testConfig);
          message = success ? 'Webhook 通知发送成功' : 'Webhook 通知发送失败，请检查配置';
         } else if (body.type === 'wechatbot') {
          const testConfig = {
            ...config,
            WECHATBOT_WEBHOOK: body.WECHATBOT_WEBHOOK,
            WECHATBOT_MSG_TYPE: body.WECHATBOT_MSG_TYPE,
            WECHATBOT_AT_MOBILES: body.WECHATBOT_AT_MOBILES,
            WECHATBOT_AT_ALL: body.WECHATBOT_AT_ALL
          };

          const title = '测试通知';
          const content = '这是一条测试通知，用于验证企业微信机器人功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');

          success = await sendWechatBotNotification(title, content, testConfig);
          message = success ? '企业微信机器人通知发送成功' : '企业微信机器人通知发送失败，请检查配置';
        } else if (body.type === 'email') {
          const testConfig = {
            ...config,
            RESEND_API_KEY: body.RESEND_API_KEY,
            EMAIL_FROM: body.EMAIL_FROM,
            EMAIL_FROM_NAME: body.EMAIL_FROM_NAME,
            EMAIL_TO: body.EMAIL_TO
          };

          const title = '测试通知';
          const content = '这是一条测试通知，用于验证邮件通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');

          success = await sendEmailNotification(title, content, testConfig);
          message = success ? '邮件通知发送成功' : '邮件通知发送失败，请检查配置';
        } else if (body.type === 'bark') {
          const testConfig = {
            ...config,
            BARK_SERVER: body.BARK_SERVER,
            BARK_DEVICE_KEY: body.BARK_DEVICE_KEY,
            BARK_IS_ARCHIVE: body.BARK_IS_ARCHIVE
          };

          const title = '测试通知';
          const content = '这是一条测试通知，用于验证Bark通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');

          success = await sendBarkNotification(title, content, testConfig);
          message = success ? 'Bark通知发送成功' : 'Bark通知发送失败，请检查配置';
        } else if (body.type === 'dingtalk') {
          const testConfig = {
            ...config,
            DINGTALK_WEBHOOK: body.DINGTALK_WEBHOOK,
            DINGTALK_SECRET: body.DINGTALK_SECRET
          };
          const title = '测试通知';
          const content = '这是一条测试通知，用于验证钉钉机器人通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');
          success = await sendDingtalkNotification(title, content, testConfig);
          message = success ? '钉钉机器人通知发送成功' : '钉钉机器人通知发送失败，请检查配置';
        } else if (body.type === 'feishu') {
          const testConfig = {
            ...config,
            FEISHU_WEBHOOK: body.FEISHU_WEBHOOK,
            FEISHU_SECRET: body.FEISHU_SECRET
          };
          const title = '测试通知';
          const content = '这是一条测试通知，用于验证飞书机器人通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');
          success = await sendFeishuNotification(title, content, testConfig);
          message = success ? '飞书机器人通知发送成功' : '飞书机器人通知发送失败，请检查配置';
        } else if (body.type === 'serverchan') {
          const testConfig = { ...config, SERVERCHAN_SENDKEY: body.SERVERCHAN_SENDKEY };
          const title = '测试通知';
          const content = '这是一条测试通知，用于验证 Server酱 通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');
          success = await sendServerchanNotification(title, content, testConfig);
          message = success ? 'Server酱通知发送成功' : 'Server酱通知发送失败，请检查配置';
        } else if (body.type === 'pushplus') {
          const testConfig = { ...config, PUSHPLUS_TOKEN: body.PUSHPLUS_TOKEN };
          const title = '测试通知';
          const content = '这是一条测试通知，用于验证 PushPlus 通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');
          success = await sendPushplusNotification(title, content, testConfig);
          message = success ? 'PushPlus通知发送成功' : 'PushPlus通知发送失败，请检查配置';
        } else if (body.type === 'wxpusher') {
          const testConfig = {
            ...config,
            WXPUSHER_APP_TOKEN: body.WXPUSHER_APP_TOKEN,
            WXPUSHER_UID: body.WXPUSHER_UID
          };
          const title = '测试通知';
          const content = '这是一条测试通知，用于验证 WxPusher 通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');
          success = await sendWxpusherNotification(title, content, testConfig);
          message = success ? 'WxPusher通知发送成功' : 'WxPusher通知发送失败，请检查配置';
        } else if (body.type === 'discord') {
          const testConfig = { ...config, DISCORD_WEBHOOK: body.DISCORD_WEBHOOK };
          const title = '测试通知';
          const content = '这是一条测试通知，用于验证 Discord 通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');
          success = await sendDiscordNotification(title, content, testConfig);
          message = success ? 'Discord通知发送成功' : 'Discord通知发送失败，请检查配置';
        } else if (body.type === 'slack') {
          const testConfig = { ...config, SLACK_WEBHOOK: body.SLACK_WEBHOOK };
          const title = '测试通知';
          const content = '这是一条测试通知，用于验证 Slack 通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');
          success = await sendSlackNotification(title, content, testConfig);
          message = success ? 'Slack通知发送成功' : 'Slack通知发送失败，请检查配置';
        } else if (body.type === 'ntfy') {
          const testConfig = {
            ...config,
            NTFY_SERVER: body.NTFY_SERVER,
            NTFY_TOPIC: body.NTFY_TOPIC,
            NTFY_TOKEN: body.NTFY_TOKEN
          };
          const title = '测试通知';
          const content = '这是一条测试通知，用于验证 ntfy 通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');
          success = await sendNtfyNotification(title, content, testConfig);
          message = success ? 'ntfy通知发送成功' : 'ntfy通知发送失败，请检查配置';
        } else if (body.type === 'pushover') {
          const testConfig = {
            ...config,
            PUSHOVER_TOKEN: body.PUSHOVER_TOKEN,
            PUSHOVER_USER: body.PUSHOVER_USER
          };
          const title = '测试通知';
          const content = '这是一条测试通知，用于验证 Pushover 通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');
          success = await sendPushoverNotification(title, content, testConfig);
          message = success ? 'Pushover通知发送成功' : 'Pushover通知发送失败，请检查配置';
        } else if (body.type === 'pushdeer') {
          const testConfig = {
            ...config,
            PUSHDEER_SERVER: body.PUSHDEER_SERVER,
            PUSHDEER_KEY: body.PUSHDEER_KEY
          };
          const title = '测试通知';
          const content = '这是一条测试通知，用于验证 PushDeer 通知功能是否正常工作。\n\n发送时间: ' + formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');
          success = await sendPushdeerNotification(title, content, testConfig);
          message = success ? 'PushDeer通知发送成功' : 'PushDeer通知发送失败，请检查配置';
        }

        return new Response(
          JSON.stringify({ success, message }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('测试通知失败:', error);
        return new Response(
          JSON.stringify({ success: false, message: '测试通知失败: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 数据导出：下载所有订阅与（脱敏后的）配置，用于备份
    if (path === '/export' && method === 'GET') {
      try {
        const subscriptions = await getAllSubscriptions(env);
        const { JWT_SECRET, ADMIN_PASSWORD, ...safeConfig } = config;
        const exportData = {
          version: 2,
          exportedAt: new Date().toISOString(),
          subscriptions,
          config: safeConfig
        };

        return new Response(JSON.stringify(exportData, null, 2), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': 'attachment; filename="substracker-backup-' + new Date().toISOString().slice(0, 10) + '.json"'
          }
        });
      } catch (error) {
        console.error('导出数据失败:', error);
        return new Response(
          JSON.stringify({ success: false, message: '导出数据失败: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 数据导入：支持 merge（默认，保留现有数据）与 replace（清空后导入）两种模式
    if (path === '/import' && method === 'POST') {
      try {
        const body = await request.json();
        const mode = body.mode === 'replace' ? 'replace' : 'merge';
        const importedSubscriptions = Array.isArray(body.subscriptions) ? body.subscriptions : [];

        if (importedSubscriptions.length === 0) {
          return new Response(
            JSON.stringify({ success: false, message: '导入文件中未找到订阅数据' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const { importedCount, skippedCount } = await applyImportedSubscriptions(env, importedSubscriptions, mode);

        return new Response(
          JSON.stringify({
            success: true,
            message: `导入完成：成功 ${importedCount} 条，跳过 ${skippedCount} 条（模式：${mode === 'replace' ? '替换' : '合并'}）`
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('导入数据失败:', error);
        return new Response(
          JSON.stringify({ success: false, message: '导入数据失败: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // WebDAV 云备份：将当前订阅与脱敏配置上传到远端 WebDAV 目录
    if (path === '/webdav/backup' && method === 'POST') {
      try {
        const webdav = getWebdavConfig(config);
        if (!webdav) {
          return new Response(
            JSON.stringify({ success: false, message: '请先填写 WebDAV 地址并保存配置' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const subscriptions = await getAllSubscriptions(env);
        const { JWT_SECRET, ADMIN_PASSWORD, ...safeConfig } = config;
        const backupData = JSON.stringify({
          version: 2,
          exportedAt: new Date().toISOString(),
          subscriptions,
          config: safeConfig
        });

        await ensureWebdavDirectory(webdav);

        const filename = 'substracker-backup-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.json';
        const response = await fetch(webdav.dirUrl + '/' + filename, {
          method: 'PUT',
          headers: {
            Authorization: webdav.authHeader,
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: backupData
        });

        if (!response.ok) {
          throw new Error('WebDAV 服务器返回状态码 ' + response.status + '，请检查地址与账号');
        }

        return new Response(
          JSON.stringify({ success: true, message: '备份成功：' + filename, file: filename }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('WebDAV 备份失败:', error);
        return new Response(
          JSON.stringify({ success: false, message: 'WebDAV 备份失败: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // WebDAV 云备份：列出远端备份文件
    if (path === '/webdav/list' && method === 'GET') {
      try {
        const webdav = getWebdavConfig(config);
        if (!webdav) {
          return new Response(
            JSON.stringify({ success: false, message: '请先填写 WebDAV 地址并保存配置' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const response = await fetch(webdav.dirUrl + '/', {
          method: 'PROPFIND',
          headers: {
            Authorization: webdav.authHeader,
            Depth: '1'
          }
        });

        if (!response.ok) {
          throw new Error('WebDAV 服务器返回状态码 ' + response.status + '，请检查地址与账号');
        }

        const xml = await response.text();
        const files = parseWebdavPropfindXml(xml)
          .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

        return new Response(
          JSON.stringify({ success: true, data: files }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('获取 WebDAV 备份列表失败:', error);
        return new Response(
          JSON.stringify({ success: false, message: '获取备份列表失败: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // WebDAV 云备份：从远端备份文件恢复数据
    if (path === '/webdav/restore' && method === 'POST') {
      try {
        const webdav = getWebdavConfig(config);
        if (!webdav) {
          return new Response(
            JSON.stringify({ success: false, message: '请先填写 WebDAV 地址并保存配置' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const body = await request.json();
        const filename = (body.file || '').trim();
        if (!filename || filename.includes('..') || filename.includes('/')) {
          return new Response(
            JSON.stringify({ success: false, message: '非法的备份文件名' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const mode = body.mode === 'replace' ? 'replace' : 'merge';

        const response = await fetch(webdav.dirUrl + '/' + encodeURIComponent(filename), {
          method: 'GET',
          headers: { Authorization: webdav.authHeader }
        });
        if (!response.ok) {
          throw new Error('下载备份失败，WebDAV 服务器返回状态码 ' + response.status);
        }

        const backupData = await response.json();
        const importedSubscriptions = Array.isArray(backupData.subscriptions) ? backupData.subscriptions : [];
        if (importedSubscriptions.length === 0) {
          return new Response(
            JSON.stringify({ success: false, message: '备份文件中未找到订阅数据' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const { importedCount, skippedCount } = await applyImportedSubscriptions(env, importedSubscriptions, mode);

        return new Response(
          JSON.stringify({
            success: true,
            message: `恢复完成：成功 ${importedCount} 条，跳过 ${skippedCount} 条（模式：${mode === 'replace' ? '替换' : '合并'}）`
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('WebDAV 恢复失败:', error);
        return new Response(
          JSON.stringify({ success: false, message: 'WebDAV 恢复失败: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // WebDAV 云备份：删除远端备份文件
    if (path === '/webdav/delete' && method === 'POST') {
      try {
        const webdav = getWebdavConfig(config);
        if (!webdav) {
          return new Response(
            JSON.stringify({ success: false, message: '请先填写 WebDAV 地址并保存配置' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const body = await request.json();
        const filename = (body.file || '').trim();
        if (!filename || filename.includes('..') || filename.includes('/')) {
          return new Response(
            JSON.stringify({ success: false, message: '非法的备份文件名' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const response = await fetch(webdav.dirUrl + '/' + encodeURIComponent(filename), {
          method: 'DELETE',
          headers: { Authorization: webdav.authHeader }
        });

        // 404 视为已删除，同样返回成功
        if (!response.ok && response.status !== 404) {
          throw new Error('WebDAV 服务器返回状态码 ' + response.status);
        }

        return new Response(
          JSON.stringify({ success: true, message: '已删除备份：' + filename }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('WebDAV 删除备份失败:', error);
        return new Response(
          JSON.stringify({ success: false, message: '删除备份失败: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (path === '/subscriptions') {
      if (method === 'GET') {
        const subscriptions = await getAllSubscriptions(env);

        // 服务端搜索/分页：携带 page 或 pageSize 参数时返回分页结构，否则保持全量数组（向后兼容）
        const searchKeyword = (url.searchParams.get('search') || '').trim().toLowerCase();
        const categoryFilter = (url.searchParams.get('category') || '').trim().toLowerCase();
        const pageParam = url.searchParams.get('page');
        const pageSizeParam = url.searchParams.get('pageSize');

        let filtered = subscriptions;
        if (categoryFilter) {
          filtered = filtered.filter(sub =>
            (sub.category || '').split(CATEGORY_SEPARATOR_REGEX)
              .map(tag => tag.trim().toLowerCase())
              .includes(categoryFilter)
          );
        }
        if (searchKeyword) {
          filtered = filtered.filter(sub => {
            const haystack = [sub.name, sub.customType, sub.notes, sub.category]
              .filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(searchKeyword);
          });
        }

        if (pageParam !== null || pageSizeParam !== null) {
          const pageSize = Math.min(Math.max(parseInt(pageSizeParam || '20', 10) || 20, 1), 100);
          const total = filtered.length;
          const totalPages = Math.max(Math.ceil(total / pageSize), 1);
          const page = Math.min(Math.max(parseInt(pageParam || '1', 10) || 1, 1), totalPages);
          const items = filtered
            .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
            .slice((page - 1) * pageSize, page * pageSize);

          return new Response(
            JSON.stringify({ success: true, data: { items, total, page, pageSize, totalPages } }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(filtered),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (method === 'POST') {
        const subscription = await request.json();
        const result = await createSubscription(subscription, env);

        return new Response(
          JSON.stringify(result),
          {
            status: result.success ? 201 : 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    if (path.startsWith('/subscriptions/')) {
      const parts = path.split('/');
      const id = parts[2];

      if (parts[3] === 'toggle-status' && method === 'POST') {
        const body = await request.json();
        const result = await toggleSubscriptionStatus(id, body.isActive, env);

        return new Response(
          JSON.stringify(result),
          {
            status: result.success ? 200 : 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (parts[3] === 'test-notify' && method === 'POST') {
        const result = await testSingleSubscriptionNotification(id, env);
        return new Response(JSON.stringify(result), { status: result.success ? 200 : 500, headers: { 'Content-Type': 'application/json' } });
      }

      if (parts[3] === 'renew' && method === 'POST') {
        let options = {};
        try {
          const body = await request.json();
          options = body || {};
        } catch (e) {
          // 如果没有请求体，使用默认空对象
        }
        const result = await manualRenewSubscription(id, env, options);
        return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { 'Content-Type': 'application/json' } });
      }

      if (parts[3] === 'payments' && method === 'GET') {
        const subscription = await getSubscription(id, env);
        if (!subscription) {
          return new Response(JSON.stringify({ success: false, message: '订阅不存在' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: true, payments: subscription.paymentHistory || [] }), { headers: { 'Content-Type': 'application/json' } });
      }

      if (parts[3] === 'payments' && parts[4] && method === 'DELETE') {
        const paymentId = parts[4];
        const result = await deletePaymentRecord(id, paymentId, env);
        return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { 'Content-Type': 'application/json' } });
      }

      if (parts[3] === 'payments' && parts[4] && method === 'PUT') {
        const paymentId = parts[4];
        const paymentData = await request.json();
        const result = await updatePaymentRecord(id, paymentId, paymentData, env);
        return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { 'Content-Type': 'application/json' } });
      }

      if (method === 'GET') {
        const subscription = await getSubscription(id, env);

        return new Response(
          JSON.stringify(subscription),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (method === 'PUT') {
        const subscription = await request.json();
        const result = await updateSubscription(id, subscription, env);

        return new Response(
          JSON.stringify(result),
          {
            status: result.success ? 200 : 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (method === 'DELETE') {
        const result = await deleteSubscription(id, env);

        return new Response(
          JSON.stringify(result),
          {
            status: result.success ? 200 : 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // 处理第三方通知API
    if (path.startsWith('/notify/')) {
      const pathSegments = path.split('/');
      // 允许通过路径、Authorization 头或查询参数三种方式传入访问令牌
      const tokenFromPath = pathSegments[2] || '';
      const tokenFromHeader = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
      const tokenFromQuery = url.searchParams.get('token') || '';
      const providedToken = tokenFromPath || tokenFromHeader || tokenFromQuery;
      const expectedToken = config.THIRD_PARTY_API_TOKEN || '';

      if (!expectedToken) {
        return new Response(
          JSON.stringify({ message: '第三方 API 已禁用，请在后台配置访问令牌后使用' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!providedToken || providedToken !== expectedToken) {
        return new Response(
          JSON.stringify({ message: '访问未授权，令牌无效或缺失' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (method === 'POST') {
        try {
          const body = await request.json();
          const title = body.title || '第三方通知';
          const content = body.content || '';

          if (!content) {
            return new Response(
              JSON.stringify({ message: '缺少必填参数 content' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const config = await getConfig(env);
          const bodyTagsRaw = Array.isArray(body.tags)
            ? body.tags
            : (typeof body.tags === 'string' ? body.tags.split(/[,，\s]+/) : []);
          const bodyTags = Array.isArray(bodyTagsRaw)
            ? bodyTagsRaw.filter(tag => typeof tag === 'string' && tag.trim().length > 0).map(tag => tag.trim())
            : [];

          // 使用多渠道发送通知
          await sendNotificationToAllChannels(title, content, config, '[第三方API]', {
            metadata: { tags: bodyTags }
          });

          return new Response(
            JSON.stringify({
              message: '发送成功',
              response: {
                errcode: 0,
                errmsg: 'ok',
                msgid: 'MSGID' + Date.now()
              }
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('[第三方API] 发送通知失败:', error);
          return new Response(
            JSON.stringify({
              message: '发送失败',
              response: {
                errcode: 1,
                errmsg: error.message
              }
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ success: false, message: '未找到请求的资源' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export { api };

// 单个订阅的手动测试通知
async function testSingleSubscriptionNotification(id, env) {
  try {
    const subscription = await getSubscription(id, env);
    if (!subscription) {
      return { success: false, message: '未找到该订阅' };
    }
    const config = await getConfig(env);
    const title = `手动测试通知: ${subscription.name}`;
    // 检查是否显示农历（从配置中获取，默认不显示）
    const showLunar = config.SHOW_LUNAR === true;
    let lunarExpiryText = '';
    if (showLunar) {
      // 计算农历日期
      const expiryDateObj = new Date(subscription.expiryDate);
      const lunarExpiry = lunarCalendar.solar2lunar(expiryDateObj.getFullYear(), expiryDateObj.getMonth() + 1, expiryDateObj.getDate());
      lunarExpiryText = lunarExpiry ? ` (农历: ${lunarExpiry.fullStr})` : '';
    }
    // 格式化到期日期（使用所选时区）
    const timezone = config?.TIMEZONE || 'UTC';
    const formattedExpiryDate = formatTimeInTimezone(new Date(subscription.expiryDate), timezone, 'date');
    const currentTime = formatTimeInTimezone(new Date(), timezone, 'datetime');
    
    // 获取日历类型和自动续期状态
    const calendarType = subscription.useLunar ? '农历' : '公历';
    const autoRenewText = subscription.autoRenew ? '是' : '否';
    const amountText = subscription.amount ? `\n金额: ¥${subscription.amount.toFixed(2)}/周期` : '';
    const commonContent = `**订阅详情**
类型: ${subscription.customType || '其他'}${amountText}
日历类型: ${calendarType}
到期日期: ${formattedExpiryDate}${lunarExpiryText}
自动续期: ${autoRenewText}
备注: ${subscription.notes || '无'}
发送时间: ${currentTime}
当前时区: ${formatTimezoneDisplay(timezone)}`;
    // 使用多渠道发送
    const tags = extractTagsFromSubscriptions([subscription]);
    await sendNotificationToAllChannels(title, commonContent, config, '[手动测试]', {
      metadata: { tags }
    });
    return { success: true, message: '测试通知已发送到所有启用的渠道' };
  } catch (error) {
    console.error('[手动测试] 发送失败:', error);
    return { success: false, message: '发送时发生错误: ' + error.message };
  }
}
