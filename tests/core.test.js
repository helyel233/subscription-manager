import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lunarCalendar, lunarBiz } from '../src/lunar.js';
import { resolveReminderSetting, shouldTriggerReminder } from '../src/reminder.js';
import { getCurrentTimeInTimezone, getTimezoneDateParts, formatTimeInTimezone } from '../src/timezone.js';
import { convertToCNY, DEFAULT_EXCHANGE_RATES, getMonthlyExpenseTrend, getCurrencyDistribution, getMonthlyBreakdown, getNextExpiry, getExpenseByType } from '../src/dashboard.js';
import { buildCalendarICS } from '../src/ics.js';
import { hashPassword, verifyPassword, isPasswordHash, generateJWT, verifyJWT } from '../src/auth.js';
import { parseWebdavPropfindXml, normalizeWebdavUrl, buildWebdavDirUrl, normalizeWebdavDirName } from '../src/api.js';

// ==================== 农历转换 ====================

test('农历 solar2lunar：2024-02-10 为甲辰年正月初一', () => {
  const lunar = lunarCalendar.solar2lunar(2024, 2, 10);
  assert.equal(lunar.year, 2024);
  assert.equal(lunar.month, 1);
  assert.equal(lunar.day, 1);
});

test('农历 lunar2solar 往返转换一致', () => {
  const lunar = lunarCalendar.solar2lunar(2026, 9, 29);
  const solar = lunarBiz.lunar2solar(lunar);
  assert.deepEqual([solar.year, solar.month, solar.day], [2026, 9, 29]);
});

test('addLunarPeriod 按月加一个农历月', () => {
  const lunar = lunarCalendar.solar2lunar(2026, 9, 29);
  const next = lunarBiz.addLunarPeriod(lunar, 1, 'month');
  const solar = lunarBiz.lunar2solar(next);
  assert.equal(solar.year, 2026);
  assert.equal(solar.month, 10);
});

// ==================== 提醒策略 ====================

test('resolveReminderSetting：默认提前 7 天', () => {
  assert.deepEqual(resolveReminderSetting({}), { unit: 'day', value: 7 });
});

test('resolveReminderSetting：小时级提醒', () => {
  assert.deepEqual(resolveReminderSetting({ reminderUnit: 'hour', reminderValue: 12 }), { unit: 'hour', value: 12 });
});

test('resolveReminderSetting：非法负数回退为 0', () => {
  assert.deepEqual(resolveReminderSetting({ reminderValue: -5 }), { unit: 'day', value: 0 });
});

test('shouldTriggerReminder：天数在提前范围内触发', () => {
  assert.equal(shouldTriggerReminder({ unit: 'day', value: 7 }, 3, 72), true);
  assert.equal(shouldTriggerReminder({ unit: 'day', value: 7 }, 8, 192), false);
});

test('shouldTriggerReminder：value 为 0 仅当天触发', () => {
  assert.equal(shouldTriggerReminder({ unit: 'day', value: 0 }, 0, 0), true);
  assert.equal(shouldTriggerReminder({ unit: 'day', value: 0 }, 1, 24), false);
});

// ==================== 时区 ====================

test('getTimezoneDateParts 按目标时区拆分', () => {
  const date = new Date('2026-09-29T16:30:00Z');
  const parts = getTimezoneDateParts(date, 'Asia/Shanghai');
  assert.deepEqual(
    [parts.year, parts.month, parts.day],
    [2026, 9, 30]
  );
});

test('formatTimeInTimezone 输出包含日期', () => {
  const date = new Date('2026-09-29T08:00:00Z');
  const formatted = formatTimeInTimezone(date, 'UTC', 'date');
  assert.match(formatted, /2026/);
});

test('getCurrentTimeInTimezone 返回 Date 对象', () => {
  const now = getCurrentTimeInTimezone('Asia/Shanghai');
  assert.ok(now instanceof Date);
});

// ==================== 汇率换算 ====================

test('convertToCNY 使用传入汇率换算', () => {
  const rates = { CNY: 1, USD: 7.0 };
  assert.equal(convertToCNY(10, 'USD', rates), 70);
});

test('convertToCNY：未知币种按 1 处理，无效金额返回 0', () => {
  assert.equal(convertToCNY(5, 'XXX', { CNY: 1 }), 5);
  assert.equal(convertToCNY(0, 'USD'), 0);
  assert.equal(convertToCNY(null, 'USD'), 0);
});

test('DEFAULT_EXCHANGE_RATES 提供默认美元汇率', () => {
  assert.ok(DEFAULT_EXCHANGE_RATES.USD > 0);
});

// ==================== iCal 生成 ====================

