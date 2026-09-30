import { getCurrentTimeInTimezone, getTimezoneDateParts, MS_PER_DAY } from './timezone.js';

// ==================== 仪表盘统计函数 ====================

// 汇率配置 (以 CNY 为基准)
// 您可以根据需要修改此处的汇率
const DEFAULT_EXCHANGE_RATES = {
  'CNY': 1,
  'USD': 6.98,
  'HKD': 0.90,
  'TWD': 0.22,
  'JPY': 0.044,
  'EUR': 8.16,
  'GBP': 9.40,
  'KRW': 0.0048
};

// 辅助函数：将金额转换为基准货币 (CNY)
function convertToCNY(amount, currency, rates = DEFAULT_EXCHANGE_RATES) {
  if (!amount || amount <= 0) return 0;
  // 如果没有币种信息，默认视为 CNY
  const code = currency || 'CNY';
  const rate = (rates && rates[code]) || 1;
  return amount * rate;
}

function calculateMonthlyExpense(subscriptions, timezone, rates = DEFAULT_EXCHANGE_RATES) {
  const now = getCurrentTimeInTimezone(timezone);
  const parts = getTimezoneDateParts(now, timezone);
  const currentYear = parts.year;
  const currentMonth = parts.month;

  let amount = 0;

  // 遍历所有订阅的支付历史
  subscriptions.forEach(sub => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach(payment => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      const paymentParts = getTimezoneDateParts(paymentDate, timezone);
      if (paymentParts.year === currentYear && paymentParts.month === currentMonth) {
        // 【核心修改】使用 convertToCNY 进行汇率转换
        amount += convertToCNY(payment.amount, sub.currency, rates);
      }
    });
  });

  // 计算上月数据用于趋势对比
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  let lastMonthAmount = 0;
  subscriptions.forEach(sub => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach(payment => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      const paymentParts = getTimezoneDateParts(paymentDate, timezone);
      if (paymentParts.year === lastMonthYear && paymentParts.month === lastMonth) {
        // 【核心修改】使用 convertToCNY 进行汇率转换
        lastMonthAmount += convertToCNY(payment.amount, sub.currency, rates);
      }
    });
  });

  let trend = 0;
  let trendDirection = 'flat';
  if (lastMonthAmount > 0) {
    trend = Math.round(((amount - lastMonthAmount) / lastMonthAmount) * 100);
    if (trend > 0) trendDirection = 'up';
    else if (trend < 0) trendDirection = 'down';
  } else if (amount > 0) {
    // 上月无支出，本月有支出，视为增长
    trend = 100;
    trendDirection = 'up';
  }

  return { amount, trend: Math.abs(trend), trendDirection };
}

function calculateYearlyExpense(subscriptions, timezone, rates = DEFAULT_EXCHANGE_RATES) {
  const now = getCurrentTimeInTimezone(timezone);
  const parts = getTimezoneDateParts(now, timezone);
  const currentYear = parts.year;

  let amount = 0;

  // 遍历所有订阅的支付历史
  subscriptions.forEach(sub => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach(payment => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      const paymentParts = getTimezoneDateParts(paymentDate, timezone);
      if (paymentParts.year === currentYear) {
        // 【核心修改】使用 convertToCNY 进行汇率转换
        amount += convertToCNY(payment.amount, sub.currency, rates);
      }
    });
  });

  // 简单的月均计算：总额 / 当前月份（或者12，取决于您的统计逻辑，此处保持原逻辑）
  const monthlyAverage = amount / parts.month; 
  return { amount, monthlyAverage };
}

function getRecentPayments(subscriptions, timezone, rates = DEFAULT_EXCHANGE_RATES) {
  const now = getCurrentTimeInTimezone(timezone);
  const sevenDaysAgo = new Date(now.getTime() - 7 * MS_PER_DAY);

  const recentPayments = [];

  // 遍历所有订阅的支付历史
  subscriptions.forEach(sub => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach(payment => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      if (paymentDate >= sevenDaysAgo && paymentDate <= now) {
        recentPayments.push({
          name: sub.name,
          amount: payment.amount,
          currency: sub.currency || 'CNY', // 【核心修改】传递币种给前端显示
          customType: sub.customType,
          paymentDate: payment.date,
          note: payment.note
        });
      }
    });
  });

  return recentPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
}

