import { formatTimeInTimezone, formatTimezoneDisplay, getCurrentTimeInTimezone, getTimezoneMidnightTimestamp, MS_PER_HOUR, MS_PER_DAY } from './timezone.js';
import { lunarCalendar, lunarBiz } from './lunar.js';
import { extractTagsFromSubscriptions } from './pages.js';
import { resolveReminderSetting, shouldTriggerReminder } from './reminder.js';
import { getAllSubscriptions, saveSubscription } from './store.js';

async function sendWebhookNotification(title, content, config, metadata = {}) {
  try {
    if (!config.WEBHOOK_URL) {
      console.error('[Webhook通知] 通知未配置，缺少URL');
      return false;
    }

    console.log('[Webhook通知] 开始发送通知到: ' + config.WEBHOOK_URL);

    let requestBody;
    let headers = { 'Content-Type': 'application/json' };

    // 处理自定义请求头
    if (config.WEBHOOK_HEADERS) {
      try {
        const customHeaders = JSON.parse(config.WEBHOOK_HEADERS);
        headers = { ...headers, ...customHeaders };
      } catch (error) {
        console.warn('[Webhook通知] 自定义请求头格式错误，使用默认请求头');
      }
    }

    const tagsArray = Array.isArray(metadata.tags)
      ? metadata.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0).map(tag => tag.trim())
      : [];
    const tagsBlock = tagsArray.length ? tagsArray.map(tag => `- ${tag}`).join('\n') : '';
    const tagsLine = tagsArray.length ? '标签：' + tagsArray.join('、') : '';
    const timestamp = formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime');
    const formattedMessage = [title, content, tagsLine, `发送时间：${timestamp}`]
      .filter(section => section && section.trim().length > 0)
      .join('\n\n');

    const templateData = {
      title,
      content,
      tags: tagsBlock,
      tagsLine,
      rawTags: tagsArray,
      timestamp,
      formattedMessage,
      message: formattedMessage
    };

    const escapeForJson = (value) => {
      if (value === null || value === undefined) {
        return '';
      }
      return JSON.stringify(String(value)).slice(1, -1);
    };

    const applyTemplate = (template, data) => {
      const templateString = JSON.stringify(template);
      const replaced = templateString.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          return escapeForJson(data[key]);
        }
        return '';
      });
      return JSON.parse(replaced);
    };

    // 处理消息模板
    if (config.WEBHOOK_TEMPLATE) {
      try {
        const template = JSON.parse(config.WEBHOOK_TEMPLATE);
        requestBody = applyTemplate(template, templateData);
      } catch (error) {
        console.warn('[Webhook通知] 消息模板格式错误，使用默认格式');
        requestBody = {
          title,
          content,
          tags: tagsArray,
          tagsLine,
          timestamp,
          message: formattedMessage
        };
      }
    } else {
      requestBody = {
        title,
        content,
        tags: tagsArray,
        tagsLine,
        timestamp,
        message: formattedMessage
      };
    }

    const response = await fetch(config.WEBHOOK_URL, {
      method: config.WEBHOOK_METHOD || 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    const result = await response.text();
    console.log('[Webhook通知] 发送结果:', response.status, result);
    return response.ok;
  } catch (error) {
    console.error('[Webhook通知] 发送通知失败:', error);
    return false;
  }
}

async function sendWechatBotNotification(title, content, config) {
  try {
    if (!config.WECHATBOT_WEBHOOK) {
      console.error('[企业微信机器人] 通知未配置，缺少Webhook URL');
      return false;
    }

    console.log('[企业微信机器人] 开始发送通知到: ' + config.WECHATBOT_WEBHOOK);

    // 构建消息内容
    let messageData;
    const msgType = config.WECHATBOT_MSG_TYPE || 'text';

    if (msgType === 'markdown') {
      // Markdown 消息格式
      const markdownContent = `# ${title}\n\n${content}`;
      messageData = {
        msgtype: 'markdown',
        markdown: {
          content: markdownContent
        }
      };
    } else {
      // 文本消息格式 - 优化显示
      const textContent = `${title}\n\n${content}`;
      messageData = {
        msgtype: 'text',
        text: {
          content: textContent
        }
      };
    }

    // 处理@功能
    if (config.WECHATBOT_AT_ALL === 'true') {
      // @所有人
      if (msgType === 'text') {
        messageData.text.mentioned_list = ['@all'];
      }
    } else if (config.WECHATBOT_AT_MOBILES) {
      // @指定手机号
      const mobiles = config.WECHATBOT_AT_MOBILES.split(',').map(m => m.trim()).filter(m => m);
      if (mobiles.length > 0) {
        if (msgType === 'text') {
          messageData.text.mentioned_mobile_list = mobiles;
        }
      }
    }

    console.log('[企业微信机器人] 发送消息数据:', JSON.stringify(messageData, null, 2));

    const response = await fetch(config.WECHATBOT_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });

    const responseText = await response.text();
    console.log('[企业微信机器人] 响应状态:', response.status);
    console.log('[企业微信机器人] 响应内容:', responseText);

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        if (result.errcode === 0) {
          console.log('[企业微信机器人] 通知发送成功');
          return true;
        } else {
          console.error('[企业微信机器人] 发送失败，错误码:', result.errcode, '错误信息:', result.errmsg);
          return false;
        }
      } catch (parseError) {
        console.error('[企业微信机器人] 解析响应失败:', parseError);
        return false;
      }
    } else {
      console.error('[企业微信机器人] HTTP请求失败，状态码:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[企业微信机器人] 发送通知失败:', error);
    return false;
  }
}

