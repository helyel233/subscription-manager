import { admin } from './src/admin.js';
import { api } from './src/api.js';
import { loginPage } from './src/pages.js';
import { getConfig } from './src/auth.js';
import { getAllSubscriptions } from './src/store.js';
import { buildCalendarICS } from './src/ics.js';
import { getCurrentTimeInTimezone } from './src/timezone.js';
import { checkExpiringSubscriptions } from './src/notify.js';

// iCal 日历订阅接口：通过第三方 API 令牌鉴权，供系统日历订阅
async function handleCalendarRequest(request, env) {
  const url = new URL(request.url);
  const tokenFromHeader = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const providedToken = url.searchParams.get('token') || tokenFromHeader;
  const config = await getConfig(env);
  const expectedToken = config.THIRD_PARTY_API_TOKEN || '';

  if (!expectedToken) {
    return new Response('iCal 日历订阅未启用，请在系统配置中设置第三方 API 访问令牌', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  if (!providedToken || providedToken !== expectedToken) {
    return new Response('访问未授权，令牌无效或缺失', {
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  const subscriptions = await getAllSubscriptions(env);
  const timezone = config?.TIMEZONE || 'UTC';
  const icsContent = buildCalendarICS(subscriptions, timezone);

  return new Response(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="substracker.ics"'
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/calendar') {
      return handleCalendarRequest(request, env);
    }

    if (url.pathname.startsWith('/api')) {
      return api.handleRequest(request, env, ctx);
    } else if (url.pathname.startsWith('/admin')) {
      return admin.handleRequest(request, env, ctx);
    }

    return new Response(loginPage, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  },

  async scheduled(event, env, ctx) {
    const config = await getConfig(env);
    const timezone = config?.TIMEZONE || 'UTC';
    const currentTime = getCurrentTimeInTimezone(timezone);
    console.log('[Workers] 定时任务触发 UTC:', new Date().toISOString(), timezone + ':', currentTime.toLocaleString('zh-CN', {timeZone: timezone}));
    await checkExpiringSubscriptions(env);
  }
};
