import { getCurrentTimeInTimezone } from './timezone.js';
import { lunarCalendar, lunarBiz } from './lunar.js';
import { getConfig } from './auth.js';
import { resolveReminderSetting } from './reminder.js';

// ==================== 订阅存储层 ====================
// 每个订阅使用独立 KV 键（前缀 sub:），避免单键体积膨胀与整表并发覆盖问题
const SUBSCRIPTION_KEY_PREFIX = 'sub:';
const LEGACY_SUBSCRIPTIONS_KEY = 'subscriptions';

// 每个 Worker 隔离实例只执行一次旧数据迁移检查
let legacyMigrationChecked = false;

function subscriptionKey(id) {
  return SUBSCRIPTION_KEY_PREFIX + id;
}

// 将旧版单键数据（subscriptions: [...]）迁移为独立键存储
async function ensureLegacyMigrated(env) {
  if (legacyMigrationChecked) {
    return;
  }
  try {
    const legacyData = await env.SUBSCRIPTIONS_KV.get(LEGACY_SUBSCRIPTIONS_KEY);
    if (legacyData) {
      const legacySubscriptions = JSON.parse(legacyData);
      if (Array.isArray(legacySubscriptions) && legacySubscriptions.length > 0) {
        await Promise.all(legacySubscriptions.map(sub =>
          env.SUBSCRIPTIONS_KV.put(subscriptionKey(sub.id), JSON.stringify(sub))
        ));
        console.log('[存储] 已将 ' + legacySubscriptions.length + ' 条旧版订阅数据迁移为独立键存储');
      }
      await env.SUBSCRIPTIONS_KV.delete(LEGACY_SUBSCRIPTIONS_KEY);
    }
    legacyMigrationChecked = true;
  } catch (error) {
    console.error('[存储] 旧数据迁移失败:', error);
  }
}

// 生成唯一 ID（优先使用 crypto.randomUUID）
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString() + '_' + Math.random().toString(36).slice(2, 11);
}

async function getAllSubscriptions(env) {
  try {
    if (!env.SUBSCRIPTIONS_KV) {
      console.error('[存储] KV存储未绑定');
      return [];
    }

    await ensureLegacyMigrated(env);

    const subscriptions = [];
    let cursor;
    // 分页遍历所有 sub: 前缀的键，兼容订阅数量超过单页上限的情况
    do {
      const listResult = await env.SUBSCRIPTIONS_KV.list({ prefix: SUBSCRIPTION_KEY_PREFIX, cursor });
      const keys = listResult.keys.map(k => k.name);
      if (keys.length > 0) {
        const values = await Promise.all(keys.map(key => env.SUBSCRIPTIONS_KV.get(key)));
        values.forEach(value => {
          if (!value) return;
          try {
            subscriptions.push(JSON.parse(value));
          } catch (parseError) {
            console.error('[存储] 解析订阅数据失败，已跳过损坏的记录:', parseError);
          }
        });
      }
      cursor = listResult.list_complete ? undefined : listResult.cursor;
    } while (cursor);

    return subscriptions;
  } catch (error) {
    console.error('[存储] 读取订阅列表失败:', error);
    return [];
  }
}

// 写入或更新单个订阅
async function saveSubscription(subscription, env) {
  await env.SUBSCRIPTIONS_KV.put(subscriptionKey(subscription.id), JSON.stringify(subscription));
  return subscription;
}

// 删除单个订阅的存储键
async function deleteSubscriptionKey(id, env) {
  await env.SUBSCRIPTIONS_KV.delete(subscriptionKey(id));
}

async function getSubscription(id, env) {
  try {
    await ensureLegacyMigrated(env);
    const data = await env.SUBSCRIPTIONS_KV.get(subscriptionKey(id));
    return data ? JSON.parse(data) : undefined;
  } catch (error) {
    console.error('[存储] 读取订阅失败:', error);
    return undefined;
  }
}