test('buildCalendarICS：公历订阅生成 RRULE 事件', () => {
  const subs = [{
    id: 'test-1',
    name: 'Netflix; 高级版',
    expiryDate: '2026-10-15T00:00:00.000Z',
    periodValue: 1,
    periodUnit: 'month',
    amount: 50,
    currency: 'USD',
    isActive: true
  }];
  const ics = buildCalendarICS(subs, 'Asia/Shanghai');
  assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('SUMMARY:Netflix\\; 高级版 到期'));
  assert.ok(ics.includes('RRULE:FREQ=MONTHLY;INTERVAL=1'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
});

test('buildCalendarICS：停用订阅不生成事件', () => {
  const ics = buildCalendarICS([{ id: 'x', name: '停用', expiryDate: '2026-10-15T00:00:00Z', isActive: false }], 'UTC');
  assert.ok(!ics.includes('VEVENT'));
});

test('buildCalendarICS：农历订阅展开多个未来事件', () => {
  const ics = buildCalendarICS([{
    id: 'lunar-1',
    name: '农历订阅',
    expiryDate: '2026-10-20T00:00:00Z',
    useLunar: true,
    periodValue: 1,
    periodUnit: 'month',
    isActive: true
  }], 'UTC');
  const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
  assert.ok(eventCount > 1, `期望展开多个事件，实际 ${eventCount} 个`);
});

// ==================== 密码哈希与 JWT ====================

test('hashPassword 生成 pbkdf2 格式哈希并可校验', async () => {
  const hash = await hashPassword('s3cret-密码');
  assert.ok(isPasswordHash(hash));
  assert.equal(await verifyPassword('s3cret-密码', hash), true);
  assert.equal(await verifyPassword('wrong', hash), false);
});

test('verifyPassword 兼容旧明文密码', async () => {
  assert.equal(await verifyPassword('password', 'password'), true);
  assert.equal(await verifyPassword('wrong', 'password'), false);
});

test('generateJWT/verifyJWT：有效令牌可通过验证', async () => {
  const token = await generateJWT('admin', 'test-secret');
  const payload = await verifyJWT(token, 'test-secret');
  assert.equal(payload.username, 'admin');
  assert.ok(payload.exp > payload.iat);
});

test('verifyJWT：过期令牌被拒绝', async () => {
  const token = await generateJWT('admin', 'test-secret');
  // 手工构造已过期的令牌
  const [headerBase64, , signature] = token.split('.');
  const payloadBase64 = btoa(JSON.stringify({ username: 'admin', iat: 1000, exp: 2000 }));
  const expiredToken = `${headerBase64}.${payloadBase64}.${signature}`;
  const payload = await verifyJWT(expiredToken, 'test-secret');
  assert.equal(payload, null);
});

test('verifyJWT：签名错误被拒绝', async () => {
  const token = await generateJWT('admin', 'test-secret');
  const tampered = token.slice(0, -4) + '0000';
  assert.equal(await verifyJWT(tampered, 'test-secret'), null);
});

// ==================== WebDAV 云备份 ====================

test('normalizeWebdavUrl：去除结尾斜杠', () => {
  assert.equal(normalizeWebdavUrl('https://dav.example.com/dav/backup/'), 'https://dav.example.com/dav/backup');
  assert.equal(normalizeWebdavUrl('https://dav.example.com/dav/backup///'), 'https://dav.example.com/dav/backup');
  assert.equal(normalizeWebdavUrl('  '), '');
});

test('normalizeWebdavDirName：规范化子目录名，非法值回退默认', () => {
  assert.equal(normalizeWebdavDirName('MyBackups'), 'MyBackups');
  assert.equal(normalizeWebdavDirName('/my-dir/'), 'my-dir');
  assert.equal(normalizeWebdavDirName('  '), 'SubsTracker');
  assert.equal(normalizeWebdavDirName(''), 'SubsTracker');
  assert.equal(normalizeWebdavDirName(undefined), 'SubsTracker');
  assert.equal(normalizeWebdavDirName('../etc'), 'SubsTracker');
});

test('buildWebdavDirUrl：拼接专用备份子目录', () => {
  assert.equal(buildWebdavDirUrl('https://dav.example.com/dav/backup/', 'MyBackups'), 'https://dav.example.com/dav/backup/MyBackups');
  assert.equal(buildWebdavDirUrl('https://dav.example.com/dav/', ''), 'https://dav.example.com/dav/SubsTracker');
  assert.equal(buildWebdavDirUrl('https://dav.example.com/dav/backup/'), 'https://dav.example.com/dav/backup/SubsTracker');
});

test('parseWebdavPropfindXml：仅提取 JSON 文件，忽略目录与非 JSON', () => {
  const xml = '<?xml version="1.0"?>' +
    '<D:multistatus>' +
    '<D:response><D:href>/dav/backup/</D:href><D:getlastmodified>Tue, 29 Sep 2026 10:00:00 GMT</D:getlastmodified></D:response>' +
    '<D:response><D:href>/dav/backup/substracker-backup-2026-09-29T10-00-00.json</D:href>' +
    '<D:getlastmodified>Tue, 29 Sep 2026 10:00:00 GMT</D:getlastmodified><D:getcontentlength>1234</D:getcontentlength></D:response>' +
    '<D:response><D:href>/dav/backup/readme.txt</D:href><D:getcontentlength>10</D:getcontentlength></D:response>' +
    '</D:multistatus>';
  const files = parseWebdavPropfindXml(xml);
  assert.equal(files.length, 1);
  assert.equal(files[0].name, 'substracker-backup-2026-09-29T10-00-00.json');
  assert.equal(files[0].size, 1234);
  assert.equal(files[0].lastModified, 'Tue, 29 Sep 2026 10:00:00 GMT');
});

// ==================== 仪表盘统计扩展 ====================

const nowUTC = () => new Date();

function makeSub(overrides = {}) {
  return {
    id: 'sub-' + Math.random().toString(36).slice(2),
    name: '测试订阅',
    amount: 10,
    currency: 'CNY',
    periodValue: 1,
    periodUnit: 'month',
    isActive: true,
    expiryDate: new Date(nowUTC().getTime() + 3 * 24 * 3600 * 1000).toISOString(),
    paymentHistory: [],
    ...overrides
  };
}

test('getMonthlyExpenseTrend：返回近12个月桶且当月含支付金额', () => {
  const subs = [makeSub({
    paymentHistory: [{ date: new Date().toISOString(), amount: 25 }]
  })];
  const trend = getMonthlyExpenseTrend(subs, 'UTC');
  assert.equal(trend.length, 12);
  const parts = getTimezoneDateParts(nowUTC(), 'UTC');
  assert.equal(trend[11].month, `${parts.year}-${String(parts.month).padStart(2, '0')}`);
  assert.equal(trend[11].amount, 25);
  assert.equal(trend[10].amount, 0);
});

test('getCurrencyDistribution：活跃订阅按币种折算月均，排除停用', () => {
  const subs = [
    makeSub({ amount: 10, currency: 'USD', periodUnit: 'month', periodValue: 1 }),
    makeSub({ amount: 120, currency: 'CNY', periodUnit: 'year', periodValue: 1 }),
    makeSub({ amount: 999, currency: 'CNY', isActive: false })
  ];
  const dist = getCurrencyDistribution(subs);
  const usd = dist.find(d => d.currency === 'USD');
  const cny = dist.find(d => d.currency === 'CNY');
  assert.equal(usd.amount, 10);
  assert.equal(cny.amount, 10);
  assert.equal(dist.length, 2);
});

test('getMonthlyBreakdown：拆分本月已付与待付', () => {
  const now = nowUTC();
  // 本月内未来到期：当月 23:59（任意时刻都落在本月且 >= now）
  const pendingDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0);
  const subs = [
    makeSub({ paymentHistory: [{ date: new Date().toISOString(), amount: 20 }] }),
    makeSub({ amount: 15, expiryDate: pendingDate.toISOString() }),
    makeSub({ amount: 99, expiryDate: new Date(now.getFullYear(), now.getMonth() + 2, 1).toISOString() })
  ];
  const breakdown = getMonthlyBreakdown(subs, 'UTC');
  assert.equal(breakdown.paid, 20);
  assert.equal(breakdown.pending, 15);
});