function formatNotificationContent(subscriptions, config) {
  const showLunar = config.SHOW_LUNAR === true;
  const timezone = config?.TIMEZONE || 'UTC';
  let content = '';

  for (const sub of subscriptions) {
    const typeText = sub.customType || '其他';
    const periodText = (sub.periodValue && sub.periodUnit) ? `(周期: ${sub.periodValue} ${ { day: '天', month: '月', year: '年' }[sub.periodUnit] || sub.periodUnit})` : '';
    const categoryText = sub.category ? sub.category : '未分类';
    const reminderSetting = resolveReminderSetting(sub);

    // 格式化到期日期（使用所选时区）
    const expiryDateObj = new Date(sub.expiryDate);
    const formattedExpiryDate = formatTimeInTimezone(expiryDateObj, timezone, 'date');
    
    // 农历日期
    let lunarExpiryText = '';
    if (showLunar) {
      const lunarExpiry = lunarCalendar.solar2lunar(expiryDateObj.getFullYear(), expiryDateObj.getMonth() + 1, expiryDateObj.getDate());
      lunarExpiryText = lunarExpiry ? `
农历日期: ${lunarExpiry.fullStr}` : '';
    }

    // 状态和到期时间
    let statusText = '';
    let statusEmoji = '';
    if (sub.daysRemaining === 0) {
      statusEmoji = '⚠️';
      statusText = '今天到期！';
    } else if (sub.daysRemaining < 0) {
      statusEmoji = '🚨';
      statusText = `已过期 ${Math.abs(sub.daysRemaining)} 天`;
    } else {
      statusEmoji = '📅';
      statusText = `将在 ${sub.daysRemaining} 天后到期`;
    }

    const reminderSuffix = reminderSetting.value === 0
      ? '（仅到期时提醒）'
      : (reminderSetting.unit === 'hour' ? '（小时级提醒）' : '');
    const reminderText = reminderSetting.unit === 'hour'
      ? `提醒策略: 提前 ${reminderSetting.value} 小时${reminderSuffix}`
      : `提醒策略: 提前 ${reminderSetting.value} 天${reminderSuffix}`;

    // 获取日历类型和自动续期状态
    const calendarType = sub.useLunar ? '农历' : '公历';
    const autoRenewText = sub.autoRenew ? '是' : '否';
    const amountText = sub.amount ? `\n金额: ¥${sub.amount.toFixed(2)}/周期` : '';

    // 构建格式化的通知内容
    const subscriptionContent = `${statusEmoji} **${sub.name}**
类型: ${typeText} ${periodText}
分类: ${categoryText}${amountText}
日历类型: ${calendarType}
到期日期: ${formattedExpiryDate}${lunarExpiryText}
自动续期: ${autoRenewText}
${reminderText}
到期状态: ${statusText}`;

    // 添加备注
    let finalContent = sub.notes ? 
      subscriptionContent + `\n备注: ${sub.notes}` : 
      subscriptionContent;

    content += finalContent + '\n\n';
  }

  // 添加发送时间和时区信息
  const currentTime = formatTimeInTimezone(new Date(), timezone, 'datetime');
  content += `发送时间: ${currentTime}\n当前时区: ${formatTimezoneDisplay(timezone)}`;

  return content;
}