// 创建订阅，支持 useLunar 字段与过期日自动顺延
async function createSubscription(subscription, env) {
  try {
    if (!subscription.name || !subscription.expiryDate) {
      return { success: false, message: '缺少必填字段' };
    }

    let expiryDate = new Date(subscription.expiryDate);
    const config = await getConfig(env);
    const timezone = config?.TIMEZONE || 'UTC';
    const currentTime = getCurrentTimeInTimezone(timezone);
    

    let useLunar = !!subscription.useLunar;
    if (useLunar) {
      let lunar = lunarCalendar.solar2lunar(
        expiryDate.getFullYear(),
        expiryDate.getMonth() + 1,
        expiryDate.getDate()
      );
      
      if (lunar && subscription.periodValue && subscription.periodUnit) {
        // 如果到期日<=今天，自动推算到下一个周期
        while (expiryDate <= currentTime) {
          lunar = lunarBiz.addLunarPeriod(lunar, subscription.periodValue, subscription.periodUnit);
          const solar = lunarBiz.lunar2solar(lunar);
          expiryDate = new Date(solar.year, solar.month - 1, solar.day);
        }
        subscription.expiryDate = expiryDate.toISOString();
      }
    } else {
      if (expiryDate < currentTime && subscription.periodValue && subscription.periodUnit) {
        while (expiryDate < currentTime) {
          if (subscription.periodUnit === 'day') {
            expiryDate.setDate(expiryDate.getDate() + subscription.periodValue);
          } else if (subscription.periodUnit === 'month') {
            expiryDate.setMonth(expiryDate.getMonth() + subscription.periodValue);
          } else if (subscription.periodUnit === 'year') {
            expiryDate.setFullYear(expiryDate.getFullYear() + subscription.periodValue);
          }
        }
        subscription.expiryDate = expiryDate.toISOString();
      }
    }

    const reminderSetting = resolveReminderSetting(subscription);

    const initialPaymentDate = subscription.startDate || currentTime.toISOString();
    const newSubscription = {
      id: generateId(),
      name: subscription.name,
      customType: subscription.customType || '',
      category: subscription.category ? subscription.category.trim() : '',
      startDate: subscription.startDate || null,
      expiryDate: subscription.expiryDate,
      periodValue: subscription.periodValue || 1,
      periodUnit: subscription.periodUnit || 'month',
      reminderUnit: reminderSetting.unit,
      reminderValue: reminderSetting.value,
      reminderDays: reminderSetting.unit === 'day' ? reminderSetting.value : undefined,
      reminderHours: reminderSetting.unit === 'hour' ? reminderSetting.value : undefined,
      notes: subscription.notes || '',
      amount: subscription.amount || null,
      currency: subscription.currency || 'CNY', // 使用传入的币种，默认为CNY  
      lastPaymentDate: initialPaymentDate,
      paymentHistory: subscription.amount ? [{
        id: generateId(),
        date: initialPaymentDate,
        amount: subscription.amount,
        type: 'initial',
        note: '初始订阅',
        periodStart: subscription.startDate || initialPaymentDate,
        periodEnd: subscription.expiryDate
      }] : [],
      isActive: subscription.isActive !== false,
      autoRenew: subscription.autoRenew !== false,
      useLunar: useLunar,
      createdAt: new Date().toISOString()
    };

    await saveSubscription(newSubscription, env);

    return { success: true, subscription: newSubscription };
  } catch (error) {
    console.error("创建订阅异常：", error && error.stack ? error.stack : error);
    return { success: false, message: error && error.message ? error.message : '创建订阅失败' };
  }
}