test('getNextExpiry：返回最近到期的活跃订阅，排除已过期', () => {
  const now = nowUTC();
  const subs = [
    makeSub({ name: '昨天', expiryDate: new Date(now.getTime() - 24 * 3600 * 1000).toISOString() }),
    makeSub({ name: '后天', expiryDate: new Date(now.getTime() + 2 * 24 * 3600 * 1000).toISOString() }),
    makeSub({ name: '下周', expiryDate: new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString() })
  ];
  const next = getNextExpiry(subs, 'UTC');
  assert.equal(next.name, '后天');
  assert.ok(next.daysRemaining >= 1 && next.daysRemaining <= 3);
});

test('getNextExpiry：无有效到期日返回 null', () => {
  assert.equal(getNextExpiry([makeSub({ expiryDate: '2020-01-01T00:00:00Z' })], 'UTC'), null);
  assert.equal(getNextExpiry([], 'UTC'), null);
});

test('getExpenseByType：period=year 与 12m 均计入当月支付，忽略过期支付', () => {
  const thirteenMonthsAgo = new Date();
  thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);
  const subs = [makeSub({
    customType: '流媒体',
    paymentHistory: [
      { date: new Date().toISOString(), amount: 30 },
      { date: thirteenMonthsAgo.toISOString(), amount: 999 }
    ]
  })];
  const byYear = getExpenseByType(subs, 'UTC', undefined, 'year');
  const by12m = getExpenseByType(subs, 'UTC', undefined, '12m');
  assert.equal(byYear.length, 1);
  assert.equal(byYear[0].type, '流媒体');
  assert.equal(byYear[0].amount, 30);
  assert.equal(by12m.length, 1);
  assert.equal(by12m[0].amount, 30);
});
