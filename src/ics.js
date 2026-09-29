import { lunarCalendar, lunarBiz } from './lunar.js';
import { getTimezoneDateParts } from './timezone.js';

// ==================== iCal 日历生成 ====================

// 农历订阅展开的未来周期数量（日历中无法用 RRULE 表达农历，故直接展开）
const LUNAR_EXPAND_COUNT = 24;

function icsEscape(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// 格式化为 ICS 日期（UTC 时间，格式 YYYYMMDDTHHMMSSZ）
function formatICSDateTime(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// 按指定时区取日期的年月日，格式化为全天日期 YYYYMMDD
function formatICSDateOnly(date, timezone) {
  const parts = getTimezoneDateParts(date, timezone);
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}${month}${day}`;
}

// 公历订阅的重复规则
function buildRRule(subscription) {
  if (!subscription.periodValue || !subscription.periodUnit) {
    return '';
  }
  const freqMap = { day: 'DAILY', month: 'MONTHLY', year: 'YEARLY' };
  const freq = freqMap[subscription.periodUnit];
  if (!freq) {
    return '';
  }
  return `RRULE:FREQ=${freq};INTERVAL=${subscription.periodValue}`;
}

// 展开农历订阅的未来若干个到期日（公历 Date 数组）
function expandLunarOccurrences(subscription, timezone) {
  const expiryDate = new Date(subscription.expiryDate);
  const occurrences = [];

  if (expiryDate.getTime() >= Date.now()) {
    occurrences.push(new Date(expiryDate));
  }

  let lunar = lunarCalendar.solar2lunar(
    expiryDate.getFullYear(),
    expiryDate.getMonth() + 1,
    expiryDate.getDate()
  );
  if (!lunar) {
    return occurrences.length > 0 ? occurrences : [expiryDate];
  }

  let nextLunar = lunar;
  for (let i = 0; i < LUNAR_EXPAND_COUNT; i++) {
    nextLunar = lunarBiz.addLunarPeriod(nextLunar, subscription.periodValue || 1, subscription.periodUnit || 'month');
    const solar = lunarBiz.lunar2solar(nextLunar);
    const nextDate = new Date(solar.year, solar.month - 1, solar.day);
    if (nextDate.getTime() >= Date.now()) {
      occurrences.push(nextDate);
    }
  }

  return occurrences.length > 0 ? occurrences : [expiryDate];
}

// 生成单个 VEVENT 块
function buildVEvent(subscription, occurrence, timezone) {
  const dateStart = formatICSDateOnly(occurrence, timezone);
  // DTEND 为次日（全天事件的排他结束日期）
  const endDate = new Date(occurrence.getTime() + 24 * 60 * 60 * 1000);
  const dateEnd = formatICSDateOnly(endDate, timezone);

  const lines = [
    'BEGIN:VEVENT',
    `UID:${subscription.id}-${dateStart}@substracker`,
    `DTSTAMP:${formatICSDateTime(new Date())}`,
    `DTSTART;VALUE=DATE:${dateStart}`,
    `DTEND;VALUE=DATE:${dateEnd}`,
    `SUMMARY:${icsEscape(subscription.name + ' 到期')}`
  ];

  const rrule = buildRRule(subscription);
  if (rrule) {
    lines.push(rrule);
  }

  const descriptionParts = [
    subscription.customType ? '类型: ' + subscription.customType : '',
    subscription.amount ? '金额: ' + subscription.amount + ' ' + (subscription.currency || 'CNY') : '',
    subscription.notes ? '备注: ' + subscription.notes : ''
  ].filter(Boolean);

  if (descriptionParts.length > 0) {
    lines.push(`DESCRIPTION:${icsEscape(descriptionParts.join('\n'))}`);
  }

  lines.push('END:VEVENT');
  return lines;
}

// 生成完整的 iCal 日历内容
export function buildCalendarICS(subscriptions, timezone = 'UTC') {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SubsTracker//Subscription Manager//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape('订阅到期提醒')}`,
    `X-WR-TIMEZONE:${icsEscape(timezone)}`
  ];

  (subscriptions || []).forEach(subscription => {
    if (subscription.isActive === false) {
      return;
    }

    try {
      if (subscription.useLunar) {
        expandLunarOccurrences(subscription, timezone).forEach(occurrence => {
          lines.push(...buildVEvent(subscription, occurrence, timezone));
        });
      } else {
        lines.push(...buildVEvent(subscription, new Date(subscription.expiryDate), timezone));
      }
    } catch (error) {
      console.error('[iCal] 生成订阅事件失败:', subscription.name, error);
    }
  });

  lines.push('END:VCALENDAR');
  // ICS 规范要求每行以 CRLF 结尾
  return lines.join('\r\n') + '\r\n';
}