// 3. 修改 updateSubscription，支持 useLunar 字段
async function updateSubscription(id, subscription, env) {
  try {
    const existing = await getSubscription(id, env);

    if (!existing) {
      return { success: false, message: '订阅不存在' };
    }

    if (!subscription.name || !subscription.expiryDate) {
      return { success: false, message: '缺少必填字段' };
    }

    let expiryDate = new Date(subscription.expiryDate);
    const config = await getConfig(env);
    const timezone = config?.TIMEZONE || 'UTC';
    const currentTime = getCurrentTimeInTimezone(timezone);

let useLunar = !!subscription.useLunar;
if (useLunar) {
  let lunar = lunarCalendar.solar2lunar(
    expiryDate.getFullYear(),
    expiryDate.getMonth() + 1,
    expiryDate.getDate()
  );
  if (!lunar) {
    return { success: false, message: '农历日期超出支持范围（1900-2100年）' };
  }
  if (lunar && expiryDate < currentTime && subscription.periodValue && subscription.periodUnit) {
    // 新增：循环加周期，直到 expiryDate > currentTime
    do {
      lunar = lunarBiz.addLunarPeriod(lunar, subscription.periodValue, subscription.periodUnit);
      const solar = lunarBiz.lunar2solar(lunar);
      expiryDate = new Date(solar.year, solar.month - 1, solar.day);
    } while (expiryDate < currentTime);
    subscription.expiryDate = expiryDate.toISOString();
  }
} else {
      if (expiryDate < currentTime && subscription.periodValue && subscription.periodUnit) {
        while (expiryDate < currentTime) {
          if (subscription.periodUnit === 'day') {
            expiryDate.setDate(expiryDate.getDate() + subscription.periodValue);
          } else if (subscription.periodUnit === 'month') {
            expiryDate.setMonth(expiryDate.getMonth() + subscription.periodValue);
          } else if (subscription.periodUnit === 'year') {
            expiryDate.setFullYear(expiryDate.getFullYear() + subscription.periodValue);
          }
        }
        subscription.expiryDate = expiryDate.toISOString();
      }
    }

    const reminderSource = {
      reminderUnit: subscription.reminderUnit !== undefined ? subscription.reminderUnit : existing.reminderUnit,
      reminderValue: subscription.reminderValue !== undefined ? subscription.reminderValue : existing.reminderValue,
      reminderHours: subscription.reminderHours !== undefined ? subscription.reminderHours : existing.reminderHours,
      reminderDays: subscription.reminderDays !== undefined ? subscription.reminderDays : existing.reminderDays
    };
    const reminderSetting = resolveReminderSetting(reminderSource);

    // --- 新增/修改逻辑开始 ---
    // 获取旧的订阅信息以便比较
    const oldSubscription = existing;
    const newAmount = subscription.amount !== undefined ? subscription.amount : oldSubscription.amount;
    
    let paymentHistory = oldSubscription.paymentHistory || [];
    
    // 核心修复：如果金额发生了变化，且存在初始支付记录，则同步更新初始支付记录的金额
    // 这解决了"修改订阅金额后，仪表盘统计不更新"的问题
    if (newAmount !== oldSubscription.amount) {
      const initialPaymentIndex = paymentHistory.findIndex(p => p.type === 'initial');
      if (initialPaymentIndex !== -1) {
        paymentHistory[initialPaymentIndex] = {
          ...paymentHistory[initialPaymentIndex],
          amount: newAmount
        };
      }
    }
    // --- 新增/修改逻辑结束 ---

    const updatedSubscription = {
      ...existing,
      name: subscription.name,
      customType: subscription.customType || existing.customType || '',
      category: subscription.category !== undefined ? subscription.category.trim() : (existing.category || ''),
      startDate: subscription.startDate || existing.startDate,
      expiryDate: subscription.expiryDate,
      periodValue: subscription.periodValue || existing.periodValue || 1,
      periodUnit: subscription.periodUnit || existing.periodUnit || 'month',
      reminderUnit: reminderSetting.unit,
      reminderValue: reminderSetting.value,
      reminderDays: reminderSetting.unit === 'day' ? reminderSetting.value : undefined,
      reminderHours: reminderSetting.unit === 'hour' ? reminderSetting.value : undefined,
      notes: subscription.notes || '',
      amount: newAmount, // 使用新的变量
      currency: subscription.currency || existing.currency || 'CNY', // 更新币种
      lastPaymentDate: existing.lastPaymentDate || existing.startDate || existing.createdAt || currentTime.toISOString(),
      paymentHistory: paymentHistory, // 保存更新后的支付历史
      isActive: subscription.isActive !== undefined ? subscription.isActive : existing.isActive,
      autoRenew: subscription.autoRenew !== undefined ? subscription.autoRenew : (existing.autoRenew !== undefined ? existing.autoRenew : true),
      useLunar: useLunar,
      updatedAt: new Date().toISOString()
    };

    await saveSubscription(updatedSubscription, env);

    return { success: true, subscription: updatedSubscription };
  } catch (error) {
    return { success: false, message: '更新订阅失败' };
  }
}