function getUpcomingRenewals(subscriptions, timezone, rates = DEFAULT_EXCHANGE_RATES) {
  const now = getCurrentTimeInTimezone(timezone);
  const sevenDaysLater = new Date(now.getTime() + 7 * MS_PER_DAY);

  return subscriptions
    .filter(sub => {
      if (!sub.isActive) return false;
      const renewalDate = new Date(sub.expiryDate);
      return renewalDate >= now && renewalDate <= sevenDaysLater;
    })
    .map(sub => {
      const renewalDate = new Date(sub.expiryDate);
      const daysUntilRenewal = Math.ceil((renewalDate - now) / MS_PER_DAY);
      return {
        name: sub.name,
        amount: sub.amount || 0,
        currency: sub.currency || 'CNY', // 【核心修改】传递币种给前端显示
        customType: sub.customType,
        renewalDate: sub.expiryDate,
        daysUntilRenewal
      };
    })
    .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
}

function getExpenseByType(subscriptions, timezone, rates = DEFAULT_EXCHANGE_RATES, period = 'year') {
  const now = getCurrentTimeInTimezone(timezone);
  const parts = getTimezoneDateParts(now, timezone);
  const currentYear = parts.year;
  const rangeStart = new Date(now);
  rangeStart.setMonth(rangeStart.getMonth() - 12);

  // period: 'year' 本年（日历年）；'12m' 近12个月
  const inPeriod = (paymentDate) => {
    if (period === '12m') {
      return paymentDate >= rangeStart && paymentDate <= now;
    }
    const paymentParts = getTimezoneDateParts(paymentDate, timezone);
    return paymentParts.year === currentYear;
  };

  const typeMap = {};
  let total = 0;

  // 遍历所有订阅的支付历史
  subscriptions.forEach(sub => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach(payment => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      if (!inPeriod(paymentDate)) return;
      const type = sub.customType || '未分类';
      // 【核心修改】先转换为 CNY 再统计
      const amountCNY = convertToCNY(payment.amount, sub.currency, rates);

      typeMap[type] = (typeMap[type] || 0) + amountCNY;
      total += amountCNY;
    });
  });

  return Object.entries(typeMap)
    .map(([type, amount]) => ({
      type,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);
}

function getExpenseByCategory(subscriptions, timezone, rates = DEFAULT_EXCHANGE_RATES, period = 'year') {
  const now = getCurrentTimeInTimezone(timezone);
  const parts = getTimezoneDateParts(now, timezone);
  const currentYear = parts.year;
  const rangeStart = new Date(now);
  rangeStart.setMonth(rangeStart.getMonth() - 12);

  // period: 'year' 本年（日历年）；'12m' 近12个月
  const inPeriod = (paymentDate) => {
    if (period === '12m') {
      return paymentDate >= rangeStart && paymentDate <= now;
    }
    const paymentParts = getTimezoneDateParts(paymentDate, timezone);
    return paymentParts.year === currentYear;
  };

  const categoryMap = {};
  let total = 0;

  // 遍历所有订阅的支付历史
  subscriptions.forEach(sub => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach(payment => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      if (!inPeriod(paymentDate)) return;
      const categories = sub.category ? sub.category.split(CATEGORY_SEPARATOR_REGEX).filter(c => c.trim()) : ['未分类'];

      // 先转换为 CNY 再分配给各个分类
      const amountCNY = convertToCNY(payment.amount, sub.currency, rates);

      categories.forEach(category => {
        const cat = category.trim() || '未分类';
        categoryMap[cat] = (categoryMap[cat] || 0) + amountCNY / categories.length;
      });
      total += amountCNY;
    });
  });

  return Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);
}