async function sendNotificationToAllChannels(title, commonContent, config, logPrefix = '[定时任务]', options = {}) {
  const metadata = options.metadata || {};
    if (!config.ENABLED_NOTIFIERS || config.ENABLED_NOTIFIERS.length === 0) {
        console.log(`${logPrefix} 未启用任何通知渠道。`);
        return;
    }

    if (config.ENABLED_NOTIFIERS.includes('notifyx')) {
        const notifyxContent = `## ${title}\n\n${commonContent}`;
        const success = await sendNotifyXNotification(title, notifyxContent, `订阅提醒`, config);
        console.log(`${logPrefix} 发送NotifyX通知 ${success ? '成功' : '失败'}`);
    }
    if (config.ENABLED_NOTIFIERS.includes('telegram')) {
        const telegramContent = `*${title}*\n\n${commonContent}`;
        const success = await sendTelegramNotification(telegramContent, config);
        console.log(`${logPrefix} 发送Telegram通知 ${success ? '成功' : '失败'}`);
    }
    if (config.ENABLED_NOTIFIERS.includes('webhook')) {
        const webhookContent = commonContent.replace(/(\**|\*|##|#|`)/g, '');
        const success = await sendWebhookNotification(title, webhookContent, config, metadata);
        console.log(`${logPrefix} 发送Webhook通知 ${success ? '成功' : '失败'}`);
    }
    if (config.ENABLED_NOTIFIERS.includes('wechatbot')) {
        const wechatbotContent = commonContent.replace(/(\**|\*|##|#|`)/g, '');
        const success = await sendWechatBotNotification(title, wechatbotContent, config);
        console.log(`${logPrefix} 发送企业微信机器人通知 ${success ? '成功' : '失败'}`);
    }
    if (config.ENABLED_NOTIFIERS.includes('email')) {
        const emailContent = commonContent.replace(/(\**|\*|##|#|`)/g, '');
        const success = await sendEmailNotification(title, emailContent, config);
        console.log(`${logPrefix} 发送邮件通知 ${success ? '成功' : '失败'}`);
    }
    if (config.ENABLED_NOTIFIERS.includes('bark')) {
        const barkContent = commonContent.replace(/(\**|\*|##|#|`)/g, '');
        const success = await sendBarkNotification(title, barkContent, config);
        console.log(`${logPrefix} 发送Bark通知 ${success ? '成功' : '失败'}`);
    }
    const plainChannelLogs = {
      dingtalk: '钉钉机器人',
      feishu: '飞书机器人',
      serverchan: 'Server酱',
      pushplus: 'PushPlus',
      wxpusher: 'WxPusher',
      discord: 'Discord',
      slack: 'Slack',
      ntfy: 'ntfy',
      pushover: 'Pushover',
      pushdeer: 'PushDeer'
    };
    const plainChannelSenders = {
      dingtalk: sendDingtalkNotification,
      feishu: sendFeishuNotification,
      serverchan: sendServerchanNotification,
      pushplus: sendPushplusNotification,
      wxpusher: sendWxpusherNotification,
      discord: sendDiscordNotification,
      slack: sendSlackNotification,
      ntfy: sendNtfyNotification,
      pushover: sendPushoverNotification,
      pushdeer: sendPushdeerNotification
    };
    for (const [type, sender] of Object.entries(plainChannelSenders)) {
      if (config.ENABLED_NOTIFIERS.includes(type)) {
        const plainContent = commonContent.replace(/(\**|\*|##|#|`)/g, '');
        const success = await sender(title, plainContent, config);
        console.log(`${logPrefix} 发送${plainChannelLogs[type]}通知 ${success ? '成功' : '失败'}`);
      }
    }
}

async function sendTelegramNotification(message, config) {
  try {
    if (!config.TG_BOT_TOKEN || !config.TG_CHAT_ID) {
      console.error('[Telegram] 通知未配置，缺少Bot Token或Chat ID');
      return false;
    }

    console.log('[Telegram] 开始发送通知到 Chat ID: ' + config.TG_CHAT_ID);

    const url = 'https://api.telegram.org/bot' + config.TG_BOT_TOKEN + '/sendMessage';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.TG_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const result = await response.json();
    console.log('[Telegram] 发送结果:', result);
    return result.ok;
  } catch (error) {
    console.error('[Telegram] 发送通知失败:', error);
    return false;
  }
}

async function sendNotifyXNotification(title, content, description, config) {
  try {
    if (!config.NOTIFYX_API_KEY) {
      console.error('[NotifyX] 通知未配置，缺少API Key');
      return false;
    }

    console.log('[NotifyX] 开始发送通知: ' + title);

    const url = 'https://www.notifyx.cn/api/v1/send/' + config.NOTIFYX_API_KEY;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        content: content,
        description: description || ''
      })
    });

    const result = await response.json();
    console.log('[NotifyX] 发送结果:', result);
    return result.status === 'queued';
  } catch (error) {
    console.error('[NotifyX] 发送通知失败:', error);
    return false;
  }
}

async function sendBarkNotification(title, content, config) {
  try {
    if (!config.BARK_DEVICE_KEY) {
      console.error('[Bark] 通知未配置，缺少设备Key');
      return false;
    }

    console.log('[Bark] 开始发送通知到设备: ' + config.BARK_DEVICE_KEY);

    const serverUrl = config.BARK_SERVER || 'https://api.day.app';
    const url = serverUrl + '/push';
    const payload = {
      title: title,
      body: content,
      device_key: config.BARK_DEVICE_KEY
    };

    // 如果配置了保存推送，则添加isArchive参数
    if (config.BARK_IS_ARCHIVE === 'true') {
      payload.isArchive = 1;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('[Bark] 发送结果:', result);
    
    // Bark API返回code为200表示成功
    return result.code === 200;
  } catch (error) {
    console.error('[Bark] 发送通知失败:', error);
    return false;
  }
}

async function sendEmailNotification(title, content, config) {
  try {
    if (!config.RESEND_API_KEY || !config.EMAIL_FROM || !config.EMAIL_TO) {
      console.error('[邮件通知] 通知未配置，缺少必要参数');
      return false;
    }

    console.log('[邮件通知] 开始发送邮件到: ' + config.EMAIL_TO);

    // 生成HTML邮件内容
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; }
        .content h2 { color: #333; margin-top: 0; }
        .content p { color: #666; line-height: 1.6; margin: 16px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .highlight { background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 ${title}</h1>
        </div>
        <div class="content">
            <div class="highlight">
                ${content.replace(/\n/g, '<br>')}
            </div>
            <p>此邮件由订阅管理系统自动发送，请及时处理相关订阅事务。</p>
        </div>
        <div class="footer">
            <p>订阅管理系统 | 发送时间: ${formatTimeInTimezone(new Date(), config?.TIMEZONE || 'UTC', 'datetime')}</p>
        </div>
    </div>
</body>
</html>`;

    const fromEmail = config.EMAIL_FROM_NAME ?
      `${config.EMAIL_FROM_NAME} <${config.EMAIL_FROM}>` :
      config.EMAIL_FROM;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: config.EMAIL_TO,
        subject: title,
        html: htmlContent,
        text: content // 纯文本备用
      })
    });

    const result = await response.json();
    console.log('[邮件通知] 发送结果:', response.status, result);

    if (response.ok && result.id) {
      console.log('[邮件通知] 邮件发送成功，ID:', result.id);
      return true;
    } else {
      console.error('[邮件通知] 邮件发送失败:', result);
      return false;
    }
  } catch (error) {
    console.error('[邮件通知] 发送邮件失败:', error);
    return false;
  }
}

// HMAC-SHA256 签名（Base64），用于钉钉/飞书机器人加签
async function hmacSha256Base64(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function sendDingtalkNotification(title, content, config) {
  try {
    if (!config.DINGTALK_WEBHOOK) {
      console.error('[钉钉机器人] 通知未配置，缺少Webhook URL');
      return false;
    }

    console.log('[钉钉机器人] 开始发送通知');

    let url = config.DINGTALK_WEBHOOK;
    // 可选加签：timestamp + "\n" + secret 作密钥，拼接 timestamp 与 sign 参数
    if (config.DINGTALK_SECRET) {
      const timestamp = Date.now();
      const sign = await hmacSha256Base64(config.DINGTALK_SECRET, timestamp + '\n' + config.DINGTALK_SECRET);
      url += (url.includes('?') ? '&' : '?') + 'timestamp=' + timestamp + '&sign=' + encodeURIComponent(sign);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msgtype: 'text',
        text: { content: `${title}\n\n${content}` }
      })
    });

    const result = await response.json();
    console.log('[钉钉机器人] 发送结果:', result);
    return response.ok && result.errcode === 0;
  } catch (error) {
    console.error('[钉钉机器人] 发送通知失败:', error);
    return false;
  }
}

async function sendFeishuNotification(title, content, config) {
  try {
    if (!config.FEISHU_WEBHOOK) {
      console.error('[飞书机器人] 通知未配置，缺少Webhook URL');
      return false;
    }

    console.log('[飞书机器人] 开始发送通知');

    const payload = {
      msg_type: 'text',
      content: { text: `${title}\n\n${content}` }
    };

    // 可选签名校验：key = timestamp + "\n" + secret，消息体为空字符串
    if (config.FEISHU_SECRET) {
      const timestamp = Math.floor(Date.now() / 1000);
      payload.timestamp = String(timestamp);
      payload.sign = await hmacSha256Base64(config.FEISHU_SECRET + '\n' + timestamp, '');
    }

    const response = await fetch(config.FEISHU_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('[飞书机器人] 发送结果:', result);
    return response.ok && (result.code === 0 || result.StatusCode === 0);
  } catch (error) {
    console.error('[飞书机器人] 发送通知失败:', error);
    return false;
  }
}

async function sendServerchanNotification(title, content, config) {
  try {
    if (!config.SERVERCHAN_SENDKEY) {
      console.error('[Server酱] 通知未配置，缺少SendKey');
      return false;
    }

    console.log('[Server酱] 开始发送通知');

    const response = await fetch('https://sctapi.ftqq.com/' + config.SERVERCHAN_SENDKEY + '.send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ title: title, desp: content }).toString()
    });

    const result = await response.json();
    console.log('[Server酱] 发送结果:', result);
    return response.ok && result.code === 0;
  } catch (error) {
    console.error('[Server酱] 发送通知失败:', error);
    return false;
  }
}

async function sendPushplusNotification(title, content, config) {
  try {
    if (!config.PUSHPLUS_TOKEN) {
      console.error('[PushPlus] 通知未配置，缺少Token');
      return false;
    }

    console.log('[PushPlus] 开始发送通知');

    const response = await fetch('https://www.pushplus.plus/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: config.PUSHPLUS_TOKEN,
        title: title,
        content: content,
        template: 'txt'
      })
    });

    const result = await response.json();
    console.log('[PushPlus] 发送结果:', result);
    return response.ok && result.code === 200;
  } catch (error) {
    console.error('[PushPlus] 发送通知失败:', error);
    return false;
  }
}

async function sendWxpusherNotification(title, content, config) {
  try {
    if (!config.WXPUSHER_APP_TOKEN || !config.WXPUSHER_UID) {
      console.error('[WxPusher] 通知未配置，缺少AppToken或UID');
      return false;
    }

    console.log('[WxPusher] 开始发送通知到 UID: ' + config.WXPUSHER_UID);

    const response = await fetch('https://wxpusher.zjiecode.com/api/send/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appToken: config.WXPUSHER_APP_TOKEN,
        content: `${title}\n\n${content}`,
        summary: title,
        contentType: 1,
        uids: [config.WXPUSHER_UID]
      })
    });

    const result = await response.json();
    console.log('[WxPusher] 发送结果:', result);
    return response.ok && result.code === 1000;
  } catch (error) {
    console.error('[WxPusher] 发送通知失败:', error);
    return false;
  }
}

async function sendDiscordNotification(title, content, config) {
  try {
    if (!config.DISCORD_WEBHOOK) {
      console.error('[Discord] 通知未配置，缺少Webhook URL');
      return false;
    }

    console.log('[Discord] 开始发送通知');

    const response = await fetch(config.DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `**${title}**\n\n${content}` })
    });

    console.log('[Discord] 发送结果:', response.status);
    return response.ok;
  } catch (error) {
    console.error('[Discord] 发送通知失败:', error);
    return false;
  }
}

async function sendSlackNotification(title, content, config) {
  try {
    if (!config.SLACK_WEBHOOK) {
      console.error('[Slack] 通知未配置，缺少Webhook URL');
      return false;
    }

    console.log('[Slack] 开始发送通知');

    const response = await fetch(config.SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `*${title}*\n\n${content}` })
    });

    console.log('[Slack] 发送结果:', response.status);
    return response.ok;
  } catch (error) {
    console.error('[Slack] 发送通知失败:', error);
    return false;
  }
}

async function sendNtfyNotification(title, content, config) {
  try {
    if (!config.NTFY_TOPIC) {
      console.error('[ntfy] 通知未配置，缺少Topic');
      return false;
    }

    const server = (config.NTFY_SERVER || 'https://ntfy.sh').replace(/\/+$/, '');
    console.log('[ntfy] 开始发送通知到: ' + server + '/' + config.NTFY_TOPIC);

    // JSON 发布方式，避免标题含非 ASCII 字符时无法放入请求头
    const headers = { 'Content-Type': 'application/json' };
    if (config.NTFY_TOKEN) {
      headers.Authorization = 'Bearer ' + config.NTFY_TOKEN;
    }

    const response = await fetch(server + '/', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        topic: config.NTFY_TOPIC,
        title: title,
        body: content
      })
    });

    console.log('[ntfy] 发送结果:', response.status);
    return response.ok;
  } catch (error) {
    console.error('[ntfy] 发送通知失败:', error);
    return false;
  }
}

async function sendPushoverNotification(title, content, config) {
  try {
    if (!config.PUSHOVER_TOKEN || !config.PUSHOVER_USER) {
      console.error('[Pushover] 通知未配置，缺少API Token或User Key');
      return false;
    }

    console.log('[Pushover] 开始发送通知');

    const response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: config.PUSHOVER_TOKEN,
        user: config.PUSHOVER_USER,
        title: title,
        message: content
      }).toString()
    });

    const result = await response.json();
    console.log('[Pushover] 发送结果:', result.status);
    return response.ok && result.status === 1;
  } catch (error) {
    console.error('[Pushover] 发送通知失败:', error);
    return false;
  }
}

async function sendPushdeerNotification(title, content, config) {
  try {
    if (!config.PUSHDEER_KEY) {
      console.error('[PushDeer] 通知未配置，缺少Push Key');
      return false;
    }

    const server = (config.PUSHDEER_SERVER || 'https://api2.pushdeer.com').replace(/\/+$/, '');
    console.log('[PushDeer] 开始发送通知到: ' + server);

    const response = await fetch(server + '/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pushkey: config.PUSHDEER_KEY,
        text: `${title}\n\n${content}`,
        type: 'text'
      })
    });

    const result = await response.json();
    console.log('[PushDeer] 发送结果:', result);
    return response.ok && result.code === 0;
  } catch (error) {
    console.error('[PushDeer] 发送通知失败:', error);
    return false;
  }
}

// 生成支付记录唯一 ID
function generatePaymentId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString() + '_' + Math.random().toString(36).slice(2, 11);
}

// 4. 修改定时任务 checkExpiringSubscriptions，支持农历周期自动续订和农历提醒
async function checkExpiringSubscriptions(env) {
  try {
    const config = await getConfig(env);
    const timezone = config?.TIMEZONE || 'UTC';
    const currentTime = getCurrentTimeInTimezone(timezone);
    console.log('[定时任务] 开始检查即将到期的订阅 UTC: ' + new Date().toISOString() + ', ' + timezone + ': ' + currentTime.toLocaleString('zh-CN', {timeZone: timezone}));

    const currentMidnight = getTimezoneMidnightTimestamp(currentTime, timezone); // 统一计算当天的零点时间，避免多次格式化

    const rawNotificationHours = Array.isArray(config.NOTIFICATION_HOURS) ? config.NOTIFICATION_HOURS : [];
    const normalizedNotificationHours = rawNotificationHours
      .map(value => String(value).trim())
      .filter(value => value.length > 0)
      .map(value => value === '*' ? '*' : value.toUpperCase() === 'ALL' ? 'ALL' : value.padStart(2, '0'));
    const allowAllHours = normalizedNotificationHours.includes('*') || normalizedNotificationHours.includes('ALL');
    const hourFormatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour12: false, hour: '2-digit' });
    const currentHour = hourFormatter.format(currentTime);
    const shouldNotifyThisHour = allowAllHours || normalizedNotificationHours.length === 0 || normalizedNotificationHours.includes(currentHour);

    const subscriptions = await getAllSubscriptions(env);
    console.log('[定时任务] 共找到 ' + subscriptions.length + ' 个订阅');
    const expiringSubscriptions = [];
    const updatedSubscriptions = [];
    let hasUpdates = false;

for (const subscription of subscriptions) {
  if (subscription.isActive === false) {
    console.log('[定时任务] 订阅 "' + subscription.name + '" 已停用，跳过');
    continue;
  }

  const reminderSetting = resolveReminderSetting(subscription);
  let diffMs = 0;
  let diffHours = 0;
  let daysDiff;
  if (subscription.useLunar) {
    const expiryDate = new Date(subscription.expiryDate);
    let lunar = lunarCalendar.solar2lunar(
      expiryDate.getFullYear(),
      expiryDate.getMonth() + 1,
      expiryDate.getDate()
    );
    const solar = lunarBiz.lunar2solar(lunar);
    const lunarDate = new Date(solar.year, solar.month - 1, solar.day);
    const lunarMidnight = getTimezoneMidnightTimestamp(lunarDate, timezone);
    
    daysDiff = Math.round((lunarMidnight - currentMidnight) / MS_PER_DAY);

    console.log('[定时任务] 订阅 "' + subscription.name + '" 到期日期: ' + expiryDate.toISOString() + ', 农历转换后午夜时间: ' + new Date(lunarMidnight).toISOString() + ', 剩余天数: ' + daysDiff);

    diffMs = expiryDate.getTime() - currentTime.getTime();
    diffHours = diffMs / MS_PER_HOUR;

    if (daysDiff < 0 && subscription.periodValue && subscription.periodUnit && subscription.autoRenew !== false) {
      let nextLunar = lunar;
      do {
        nextLunar = lunarBiz.addLunarPeriod(nextLunar, subscription.periodValue, subscription.periodUnit);
        const solar = lunarBiz.lunar2solar(nextLunar);
        var newExpiryDate = new Date(solar.year, solar.month - 1, solar.day);
        const newLunarMidnight = getTimezoneMidnightTimestamp(newExpiryDate, timezone);
        daysDiff = Math.round((newLunarMidnight - currentMidnight) / MS_PER_DAY);
        console.log('[定时任务] 订阅 "' + subscription.name + '" 更新到期日期: ' + newExpiryDate.toISOString() + ', 农历转换后午夜时间: ' + new Date(newLunarMidnight).toISOString() + ', 剩余天数: ' + daysDiff);
      } while (daysDiff < 0);

      diffMs = newExpiryDate.getTime() - currentTime.getTime();
      diffHours = diffMs / MS_PER_HOUR;

      const paymentRecord = {
        id: generatePaymentId(),
        date: currentTime.toISOString(),
        amount: subscription.amount || 0,
        type: 'auto',
        note: '自动续订',
        periodStart: expiryDate.toISOString(),
        periodEnd: newExpiryDate.toISOString()
      };

      const paymentHistory = subscription.paymentHistory || [];
      paymentHistory.push(paymentRecord);

      const updatedSubscription = {
        ...subscription,
        expiryDate: newExpiryDate.toISOString(),
        lastPaymentDate: currentTime.toISOString(),
        paymentHistory
      };
      updatedSubscriptions.push(updatedSubscription);
      hasUpdates = true;

      const shouldRemindAfterRenewal = shouldTriggerReminder(reminderSetting, daysDiff, diffHours);
      if (shouldRemindAfterRenewal) {
        console.log('[定时任务] 订阅 "' + subscription.name + '" 在提醒范围内，将发送通知');
        expiringSubscriptions.push({
          ...updatedSubscription,
          daysRemaining: daysDiff,
          hoursRemaining: Math.round(diffHours)
        });
      }
      continue;
    }
  } else {
    const expiryDate = new Date(subscription.expiryDate);
    const expiryMidnight = getTimezoneMidnightTimestamp(expiryDate, timezone);

    daysDiff = Math.round((expiryMidnight - currentMidnight) / MS_PER_DAY);

    console.log('[定时任务] 订阅 "' + subscription.name + '" 到期日期: ' + expiryDate.toISOString() + ', 时区午夜时间: ' + new Date(expiryMidnight).toISOString() + ', 剩余天数: ' + daysDiff);

    diffMs = expiryDate.getTime() - currentTime.getTime();
    diffHours = diffMs / MS_PER_HOUR;

    if (daysDiff < 0 && subscription.periodValue && subscription.periodUnit && subscription.autoRenew !== false) {
      const newExpiryDate = new Date(expiryDate);

      if (subscription.periodUnit === 'day') {
        newExpiryDate.setDate(expiryDate.getDate() + subscription.periodValue);
      } else if (subscription.periodUnit === 'month') {
        newExpiryDate.setMonth(expiryDate.getMonth() + subscription.periodValue);
      } else if (subscription.periodUnit === 'year') {
        newExpiryDate.setFullYear(expiryDate.getFullYear() + subscription.periodValue);
      }

      let newExpiryMidnight = getTimezoneMidnightTimestamp(newExpiryDate, timezone);
      while (newExpiryMidnight < currentMidnight) {
        console.log('[定时任务] 新计算的到期日期 ' + newExpiryDate.toISOString() + ' (时区转换后午夜: ' + new Date(newExpiryMidnight).toISOString() + ') 仍然过期，继续计算下一个周期');
        if (subscription.periodUnit === 'day') {
          newExpiryDate.setDate(newExpiryDate.getDate() + subscription.periodValue);
        } else if (subscription.periodUnit === 'month') {
          newExpiryDate.setMonth(newExpiryDate.getMonth() + subscription.periodValue);
        } else if (subscription.periodUnit === 'year') {
          newExpiryDate.setFullYear(newExpiryDate.getFullYear() + subscription.periodValue);
        }
        newExpiryMidnight = getTimezoneMidnightTimestamp(newExpiryDate, timezone);
      }

      console.log('[定时任务] 订阅 "' + subscription.name + '" 更新到期日期: ' + newExpiryDate.toISOString());

      diffMs = newExpiryDate.getTime() - currentTime.getTime();
      diffHours = diffMs / MS_PER_HOUR;

      const paymentRecord = {
        id: generatePaymentId(),
        date: currentTime.toISOString(),
        amount: subscription.amount || 0,
        type: 'auto',
        note: '自动续订',
        periodStart: expiryDate.toISOString(),
        periodEnd: newExpiryDate.toISOString()
      };

      const paymentHistory = subscription.paymentHistory || [];
      paymentHistory.push(paymentRecord);

      const updatedSubscription = {
        ...subscription,
        expiryDate: newExpiryDate.toISOString(),
        lastPaymentDate: currentTime.toISOString(),
        paymentHistory
      };
      updatedSubscriptions.push(updatedSubscription);
      hasUpdates = true;

      const newDaysDiff = Math.round((newExpiryMidnight - currentMidnight) / MS_PER_DAY);
      const shouldRemindAfterRenewal = shouldTriggerReminder(reminderSetting, newDaysDiff, diffHours);
      if (shouldRemindAfterRenewal) {
        console.log('[定时任务] 订阅 "' + subscription.name + '" 在提醒范围内，将发送通知');
        expiringSubscriptions.push({
          ...updatedSubscription,
          daysRemaining: newDaysDiff,
          hoursRemaining: Math.round(diffHours)
        });
      }
      continue;
    }
  }

  diffMs = new Date(subscription.expiryDate).getTime() - currentTime.getTime();
  diffHours = diffMs / MS_PER_HOUR;
  const shouldRemind = shouldTriggerReminder(reminderSetting, daysDiff, diffHours);

  if (daysDiff < 0 && subscription.autoRenew === false) {
    console.log('[定时任务] 订阅 "' + subscription.name + '" 已过期且未启用自动续订，将发送过期通知');
    expiringSubscriptions.push({
      ...subscription,
      daysRemaining: daysDiff,
      hoursRemaining: Math.round(diffHours)
    });
  } else if (shouldRemind) {
    console.log('[定时任务] 订阅 "' + subscription.name + '" 在提醒范围内，将发送通知');
    expiringSubscriptions.push({
      ...subscription,
      daysRemaining: daysDiff,
      hoursRemaining: Math.round(diffHours)
    });
  }
}

    if (hasUpdates) {
      // 逐条保存更新后的订阅，避免整表写入导致的并发覆盖
      await Promise.all(updatedSubscriptions.map(sub => saveSubscription(sub, env)));
    }

    if (expiringSubscriptions.length > 0) {
      if (!shouldNotifyThisHour) {
        console.log('[定时任务] 当前小时 ' + currentHour + ' 未配置为推送时间，跳过发送通知');
        expiringSubscriptions.length = 0;
      } else {
        // 按到期时间排序
        expiringSubscriptions.sort((a, b) => a.daysRemaining - b.daysRemaining);

        // 使用优化的格式化函数
        const commonContent = formatNotificationContent(expiringSubscriptions, config);
        const metadataTags = extractTagsFromSubscriptions(expiringSubscriptions);

        const title = '订阅到期提醒';
        await sendNotificationToAllChannels(title, commonContent, config, '[定时任务]', {
          metadata: { tags: metadataTags }
        });
      }
    }
  } catch (error) {
    console.error('[定时任务] 检查即将到期的订阅失败:', error);
  }
}


export {
  sendWebhookNotification,
  sendWechatBotNotification,
  sendTelegramNotification,
  sendNotifyXNotification,
  sendBarkNotification,
  sendEmailNotification,
  sendDingtalkNotification,
  sendFeishuNotification,
  sendServerchanNotification,
  sendPushplusNotification,
  sendWxpusherNotification,
  sendDiscordNotification,
  sendSlackNotification,
  sendNtfyNotification,
  sendPushoverNotification,
  sendPushdeerNotification,
  sendNotificationToAllChannels,
  formatNotificationContent,
  checkExpiringSubscriptions
};