async function deleteSubscription(id, env) {
  try {
    const existing = await getSubscription(id, env);

    if (!existing) {
      return { success: false, message: '订阅不存在' };
    }

    await deleteSubscriptionKey(id, env);

    return { success: true };
  } catch (error) {
    return { success: false, message: '删除订阅失败' };
  }
}

async function manualRenewSubscription(id, env, options = {}) {
  try {
    const subscription = await getSubscription(id, env);

    if (!subscription) {
      return { success: false, message: '订阅不存在' };
    }

    if (!subscription.periodValue || !subscription.periodUnit) {
      return { success: false, message: '订阅未设置续订周期' };
    }

    const config = await getConfig(env);
    const timezone = config?.TIMEZONE || 'UTC';
    const currentTime = getCurrentTimeInTimezone(timezone);

    // 支持自定义参数
    const paymentDate = options.paymentDate ? new Date(options.paymentDate) : currentTime;
    const amount = options.amount !== undefined ? options.amount : subscription.amount || 0;
    const periodMultiplier = options.periodMultiplier || 1; // 支持续订多个周期
    const note = options.note || '手动续订';

    let expiryDate = new Date(subscription.expiryDate);
    let newExpiryDate;

    if (subscription.useLunar) {
      const lunar = lunarCalendar.solar2lunar(
        expiryDate.getFullYear(),
        expiryDate.getMonth() + 1,
        expiryDate.getDate()
      );
      // 支持多周期续订
      let nextLunar = lunar;
      for (let i = 0; i < periodMultiplier; i++) {
        nextLunar = lunarBiz.addLunarPeriod(nextLunar, subscription.periodValue, subscription.periodUnit);
      }
      const solar = lunarBiz.lunar2solar(nextLunar);
      newExpiryDate = new Date(solar.year, solar.month - 1, solar.day);
    } else {
      newExpiryDate = new Date(expiryDate);
      const totalPeriodValue = subscription.periodValue * periodMultiplier;
      if (subscription.periodUnit === 'day') {
        newExpiryDate.setDate(expiryDate.getDate() + totalPeriodValue);
      } else if (subscription.periodUnit === 'month') {
        newExpiryDate.setMonth(expiryDate.getMonth() + totalPeriodValue);
      } else if (subscription.periodUnit === 'year') {
        newExpiryDate.setFullYear(expiryDate.getFullYear() + totalPeriodValue);
      }
    }

    const paymentRecord = {
      id: generateId(),
      date: paymentDate.toISOString(),
      amount: amount,
      type: 'manual',
      note: note,
      periodStart: expiryDate.toISOString(),
      periodEnd: newExpiryDate.toISOString()
    };

    const paymentHistory = subscription.paymentHistory || [];
    paymentHistory.push(paymentRecord);

    const updatedSubscription = {
      ...subscription,
      expiryDate: newExpiryDate.toISOString(),
      lastPaymentDate: paymentDate.toISOString(),
      paymentHistory
    };

    await saveSubscription(updatedSubscription, env);

    return { success: true, subscription: updatedSubscription, message: '续订成功' };
  } catch (error) {
    console.error('手动续订失败:', error);
    return { success: false, message: '续订失败: ' + error.message };
  }
}