// 近 N 个月支出趋势（含当月），按支付历史按月汇总（折合 CNY）
function getMonthlyExpenseTrend(subscriptions, timezone, rates = DEFAULT_EXCHANGE_RATES, months = 12) {
  const now = getCurrentTimeInTimezone(timezone);
  const parts = getTimezoneDateParts(now, timezone);

  const buckets = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(parts.year, parts.month - 1 - i, 1);
    buckets.push({ year: d.getFullYear(), month: d.getMonth() + 1, amount: 0 });
  }

  subscriptions.forEach(sub => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach(payment => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentParts = getTimezoneDateParts(new Date(payment.date), timezone);
      const bucket = buckets.find(b => b.year === paymentParts.year && b.month === paymentParts.month);
      if (bucket) {
        bucket.amount += convertToCNY(payment.amount, sub.currency, rates);
      }
    });
  });

  return buckets.map(b => ({ month: `${b.year}-${String(b.month).padStart(2, '0')}`, amount: b.amount }));
}

// 币种分布：活跃订阅按币种汇总的月均金额（按订阅周期折算为月）
function getCurrencyDistribution(subscriptions, rates = DEFAULT_EXCHANGE_RATES) {
  const currencyMap = {};
  subscriptions.forEach(sub => {
    if (!sub.isActive || !sub.amount || sub.amount <= 0) return;
    const currency = sub.currency || 'CNY';
    const value = Number(sub.periodValue) || 1;
    let monthly = sub.amount;
    if (sub.periodUnit === 'day') {
      monthly = sub.amount * 30 / value;
    } else if (sub.periodUnit === 'year') {
      monthly = sub.amount / (12 * value);
    } else if (sub.periodUnit === 'month') {
      monthly = sub.amount / value;
    }
    currencyMap[currency] = (currencyMap[currency] || 0) + monthly;
  });

  return Object.entries(currencyMap)
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => convertToCNY(b.amount, b.currency, rates) - convertToCNY(a.amount, a.currency, rates));
}

// 本月支出拆分：已支付（本月支付历史）与待支付（本月内尚未到期的活跃订阅）
function getMonthlyBreakdown(subscriptions, timezone, rates = DEFAULT_EXCHANGE_RATES) {
  const now = getCurrentTimeInTimezone(timezone);
  const parts = getTimezoneDateParts(now, timezone);

  let paid = 0;
  subscriptions.forEach(sub => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach(payment => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentParts = getTimezoneDateParts(new Date(payment.date), timezone);
      if (paymentParts.year === parts.year && paymentParts.month === parts.month) {
        paid += convertToCNY(payment.amount, sub.currency, rates);
      }
    });
  });

  let pending = 0;
  subscriptions.forEach(sub => {
    if (!sub.isActive || !sub.amount || sub.amount <= 0) return;
    const expiryDate = new Date(sub.expiryDate);
    const expiryParts = getTimezoneDateParts(expiryDate, timezone);
    if (expiryParts.year === parts.year && expiryParts.month === parts.month && expiryDate >= now) {
      pending += convertToCNY(sub.amount, sub.currency, rates);
    }
  });

  return { paid, pending };
}

// 最近一次到期的活跃订阅（含今天）
function getNextExpiry(subscriptions, timezone) {
  const now = getCurrentTimeInTimezone(timezone);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const next = subscriptions
    .filter(sub => sub.isActive && sub.expiryDate)
    .map(sub => ({ name: sub.name, expiryDate: sub.expiryDate, date: new Date(sub.expiryDate) }))
    .filter(item => item.date >= todayStart)
    .sort((a, b) => a.date - b.date)[0];

  if (!next) {
    return null;
  }
  return {
    name: next.name,
    expiryDate: next.expiryDate,
    daysRemaining: Math.round((next.date - todayStart) / MS_PER_DAY)
  };
}

export {
  DEFAULT_EXCHANGE_RATES,
  convertToCNY,
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
};