async function deletePaymentRecord(subscriptionId, paymentId, env) {
  try {
    const subscription = await getSubscription(subscriptionId, env);

    if (!subscription) {
      return { success: false, message: '订阅不存在' };
    }

    const paymentHistory = subscription.paymentHistory || [];
    const paymentIndex = paymentHistory.findIndex(p => p.id === paymentId);

    if (paymentIndex === -1) {
      return { success: false, message: '支付记录不存在' };
    }

    const deletedPayment = paymentHistory[paymentIndex];

    // 删除支付记录
    paymentHistory.splice(paymentIndex, 1);

    // 回退订阅周期和更新 lastPaymentDate
    let newExpiryDate = subscription.expiryDate;
    let newLastPaymentDate = subscription.lastPaymentDate;

    if (paymentHistory.length > 0) {
      // 找到剩余支付记录中 periodEnd 最晚的那条（最新的续订）
      const sortedByPeriodEnd = [...paymentHistory].sort((a, b) => {
        const dateA = a.periodEnd ? new Date(a.periodEnd) : new Date(0);
        const dateB = b.periodEnd ? new Date(b.periodEnd) : new Date(0);
        return dateB - dateA;
      });

      // 订阅的到期日期应该是最新续订的 periodEnd
      if (sortedByPeriodEnd[0].periodEnd) {
        newExpiryDate = sortedByPeriodEnd[0].periodEnd;
      }

      // 找到最新的支付记录日期
      const sortedByDate = [...paymentHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
      newLastPaymentDate = sortedByDate[0].date;
    } else {
      // 如果没有支付记录了，回退到初始状态
      // expiryDate 保持不变或使用 periodStart（如果删除的记录有）
      if (deletedPayment.periodStart) {
        newExpiryDate = deletedPayment.periodStart;
      }
      newLastPaymentDate = subscription.startDate || subscription.createdAt || subscription.expiryDate;
    }

    const updatedSubscription = {
      ...subscription,
      expiryDate: newExpiryDate,
      paymentHistory,
      lastPaymentDate: newLastPaymentDate
    };

    await saveSubscription(updatedSubscription, env);

    return { success: true, subscription: updatedSubscription, message: '支付记录已删除' };
  } catch (error) {
    console.error('删除支付记录失败:', error);
    return { success: false, message: '删除失败: ' + error.message };
  }
}

async function updatePaymentRecord(subscriptionId, paymentId, paymentData, env) {
  try {
    const subscription = await getSubscription(subscriptionId, env);

    if (!subscription) {
      return { success: false, message: '订阅不存在' };
    }

    const paymentHistory = subscription.paymentHistory || [];
    const paymentIndex = paymentHistory.findIndex(p => p.id === paymentId);

    if (paymentIndex === -1) {
      return { success: false, message: '支付记录不存在' };
    }

    // 更新支付记录
    paymentHistory[paymentIndex] = {
      ...paymentHistory[paymentIndex],
      date: paymentData.date || paymentHistory[paymentIndex].date,
      amount: paymentData.amount !== undefined ? paymentData.amount : paymentHistory[paymentIndex].amount,
      note: paymentData.note !== undefined ? paymentData.note : paymentHistory[paymentIndex].note
    };

    // 更新 lastPaymentDate 为最新的支付记录日期
    const sortedPayments = [...paymentHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    const newLastPaymentDate = sortedPayments[0].date;

    const updatedSubscription = {
      ...subscription,
      paymentHistory,
      lastPaymentDate: newLastPaymentDate
    };

    await saveSubscription(updatedSubscription, env);

    return { success: true, subscription: updatedSubscription, message: '支付记录已更新' };
  } catch (error) {
    console.error('更新支付记录失败:', error);
    return { success: false, message: '更新失败: ' + error.message };
  }
}

async function toggleSubscriptionStatus(id, isActive, env) {
  try {
    const existing = await getSubscription(id, env);

    if (!existing) {
      return { success: false, message: '订阅不存在' };
    }

    const updatedSubscription = {
      ...existing,
      isActive: isActive,
      updatedAt: new Date().toISOString()
    };

    await saveSubscription(updatedSubscription, env);

    return { success: true, subscription: updatedSubscription };
  } catch (error) {
    return { success: false, message: '更新订阅状态失败' };
  }
}


export {
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
};
