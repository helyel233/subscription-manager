// 暗黑模式公共样式与初始化脚本（所有页面共用，偏好存储在浏览器 localStorage）
const DARK_MODE_SNIPPET = `
<style id="darkModeStyle">
  html.dark body { background-color: #111827 !important; color: #e5e7eb !important; }
  html.dark .bg-white { background-color: #1f2937 !important; }
  html.dark .bg-gray-50 { background-color: #111827 !important; }
  html.dark .bg-gray-100 { background-color: #1f2937 !important; }
  html.dark .bg-indigo-50 { background-color: rgba(99, 102, 241, 0.15) !important; }
  html.dark .hover\\:bg-gray-50:hover { background-color: #1f2937 !important; }
  html.dark .text-gray-900, html.dark .text-gray-800, html.dark .text-gray-700 { color: #f3f4f6 !important; }
  html.dark .text-gray-600, html.dark .text-gray-500, html.dark .text-gray-400 { color: #9ca3af !important; }
  html.dark .text-indigo-900 { color: #c7d2fe !important; }
  html.dark .text-indigo-700, html.dark .text-indigo-600 { color: #a5b4fc !important; }
  html.dark .text-purple-600 { color: #c4b5fd !important; }
  html.dark .text-red-500 { color: #f87171 !important; }
  html.dark input[type="text"], html.dark input[type="password"], html.dark input[type="url"],
  html.dark input[type="number"], html.dark input[type="date"], html.dark select, html.dark textarea {
    background-color: #111827 !important; border-color: #374151 !important; color: #e5e7eb !important;
  }
  html.dark .border-gray-100, html.dark .border-gray-200, html.dark .border-gray-300 { border-color: #374151 !important; }
  html.dark .responsive-table td:before { color: #9ca3af !important; }
  html.dark .stat-card { background-color: #1f2937 !important; }
  html.dark .config-section { border-color: #374151 !important; }
  html.dark .config-section.active { background-color: #1f2937 !important; border-color: #6366f1 !important; }
  html.dark .config-section.inactive { background-color: #111827 !important; }
  html.dark .readonly-input { background-color: #111827 !important; border-color: #374151 !important; color: #9ca3af !important; }
  html.dark .login-container { background: linear-gradient(135deg, #111827 0%, #1e1b4b 55%, #3730a3 100%) !important; }
  html.dark .login-box { background-color: #1f2937 !important; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important; }
</style>
<script>
  (function () {
    try {
      if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark');
      }
    } catch (e) { /* localStorage 不可用时忽略 */ }
  })();
</script>
`;

const loginPage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>订阅管理系统</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <style>
    .login-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .login-box {
      backdrop-filter: blur(8px);
      background-color: rgba(255, 255, 255, 0.9);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      transition: all 0.3s;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    .input-field {
      transition: all 0.3s;
      border: 1px solid #e2e8f0;
    }
    .input-field:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.25);
    }
  </style>
${DARK_MODE_SNIPPET}</head>

<body class="login-container flex items-center justify-center">
  <div class="login-box p-8 rounded-xl w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-calendar-check mr-2"></i>订阅管理系统</h1>
      <p class="text-gray-600 mt-2">登录管理您的订阅提醒</p>
    </div>
    
    <form id="loginForm" class="space-y-6">
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
          <i class="fas fa-user mr-2"></i>用户名
        </label>
        <input type="text" id="username" name="username" required
          class="input-field w-full px-4 py-3 rounded-lg text-gray-700 focus:outline-none">
      </div>
      
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
          <i class="fas fa-lock mr-2"></i>密码
        </label>
        <input type="password" id="password" name="password" required
          class="input-field w-full px-4 py-3 rounded-lg text-gray-700 focus:outline-none">
      </div>
      
      <button type="submit" 
        class="btn-primary w-full py-3 rounded-lg text-white font-medium focus:outline-none">
        <i class="fas fa-sign-in-alt mr-2"></i>登录
      </button>
      
      <div id="errorMsg" class="text-red-500 text-center"></div>
    </form>
  </div>
  
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      const button = e.target.querySelector('button');
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>登录中...';
      button.disabled = true;
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
          window.location.href = '/admin';
        } else {
          document.getElementById('errorMsg').textContent = result.message || '用户名或密码错误';
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      } catch (error) {
        document.getElementById('errorMsg').textContent = '发生错误，请稍后再试';
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    });
  </script>
</body>
</html>
`;

const adminPage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>订阅管理系统</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <style>
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); transition: all 0.3s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-danger { background: linear-gradient(135deg, #f87171 0%, #dc2626 100%); transition: all 0.3s; }
    .btn-danger:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-success { background: linear-gradient(135deg, #34d399 0%, #059669 100%); transition: all 0.3s; }
    .btn-success:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-warning { background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); transition: all 0.3s; }
    .btn-warning:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-info { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); transition: all 0.3s; }
    .btn-info:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .table-container { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .modal-container { backdrop-filter: blur(8px); }
    .readonly-input { background-color: #f8fafc; border-color: #e2e8f0; cursor: not-allowed; }
    .error-message { font-size: 0.875rem; margin-top: 0.25rem; display: none; }
    .error-message.show { display: block; }

    /* 通用悬浮提示优化 */
    .hover-container {
      position: relative;
      width: 100%;
    }
    .hover-text {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.3s ease;
      display: block;
    }
    .hover-text:hover { color: #3b82f6; }
    .hover-tooltip {
      position: fixed;
      z-index: 9999;
      background: #1f2937;
      color: white;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.875rem;
      max-width: 320px;
      word-wrap: break-word;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      transform: translateY(-10px);
      white-space: normal;
      pointer-events: none;
      line-height: 1.4;
    }
    .hover-tooltip.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .hover-tooltip::before {
      content: '';
      position: absolute;
      top: -6px;
      left: 20px;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid #1f2937;
    }
    .hover-tooltip.tooltip-above::before {
      top: auto;
      bottom: -6px;
      border-bottom: none;
      border-top: 6px solid #1f2937;
    }

    /* 备注显示优化 */
    .notes-container {
      position: relative;
      max-width: 200px;
      width: 100%;
    }
    .notes-text {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.3s ease;
      display: block;
    }
    .notes-text:hover { color: #3b82f6; }
    .notes-tooltip {
      position: fixed;
      z-index: 9999;
      background: #1f2937;
      color: white;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.875rem;
      max-width: 320px;
      word-wrap: break-word;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      transform: translateY(-10px);
      white-space: normal;
      pointer-events: none;
      line-height: 1.4;
    }
    .notes-tooltip.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .notes-tooltip::before {
      content: '';
      position: absolute;
      top: -6px;
      left: 20px;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid #1f2937;
    }
    .notes-tooltip.tooltip-above::before {
      top: auto;
      bottom: -6px;
      border-bottom: none;
      border-top: 6px solid #1f2937;
    }

    /* 农历显示样式 */
    .lunar-display {
      font-size: 0.75rem;
      color: #6366f1;
      margin-top: 2px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .lunar-display.show {
      opacity: 1;
    }
    /* 自定义日期选择器样式 */
    .hidden {
      display: none !important;
    }
    
    .custom-date-picker {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      border-radius: 12px;
      min-width: 380px;
    }
    
    .custom-date-picker .calendar-day {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 60px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      padding: 4px;
      font-size: 14px;
    }
    
    .custom-date-picker .calendar-day:hover {
      background-color: #e0e7ff;
      transform: scale(1.05);
    }
    
    .custom-date-picker .calendar-day.selected {
      background-color: #6366f1;
      color: white;
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    }
    
    .custom-date-picker .calendar-day.today {
      background-color: #e0e7ff;
      color: #6366f1;
      font-weight: 600;
      border: 2px solid #6366f1;
    }
    
    .custom-date-picker .calendar-day.other-month {
      color: #d1d5db;
    }
    
    .custom-date-picker .calendar-day .lunar-text {
      font-size: 11px;
      line-height: 1.2;
      margin-top: 3px;
      opacity: 0.85;
      text-align: center;
      font-weight: 500;
    }
    
    .custom-date-picker .calendar-day.selected .lunar-text {
      color: rgba(255, 255, 255, 0.9);
    }
    
    .custom-date-picker .calendar-day.today .lunar-text {
      color: #6366f1;
    }
    
    /* 月份和年份选择器样式 */
    .month-option, .year-option {
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }
    
    .month-option:hover, .year-option:hover {
      background-color: #e0e7ff !important;
      border-color: #6366f1;
      color: #6366f1;
    }
    
    .month-option.selected, .year-option.selected {
      background-color: #6366f1 !important;
      color: white;
      border-color: #6366f1;
    }
    
    .lunar-toggle {
      display: inline-flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 0.875rem;
    }
    .lunar-toggle input[type="checkbox"] {
      margin-right: 6px;
    }

    /* 表格布局优化 */
    .table-container {
      width: 100%;
      overflow: visible;
    }

    .table-container table {
      table-layout: fixed;
      width: 100%;
    }

    /* 防止表格内容溢出 */
    .table-container td {
      overflow: hidden;
      word-wrap: break-word;
    }

    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* 响应式优化 */
    .responsive-table { table-layout: fixed; width: 100%; }
    .td-content-wrapper { word-wrap: break-word; white-space: normal; text-align: left; width: 100%; }
    .td-content-wrapper > * { text-align: left; } /* Align content left within the wrapper */

    @media (max-width: 767px) {
      .table-container { overflow-x: initial; } /* Override previous setting */
      .responsive-table thead { display: none; }
      .responsive-table tbody, .responsive-table tr, .responsive-table td { display: block; width: 100%; }
      .responsive-table tr { margin-bottom: 1.5rem; border: 1px solid #ddd; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; }
      .responsive-table td { display: flex; justify-content: flex-start; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #eee; }
      .responsive-table td:last-of-type { border-bottom: none; }
      .responsive-table td:before { content: attr(data-label); font-weight: 600; text-align: left; padding-right: 1rem; color: #374151; white-space: nowrap; }
      .action-buttons-wrapper { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: flex-end; }
      
      .notes-container, .hover-container {
        max-width: 180px; /* Adjust for new layout */
        text-align: right;
      }
      .td-content-wrapper .notes-text {
        text-align: right;
      }
     }
    @media (max-width: 767px) {
      #systemTimeDisplay {
        display: none !important;
      }
    }
    @media (min-width: 768px) {
      .table-container {
        overflow: visible;
      }
      /* .td-content-wrapper is aligned left by default */
    }

    /* Toast 样式 */
    .toast {
      position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px;
      color: white; font-weight: 500; z-index: 1000; transform: translateX(400px);
      transition: all 0.3s ease-in-out; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .toast.show { transform: translateX(0); }
    .toast.success { background-color: #10b981; }
    .toast.error { background-color: #ef4444; }
    .toast.info { background-color: #3b82f6; }
    .toast.warning { background-color: #f59e0b; }
  </style>
${DARK_MODE_SNIPPET}</head>

<body class="bg-gray-100 min-h-screen">
  <div id="toast-container"></div>

  <nav class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <i class="fas fa-calendar-check text-indigo-600 text-2xl mr-2"></i>
          <span class="font-bold text-xl text-gray-800">订阅管理系统</span>
          <span id="systemTimeDisplay" class="ml-4 text-base text-indigo-600 font-normal"></span>
        </div>
        <div class="flex items-center space-x-4">
          <a href="/admin/dashboard" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-chart-line mr-1"></i>仪表盘
          </a>
          <a href="/admin" class="text-indigo-600 border-b-2 border-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-list mr-1"></i>订阅列表
          </a>
          <a href="/admin/config" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-cog mr-1"></i>系统配置
          </a>
          <a href="/api/logout" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-sign-out-alt mr-1"></i>退出登录
          </a>
        </div>
      </div>
    </div>
  </nav>
  
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">订阅列表</h2>
        <p class="text-sm text-gray-500 mt-1">使用搜索与分类快速定位订阅，开启农历显示可同步查看农历日期</p>
      </div>
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:flex-1 lg:max-w-2xl">
          <div class="relative flex-1 min-w-[200px] lg:max-w-md">
            <input type="text" id="searchKeyword" placeholder="搜索名称、类型或备注..." class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <i class="fas fa-search"></i>
            </span>
          </div>
          <div class="sm:w-44 lg:w-40">
            <select id="categoryFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
              <option value="">全部分类</option>
            </select>
          </div>
        </div>
        <div class="flex items-center space-x-3 lg:space-x-4">
        <label class="lunar-toggle">
          <input type="checkbox" id="listShowLunar" class="form-checkbox h-4 w-4 text-indigo-600 shrink-0">
          <span class="text-gray-700">显示农历</span>
        </label>
        <button id="addSubscriptionBtn" class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium flex items-center shrink-0">
          <i class="fas fa-plus mr-2"></i>添加新订阅
        </button>
      </div>
      </div>
    </div>
    
    <div class="table-container bg-white rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full divide-y divide-gray-200 responsive-table">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="width: 23%;">
                名称
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="width: 13%;">
                类型
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="width: 18%;">
                到期时间 <i class="fas fa-sort-up ml-1 text-indigo-500" title="按到期时间升序排列"></i>
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="width: 10%;">
                金额
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="width: 13%;">
                提醒设置
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="width: 10%;">
                状态
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="width: 13%;">
                操作
              </th>
            </tr>
          </thead>
        <tbody id="subscriptionsBody" class="bg-white divide-y divide-gray-200">
        </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- 添加/编辑订阅的模态框 -->
  <div id="subscriptionModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 modal-container hidden flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
      <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
        <div class="flex items-center justify-between">
          <h3 id="modalTitle" class="text-lg font-medium text-gray-900">添加新订阅</h3>
          <button id="closeModal" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
      </div>
      
      <form id="subscriptionForm" class="p-6 space-y-6">
        <input type="hidden" id="subscriptionId">
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">订阅名称 *</label>
            <input type="text" id="name" required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <div class="error-message text-red-500" data-for="reminderValue"></div>
          </div>
          
          <div>
            <label for="customType" class="block text-sm font-medium text-gray-700 mb-1">订阅类型</label>
            <input type="text" id="customType" list="customTypeList" placeholder="选择或输入自定义类型"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <datalist id="customTypeList">
              <option value="流媒体">
              <option value="视频平台">
              <option value="音乐平台">
              <option value="云服务">
              <option value="软件订阅">
              <option value="域名">
              <option value="服务器">
              <option value="会员服务">
              <option value="学习平台">
              <option value="健身/运动">
              <option value="游戏">
              <option value="新闻/杂志">
              <option value="生日">
              <option value="纪念日">
              <option value="其他">
            </datalist>
            <div class="error-message text-red-500"></div>
          </div>

          <div>
            <label for="category" class="block text-sm font-medium text-gray-700 mb-1">分类标签</label>
            <input type="text" id="category" list="categoryList" placeholder="选择或输入自定义标签"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <datalist id="categoryList">
              <option value="个人">
              <option value="家庭">
              <option value="工作">
              <option value="公司">
              <option value="娱乐">
              <option value="学习">
              <option value="开发">
              <option value="生产力">
              <option value="社交">
              <option value="健康">
              <option value="财务">
            </datalist>
            <p class="mt-1 text-xs text-gray-500">可输入多个标签并使用"/"分隔，便于筛选和统计</p>
            <div class="error-message text-red-500"></div>
          </div>
        </div>

        <!-- 金额 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            费用设置
            <span class="text-gray-400 text-xs ml-1">可选</span>
          </label>
          <div class="flex space-x-2">
            <div class="w-1/3">
              <select id="currency" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                <option value="CNY" selected>CNY (¥)</option>
                <option value="USD">USD ($)</option>
                <option value="HKD">HKD (HK$)</option>
                <option value="TWD">TWD (NT$)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="KRW">KRW (₩)</option>
              </select>
            </div>
            <div class="relative w-2/3">
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                placeholder="例如: 15.00"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <p class="mt-1 text-xs text-gray-500">用于统计支出和生成仪表盘</p>
        </div>

        <div class="mb-4 flex items-center space-x-6">
          <label class="lunar-toggle">
            <input type="checkbox" id="showLunar" class="form-checkbox h-4 w-4 text-indigo-600">
            <span class="text-gray-700">显示农历日期</span>
          </label>
          <label class="lunar-toggle">
            <input type="checkbox" id="useLunar" class="form-checkbox h-4 w-4 text-indigo-600">
            <span class="text-gray-700">周期按农历</span>
          </label>
        </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="md:col-span-2">
            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <div class="relative">
              <input type="text" id="startDate"
                class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="YYYY-MM-DD 或点击右侧图标选择">
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <i class="fas fa-calendar text-gray-400"></i>
              </div>
                              <div id="startDatePicker" class="custom-date-picker hidden absolute top-full left-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg p-6 min-w-[380px]">
                  <div class="flex justify-between items-center mb-4">
                    <button type="button" id="startDatePrevMonth" class="text-gray-600 hover:text-gray-800">
                      <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="flex items-center space-x-2">
                      <span id="startDateMonth" class="font-medium text-gray-900 cursor-pointer hover:text-indigo-600">1月</span>
                      <span class="text-gray-400">|</span>
                      <span id="startDateYear" class="font-medium text-gray-900 cursor-pointer hover:text-indigo-600">2024</span>
                    </div>
                    <button type="button" id="startDateNextMonth" class="text-gray-600 hover:text-gray-800">
                      <i class="fas fa-chevron-right"></i>
                    </button>
                  </div>
                  
                  <!-- 月份选择器 -->
                  <div id="startDateMonthPicker" class="hidden mb-4">
                    <div class="flex justify-between items-center mb-3">
                      <span class="font-medium text-gray-900">选择月份</span>
                      <button type="button" id="startDateBackToCalendar" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                      <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="0">1月</button>
                      <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="1">2月</button>
                      <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="2">3月</button>
                      <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="3">4月</button>
                      <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="4">5月</button>
                      <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="5">6月</button>
                      <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="6">7月</button>
                      <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="7">8月</button>
                      <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="8">9月</button>
                      <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="9">10月</button>
                      <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="10">11月</button>
                      <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="11">12月</button>
                    </div>
                  </div>
                  
                  <!-- 年份选择器 -->
                  <div id="startDateYearPicker" class="hidden mb-4">
                    <div class="flex justify-between items-center mb-3">
                      <span class="font-medium text-gray-900">选择年份</span>
                      <button type="button" id="startDateBackToCalendarFromYear" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                    <div class="flex justify-between items-center mb-3">
                      <button type="button"  id="startDatePrevYearDecade" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-chevron-left"></i>
                      </button>
                      <span id="startDateYearRange" class="font-medium text-gray-900">2020-2029</span>
                      <button type="button"  id="startDateNextYearDecade" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-chevron-right"></i>
                      </button>
                    </div>
                    <div id="startDateYearGrid" class="grid grid-cols-3 gap-2">
                      <!-- 年份按钮将通过JavaScript动态生成 -->
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-7 gap-2 mb-3">
                    <div class="text-center text-sm font-semibold text-gray-600 py-2">日</div>
                    <div class="text-center text-sm font-semibold text-gray-600 py-2">一</div>
                    <div class="text-center text-sm font-semibold text-gray-600 py-2">二</div>
                    <div class="text-center text-sm font-semibold text-gray-600 py-2">三</div>
                    <div class="text-center text-sm font-semibold text-gray-600 py-2">四</div>
                    <div class="text-center text-sm font-semibold text-gray-600 py-2">五</div>
                    <div class="text-center text-sm font-semibold text-gray-600 py-2">六</div>
                  </div>
                  <div id="startDateCalendar" class="grid grid-cols-7 gap-2"></div>
                  
                  <!-- 回到今天按钮 -->
                  <div class="mt-4 pt-3 border-t border-gray-200">
                    <button type="button" id="startDateGoToToday" class="w-full px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md">
                      <i class="fas fa-calendar-day mr-2"></i>回到今天
                    </button>
                  </div>
                </div>
            </div>
            <div id="startDateLunar" class="lunar-display"></div>
            <div class="error-message text-red-500"></div>
          </div>
          
          <div>
            <label for="periodValue" class="block text-sm font-medium text-gray-700 mb-1">周期数值 *</label>
            <input type="number" id="periodValue" min="1" value="1" required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <div class="error-message text-red-500"></div>
          </div>
          
          <div>
            <label for="periodUnit" class="block text-sm font-medium text-gray-700 mb-1">周期单位 *</label>
            <select id="periodUnit" required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              <option value="day">天</option>
              <option value="month" selected>月</option>
              <option value="year">年</option>
            </select>
            <div class="error-message text-red-500"></div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="expiryDate" class="block text-sm font-medium text-gray-700 mb-1">到期日期 *</label>
            <div class="relative">
              <input type="text" id="expiryDate" required
                class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="YYYY-MM-DD 或点击右侧图标选择">
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <i class="fas fa-calendar text-gray-400"></i>
              </div>
              <div id="expiryDatePicker" class="custom-date-picker hidden absolute top-full left-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg p-6 min-w-[380px]">
                <div class="flex justify-between items-center mb-4">
                  <button type="button" id="expiryDatePrevMonth" class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <div class="flex items-center space-x-2">
                    <span id="expiryDateMonth" class="font-medium text-gray-900 cursor-pointer hover:text-indigo-600">1月</span>
                    <span class="text-gray-400">|</span>
                    <span id="expiryDateYear" class="font-medium text-gray-900 cursor-pointer hover:text-indigo-600">2024</span>
                  </div>
                  <button type="button" id="expiryDateNextMonth" class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
                
                <!-- 月份选择器 -->
                <div id="expiryDateMonthPicker" class="hidden mb-4">
                  <div class="flex justify-between items-center mb-3">
                    <span class="font-medium text-gray-900">选择月份</span>
                    <button type="button" id="expiryDateBackToCalendar" class="text-gray-600 hover:text-gray-800">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="0">1月</button>
                    <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="1">2月</button>
                    <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="2">3月</button>
                    <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="3">4月</button>
                    <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="4">5月</button>
                    <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="5">6月</button>
                    <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="6">7月</button>
                    <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="7">8月</button>
                    <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="8">9月</button>
                    <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="9">10月</button>
                    <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="10">11月</button>
                    <button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="11">12月</button>
                  </div>
                </div>
                
                <!-- 年份选择器 -->
                <div id="expiryDateYearPicker" class="hidden mb-4">
                  <div class="flex justify-between items-center mb-3">
                    <span class="font-medium text-gray-900">选择年份</span>
                    <button type="button" id="expiryDateBackToCalendarFromYear" class="text-gray-600 hover:text-gray-800">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <div class="flex justify-between items-center mb-3">
                    <button  type="button" id="expiryDatePrevYearDecade" class="text-gray-600 hover:text-gray-800">
                      <i class="fas fa-chevron-left"></i>
                    </button>
                    <span id="expiryDateYearRange" class="font-medium text-gray-900">2020-2029</span>
                    <button  type="button"  id="expiryDateNextYearDecade" class="text-gray-600 hover:text-gray-800">
                      <i class="fas fa-chevron-right"></i>
                    </button>
                  </div>
                  <div id="expiryDateYearGrid" class="grid grid-cols-3 gap-2">
                    <!-- 年份按钮将通过JavaScript动态生成 -->
                  </div>
                </div>
                
                <div class="grid grid-cols-7 gap-2 mb-3">
                  <div class="text-center text-sm font-semibold text-gray-600 py-2">日</div>
                  <div class="text-center text-sm font-semibold text-gray-600 py-2">一</div>
                  <div class="text-center text-sm font-semibold text-gray-600 py-2">二</div>
                  <div class="text-center text-sm font-semibold text-gray-600 py-2">三</div>
                  <div class="text-center text-sm font-semibold text-gray-600 py-2">四</div>
                  <div class="text-center text-sm font-semibold text-gray-600 py-2">五</div>
                  <div class="text-center text-sm font-semibold text-gray-600 py-2">六</div>
                </div>
                <div id="expiryDateCalendar" class="grid grid-cols-7 gap-2"></div>
                
                <!-- 回到今天按钮 -->
                <div class="mt-4 pt-3 border-t border-gray-200">
                  <button type="button" id="expiryDateGoToToday" class="w-full px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md">
                    <i class="fas fa-calendar-day mr-2"></i>回到今天
                  </button>
                </div>
              </div>
            </div>
            <div id="expiryDateLunar" class="lunar-display"></div>
            <div class="error-message text-red-500"></div>
            <div class="flex justify-end mt-2">
              <button type="button" id="calculateExpiryBtn" 
                class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                <i class="fas fa-calculator mr-2"></i>自动计算到期日期
              </button>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="reminderValue" class="block text-sm font-medium text-gray-700 mb-1">提醒提前量</label>
            <div class="flex space-x-3">
              <input type="number" id="reminderValue" min="0" value="7"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              <select id="reminderUnit"
                class="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                <option value="day" selected>天</option>
                <option value="hour">小时</option>
              </select>
            </div>
            <p class="text-xs text-gray-500 mt-1">0 = 仅在到期时提醒；选择“小时”需要将 Worker 定时任务调整为小时级执行</p>
            <div class="error-message text-red-500"></div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">选项设置</label>
            <div class="space-y-2">
              <label class="inline-flex items-center">
                <input type="checkbox" id="isActive" checked 
                  class="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">启用订阅</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" id="autoRenew" checked 
                  class="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">自动续订</span>
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea id="notes" rows="3" placeholder="可添加相关备注信息..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          <div class="error-message text-red-500"></div>
        </div>
        
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button type="button" id="cancelBtn" 
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            取消
          </button>
          <button type="submit" 
            class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-save mr-2"></i>保存
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    // 农历转换工具函数 - 前端版本
    const lunarCalendar = {
      // 农历数据 (1900-2100年)
      lunarInfo: [
        0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
        0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
        0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
        0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
        0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
        0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
        0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
        0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
        0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
        0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
        0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
        0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
        0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
        0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
        0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
        0x14b63, 0x09370, 0x14a38, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x1a978, 0x16aa0, 0x0a6c0, // 2050-2059 (修正2057: 0x1a978)
        0x0aa60, 0x16d63, 0x0d260, 0x0d950, 0x0d554, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, // 2060-2069
        0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, // 2070-2079
        0x15176, 0x052b0, 0x0a930, 0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, // 2080-2089
        0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x1a4bb, 0x0a4d0, 0x0d0b0, // 2090-2099 (修正2099: 0x0d0b0)
        0x0d250 // 2100
      ],

      // 天干地支
      gan: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
      zhi: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],

      // 农历月份
      months: ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'],

      // 农历日期
      days: ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
             '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
             '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'],

      // 获取农历年天数
      lunarYearDays: function(year) {
        let sum = 348;
        for (let i = 0x8000; i > 0x8; i >>= 1) {
          sum += (this.lunarInfo[year - 1900] & i) ? 1 : 0;
        }
        return sum + this.leapDays(year);
      },

      // 获取闰月天数
      leapDays: function(year) {
        if (this.leapMonth(year)) {
          return (this.lunarInfo[year - 1900] & 0x10000) ? 30 : 29;
        }
        return 0;
      },

      // 获取闰月月份
      leapMonth: function(year) {
        return this.lunarInfo[year - 1900] & 0xf;
      },

      // 获取农历月天数
      monthDays: function(year, month) {
        return (this.lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29;
      },

      // 公历转农历
      solar2lunar: function(year, month, day) {
        if (year < 1900 || year > 2100) return null;

        const baseDate = Date.UTC(1900, 0, 31);
        const objDate = Date.UTC(year, month - 1, day);
        //let offset = Math.floor((objDate - baseDate) / 86400000);
        let offset = Math.round((objDate - baseDate) / 86400000);


        let temp = 0;
        let lunarYear = 1900;

        for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
          temp = this.lunarYearDays(lunarYear);
          offset -= temp;
        }

        if (offset < 0) {
          offset += temp;
          lunarYear--;
        }

        let lunarMonth = 1;
        let leap = this.leapMonth(lunarYear);
        let isLeap = false;

        for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
          if (leap > 0 && lunarMonth === (leap + 1) && !isLeap) {
            --lunarMonth;
            isLeap = true;
            temp = this.leapDays(lunarYear);
          } else {
            temp = this.monthDays(lunarYear, lunarMonth);
          }

          if (isLeap && lunarMonth === (leap + 1)) isLeap = false;
          offset -= temp;
        }

        if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
          if (isLeap) {
            isLeap = false;
          } else {
            isLeap = true;
            --lunarMonth;
          }
        }

        if (offset < 0) {
          offset += temp;
          --lunarMonth;
        }

        const lunarDay = offset + 1;

        // 生成农历字符串
        const ganIndex = (lunarYear - 4) % 10;
        const zhiIndex = (lunarYear - 4) % 12;
        const yearStr = this.gan[ganIndex] + this.zhi[zhiIndex] + '年';
        const monthStr = (isLeap ? '闰' : '') + this.months[lunarMonth - 1] + '月';
        const dayStr = this.days[lunarDay - 1];

        return {
          year: lunarYear,
          month: lunarMonth,
          day: lunarDay,
          isLeap: isLeap,
          yearStr: yearStr,
          monthStr: monthStr,
          dayStr: dayStr,
          fullStr: yearStr + monthStr + dayStr
        };
      }
    };
	

// 新增修改，农历转公历（简化，适用1900-2100年）
function lunar2solar(lunar) {
  for (let y = lunar.year - 1; y <= lunar.year + 1; y++) {
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 31; d++) {
        const date = new Date(y, m - 1, d);
        if (date.getFullYear() !== y || date.getMonth() + 1 !== m || date.getDate() !== d) continue;
        const l = lunarCalendar.solar2lunar(y, m, d);
        if (
          l &&
          l.year === lunar.year &&
          l.month === lunar.month &&
          l.day === lunar.day &&
          l.isLeap === lunar.isLeap
        ) {
          return { year: y, month: m, day: d };
        }
      }
    }
  }
  return null;
}

// 新增修改，农历加周期，前期版本
function addLunarPeriod(lunar, periodValue, periodUnit) {
  let { year, month, day, isLeap } = lunar;
  if (periodUnit === 'year') {
    year += periodValue;
    const leap = lunarCalendar.leapMonth(year);
    if (isLeap && leap === month) {
      isLeap = true;
    } else {
      isLeap = false;
    }
  } else if (periodUnit === 'month') {
    let totalMonths = (year - 1900) * 12 + (month - 1) + periodValue;
    year = Math.floor(totalMonths / 12) + 1900;
    month = (totalMonths % 12) + 1;
    const leap = lunarCalendar.leapMonth(year);
    if (isLeap && leap === month) {
      isLeap = true;
    } else {
      isLeap = false;
    }
  } else if (periodUnit === 'day') {
    const solar = lunar2solar(lunar);
    const date = new Date(solar.year, solar.month - 1, solar.day + periodValue);
    return lunarCalendar.solar2lunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }
  let maxDay = isLeap
    ? lunarCalendar.leapDays(year)
    : lunarCalendar.monthDays(year, month);
  let targetDay = Math.min(day, maxDay);
  while (targetDay > 0) {
    let solar = lunar2solar({ year, month, day: targetDay, isLeap });
    if (solar) {
      return { year, month, day: targetDay, isLeap };
    }
    targetDay--;
  }
  return { year, month, day, isLeap };
}

// 前端版本的 lunarBiz 对象
const lunarBiz = {
  // 农历加周期，返回新的农历日期对象
  addLunarPeriod(lunar, periodValue, periodUnit) {
    return addLunarPeriod(lunar, periodValue, periodUnit);
  },
  // 农历转公历（遍历法，适用1900-2100年）
  lunar2solar(lunar) {
    return lunar2solar(lunar);
  },
  // 距离农历日期还有多少天
  daysToLunar(lunar) {
    const solar = lunarBiz.lunar2solar(lunar);
    const date = new Date(solar.year, solar.month - 1, solar.day);
    const now = new Date();
    return Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  }
};



    // 农历显示相关函数
    function updateLunarDisplay(dateInputId, lunarDisplayId) {
      const dateInput = document.getElementById(dateInputId);
      const lunarDisplay = document.getElementById(lunarDisplayId);
      const showLunar = document.getElementById('showLunar');

      if (!dateInput || !lunarDisplay) {
        return;
      }

      if (!dateInput.value || !showLunar || !showLunar.checked) {
        lunarDisplay.classList.remove('show');
        return;
      }

      // 【修复】直接解析字符串 "YYYY-MM-DD"，避免 new Date() 带来的时区偏移导致日期少一天
      const parts = dateInput.value.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      
      const lunar = lunarCalendar.solar2lunar(year, month, day);

      if (lunar) {
        lunarDisplay.textContent = '农历：' + lunar.fullStr;
        lunarDisplay.classList.add('show');
      } else {
        lunarDisplay.classList.remove('show');
      }
    }

    function toggleLunarDisplay() {
      const showLunar = document.getElementById('showLunar');
      if (!showLunar) {
        return;
      }
      
      updateLunarDisplay('startDate', 'startDateLunar');
      updateLunarDisplay('expiryDate', 'expiryDateLunar');

      // 保存用户偏好
      localStorage.setItem('showLunar', showLunar.checked);
    }

    function loadLunarPreference() {
      const showLunar = document.getElementById('showLunar');
      if (!showLunar) {
        return;
      }
      
      const saved = localStorage.getItem('showLunar');
      if (saved !== null) {
        showLunar.checked = saved === 'true';
      } else {
        showLunar.checked = true; // 默认显示
      }
      toggleLunarDisplay();
    }

    function handleListLunarToggle() {
      const listShowLunar = document.getElementById('listShowLunar');
      // 保存用户偏好
      localStorage.setItem('showLunar', listShowLunar.checked);
      // 重新加载订阅列表以应用农历显示设置
      renderSubscriptionTable();
    }

    function showToast(message, type = 'success', duration = 3000) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      
      const icon = type === 'success' ? 'check-circle' :
                   type === 'error' ? 'exclamation-circle' :
                   type === 'warning' ? 'exclamation-triangle' : 'info-circle';
      
      toast.innerHTML = '<div class="flex items-center"><i class="fas fa-' + icon + ' mr-2"></i><span>' + message + '</span></div>';
      
      container.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 100);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (container.contains(toast)) {
            container.removeChild(toast);
          }
        }, 300);
      }, duration);
    }

    function showFieldError(fieldId, message) {
      const field = document.getElementById(fieldId);
      let errorDiv = field.parentElement ? field.parentElement.querySelector('.error-message') : null;
      if (!errorDiv) {
        errorDiv = document.querySelector('.error-message[data-for="' + fieldId + '"]');
      }
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        field.classList.add('border-red-500');
      }
    }

    function clearFieldErrors() {
      document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
      });
      document.querySelectorAll('.border-red-500').forEach(el => {
        el.classList.remove('border-red-500');
      });
    }

    function validateForm() {
      clearFieldErrors();
      let isValid = true;

      const name = document.getElementById('name').value.trim();
      if (!name) {
        showFieldError('name', '请输入订阅名称');
        isValid = false;
      }

      const periodValue = document.getElementById('periodValue').value;
      if (!periodValue || periodValue < 1) {
        showFieldError('periodValue', '周期数值必须大于0');
        isValid = false;
      }

      const expiryDate = document.getElementById('expiryDate').value;
      if (!expiryDate) {
        showFieldError('expiryDate', '请选择到期日期');
        isValid = false;
      }

      const reminderValueField = document.getElementById('reminderValue');
      const reminderValue = reminderValueField.value;
      if (reminderValue === '' || Number(reminderValue) < 0) {
        showFieldError('reminderValue', '提醒值不能为负数');
        isValid = false;
      }

      return isValid;
    }

    // 创建带悬浮提示的文本元素
    function createHoverText(text, maxLength = 30, className = 'text-sm text-gray-900') {
      if (!text || text.length <= maxLength) {
        return '<div class="' + className + '">' + text + '</div>';
      }

      const truncated = text.substring(0, maxLength) + '...';
      return '<div class="hover-container">' +
        '<div class="hover-text ' + className + '" data-full-text="' + text.replace(/"/g, '&quot;') + '">' +
          truncated +
        '</div>' +
        '<div class="hover-tooltip"></div>' +
      '</div>';
    }

    const categorySeparator = /[\/,，\s]+/;
    let subscriptionsCache = [];
    let searchDebounceTimer = null;

    function normalizeCategoryTokens(category = '') {
      return category
        .split(categorySeparator)
        .map(token => token.trim())
        .filter(token => token.length > 0);
    }

    function populateCategoryFilter(subscriptions) {
      const select = document.getElementById('categoryFilter');
      if (!select) {
        return;
      }

      const previousValue = select.value;
      const categories = new Set();

      (subscriptions || []).forEach(subscription => {
        normalizeCategoryTokens(subscription.category).forEach(token => categories.add(token));
      });

      const sorted = Array.from(categories).sort((a, b) => a.localeCompare(b, 'zh-CN'));
      select.innerHTML = '';

      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '全部分类';
      select.appendChild(defaultOption);

      sorted.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
      });

      // URL 参数预设分类（如 /admin?category=视频，供仪表盘跳转使用），优先于历史选择
      const presetCategory = typeof window.__presetCategory === 'string' ? window.__presetCategory : '';
      const presetMatch = presetCategory ? sorted.find(item => item.toLowerCase() === presetCategory.toLowerCase()) : '';

      if (presetMatch) {
        select.value = presetMatch;
        window.__presetCategory = '';
      } else if (previousValue && sorted.map(item => item.toLowerCase()).includes(previousValue.toLowerCase())) {
        select.value = previousValue;
      } else {
        select.value = '';
      }
    }

    function getReminderSettings(subscription) {
      const fallbackDays = subscription.reminderDays !== undefined ? subscription.reminderDays : 7;
      let unit = subscription.reminderUnit || '';
      let value = subscription.reminderValue;

      if (unit !== 'hour') {
        unit = 'day';
      }

      if (unit === 'hour' && (value === undefined || value === null || isNaN(value))) {
        value = subscription.reminderHours !== undefined ? subscription.reminderHours : 0;
      }

      if (value === undefined || value === null || isNaN(value)) {
        value = fallbackDays;
      }

      value = Number(value);

      return {
        unit,
        value,
        displayText: unit === 'hour' ? '提前' + value + '小时' : '提前' + value + '天'
      };
    }

    function attachHoverListeners() {
      function positionTooltip(element, tooltip) {
        const rect = element.getBoundingClientRect();
        const tooltipHeight = 100;
        const viewportHeight = window.innerHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        let top = rect.bottom + scrollTop + 8;
        let left = rect.left;

        if (rect.bottom + tooltipHeight > viewportHeight) {
          top = rect.top + scrollTop - tooltipHeight - 8;
          tooltip.style.transform = 'translateY(10px)';
          tooltip.classList.add('tooltip-above');
        } else {
          tooltip.style.transform = 'translateY(-10px)';
          tooltip.classList.remove('tooltip-above');
        }

        const maxLeft = window.innerWidth - 320 - 20;
        if (left > maxLeft) {
          left = maxLeft;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
      }

      document.querySelectorAll('.notes-text').forEach(notesElement => {
        const fullNotes = notesElement.getAttribute('data-full-notes');
        const tooltip = notesElement.parentElement.querySelector('.notes-tooltip');

        if (fullNotes && tooltip) {
          notesElement.addEventListener('mouseenter', () => {
            tooltip.textContent = fullNotes;
            positionTooltip(notesElement, tooltip);
            tooltip.classList.add('show');
          });

          notesElement.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
          });

          window.addEventListener('scroll', () => {
            if (tooltip.classList.contains('show')) {
              tooltip.classList.remove('show');
            }
          }, { passive: true });
        }
      });

      document.querySelectorAll('.hover-text').forEach(hoverElement => {
        const fullText = hoverElement.getAttribute('data-full-text');
        const tooltip = hoverElement.parentElement.querySelector('.hover-tooltip');

        if (fullText && tooltip) {
          hoverElement.addEventListener('mouseenter', () => {
            tooltip.textContent = fullText;
            positionTooltip(hoverElement, tooltip);
            tooltip.classList.add('show');
          });

          hoverElement.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
          });

          window.addEventListener('scroll', () => {
            if (tooltip.classList.contains('show')) {
              tooltip.classList.remove('show');
            }
          }, { passive: true });
        }
      });
    }

    function renderSubscriptionTable() {
      const tbody = document.getElementById('subscriptionsBody');
      if (!tbody) {
        return;
      }

      const listShowLunar = document.getElementById('listShowLunar');
      const showLunar = listShowLunar ? listShowLunar.checked : false;
      const searchInput = document.getElementById('searchKeyword');
      const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const categorySelect = document.getElementById('categoryFilter');
      const selectedCategory = categorySelect ? categorySelect.value.trim().toLowerCase() : '';

      let filtered = Array.isArray(subscriptionsCache) ? [...subscriptionsCache] : [];

      if (selectedCategory) {
        filtered = filtered.filter(subscription =>
          normalizeCategoryTokens(subscription.category).some(token => token.toLowerCase() === selectedCategory)
        );
      }

      if (keyword) {
        filtered = filtered.filter(subscription => {
          const haystack = [
            subscription.name,
            subscription.customType,
            subscription.notes,
            subscription.category
          ].filter(Boolean).join(' ').toLowerCase();
          return haystack.includes(keyword);
        });
      }

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">没有符合条件的订阅</td></tr>';
        return;
      }

      filtered.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      tbody.innerHTML = '';

      const currentTime = new Date();

      filtered.forEach(subscription => {
        const row = document.createElement('tr');
        row.className = subscription.isActive === false ? 'hover:bg-gray-50 bg-gray-100' : 'hover:bg-gray-50';

        const calendarTypeHtml = subscription.useLunar
          ? '<div class="text-xs text-purple-600 mt-1">日历类型：农历</div>'
          : '<div class="text-xs text-gray-600 mt-1">日历类型：公历</div>';

        const expiryDate = new Date(subscription.expiryDate);
        const currentDtf = new Intl.DateTimeFormat('en-US', {
          timeZone: globalTimezone,
          hour12: false,
          year: 'numeric', month: '2-digit', day: '2-digit'
        });
        const currentParts = currentDtf.formatToParts(currentTime);
        const getCurrent = type => Number(currentParts.find(x => x.type === type).value);
        const currentDateInTimezone = Date.UTC(getCurrent('year'), getCurrent('month') - 1, getCurrent('day'), 0, 0, 0);

        const expiryDtf = new Intl.DateTimeFormat('en-US', {
          timeZone: globalTimezone,
          hour12: false,
          year: 'numeric', month: '2-digit', day: '2-digit'
        });
        const expiryParts = expiryDtf.formatToParts(expiryDate);
        const getExpiry = type => Number(expiryParts.find(x => x.type === type).value);
        const expiryDateInTimezone = Date.UTC(getExpiry('year'), getExpiry('month') - 1, getExpiry('day'), 0, 0, 0);

        const daysDiff = Math.round((expiryDateInTimezone - currentDateInTimezone) / (1000 * 60 * 60 * 24));
        const diffMs = expiryDate.getTime() - currentTime.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        const reminder = getReminderSettings(subscription);
        const isSoon = reminder.unit === 'hour'
          ? diffHours >= 0 && diffHours <= reminder.value
          : daysDiff >= 0 && daysDiff <= reminder.value;

        let statusHtml = '';
        if (!subscription.isActive) {
          statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-gray-500"><i class="fas fa-pause-circle mr-1"></i>已停用</span>';
        } else if (daysDiff < 0) {
          statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-red-500"><i class="fas fa-exclamation-circle mr-1"></i>已过期</span>';
        } else if (isSoon) {
          statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-yellow-500"><i class="fas fa-exclamation-triangle mr-1"></i>即将到期</span>';
        } else {
          statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-green-500"><i class="fas fa-check-circle mr-1"></i>正常</span>';
        }

        let periodText = '';
        if (subscription.periodValue && subscription.periodUnit) {
          const unitMap = { day: '天', month: '月', year: '年' };
          periodText = subscription.periodValue + ' ' + (unitMap[subscription.periodUnit] || subscription.periodUnit);
        }

        const autoRenewIcon = subscription.autoRenew !== false
          ? '<i class="fas fa-sync-alt text-blue-500 ml-1" title="自动续订"></i>'
          : '<i class="fas fa-ban text-gray-400 ml-1" title="不自动续订"></i>';

        let lunarExpiryText = '';
        let startLunarText = '';
        if (showLunar) {
          // 【修复】列表显示农历时，直接解析字符串年月日，避免 new Date() 时区偏移导致少一天
          const getLunarParts = (dateStr) => {
            if (!dateStr) return null;
            // 兼容 ISO 格式 (2025-07-25T00:00:00.000Z) 和 普通日期格式 (2025-07-25)
            const datePart = dateStr.split('T')[0]; 
            const parts = datePart.split('-');
            if (parts.length !== 3) return null;
            return {
              y: parseInt(parts[0], 10),
              m: parseInt(parts[1], 10),
              d: parseInt(parts[2], 10)
            };
          };

          const expiryParts = getLunarParts(subscription.expiryDate);
          if (expiryParts) {
             const lunarExpiry = lunarCalendar.solar2lunar(expiryParts.y, expiryParts.m, expiryParts.d);
             lunarExpiryText = lunarExpiry ? lunarExpiry.fullStr : '';
          }

          if (subscription.startDate) {
            const startParts = getLunarParts(subscription.startDate);
            if (startParts) {
               const lunarStart = lunarCalendar.solar2lunar(startParts.y, startParts.m, startParts.d);
               startLunarText = lunarStart ? lunarStart.fullStr : '';
            }
          }
        }

        let notesHtml = '';
        if (subscription.notes) {
          const notes = subscription.notes;
          if (notes.length > 50) {
            const truncatedNotes = notes.substring(0, 50) + '...';
            notesHtml = '<div class="notes-container">' +
              '<div class="notes-text text-xs text-gray-500" data-full-notes="' + notes.replace(/"/g, '&quot;') + '">' +
                truncatedNotes +
              '</div>' +
              '<div class="notes-tooltip"></div>' +
            '</div>';
          } else {
            notesHtml = '<div class="text-xs text-gray-500">' + notes + '</div>';
          }
        }

        const nameHtml = createHoverText(subscription.name, 20, 'text-sm font-medium text-gray-900');
        const typeHtml = createHoverText(subscription.customType || '其他', 15, 'text-sm text-gray-900');
        const periodHtml = periodText ? createHoverText('周期: ' + periodText, 20, 'text-xs text-gray-500 mt-1') : '';

        const categoryTokens = normalizeCategoryTokens(subscription.category);
        const categoryHtml = categoryTokens.length
          ? '<div class="flex flex-wrap gap-2 mt-2">' + categoryTokens.map(cat =>
              '<span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full"><i class="fas fa-tag mr-1"></i>' + cat + '</span>'
            ).join('') + '</div>'
          : '';

        function formatDateInTimezone(date, timezone) {
          return date.toLocaleDateString('zh-CN', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }

        const expiryDateText = formatDateInTimezone(new Date(subscription.expiryDate), globalTimezone);
        const lunarHtml = lunarExpiryText ? createHoverText('农历: ' + lunarExpiryText, 25, 'text-xs text-blue-600 mt-1') : '';

        let daysLeftText = '';
        if (diffMs < 0) {
          const absDays = Math.abs(daysDiff);
          if (absDays >= 1) {
            daysLeftText = '已过期' + absDays + '天';
          } else {
            const absHours = Math.ceil(Math.abs(diffHours));
            daysLeftText = '已过期' + absHours + '小时';
          }
        } else if (daysDiff >= 1) {
          daysLeftText = '还剩' + daysDiff + '天';
        } else {
          const hoursLeft = Math.max(0, Math.ceil(diffHours));
          daysLeftText = hoursLeft > 0 ? '约 ' + hoursLeft + ' 小时后到期' : '即将到期';
        }

        const startDateText = subscription.startDate
          ? '开始: ' + formatDateInTimezone(new Date(subscription.startDate), globalTimezone) + (startLunarText ? ' (' + startLunarText + ')' : '')
          : '';
        const startDateHtml = startDateText ? createHoverText(startDateText, 30, 'text-xs text-gray-500 mt-1') : '';

        const reminderExtra = reminder.value === 0
          ? '<div class="text-xs text-gray-500 mt-1">仅到期时提醒</div>'
          : (reminder.unit === 'hour' ? '<div class="text-xs text-gray-500 mt-1">小时级提醒</div>' : '');
        const reminderHtml = '<div><i class="fas fa-bell mr-1"></i>' + reminder.displayText + '</div>' + reminderExtra;

        const currencySymbols = {
          'CNY': '¥', 'USD': '$', 'HKD': 'HK$', 'TWD': 'NT$', 
          'JPY': '¥', 'EUR': '€', 'GBP': '£', 'KRW': '₩'
        };
        const currencySymbol = currencySymbols[subscription.currency] || '¥';

        const amountHtml = subscription.amount
          ? '<div class="flex items-center gap-1">' +
              '<span class="text-xs text-gray-500 font-bold">' + currencySymbol + '</span>' +
              '<span class="text-sm font-medium text-gray-900">' + subscription.amount.toFixed(2) + '</span>' +
            '</div>'
          : '<span class="text-xs text-gray-400">未设置</span>';

        row.innerHTML =
          '<td data-label="名称" class="px-4 py-3"><div class="td-content-wrapper">' +
            nameHtml +
            notesHtml +
          '</div></td>' +
          '<td data-label="类型" class="px-4 py-3"><div class="td-content-wrapper space-y-1">' +
            '<div class="flex items-center gap-1">' +
              '<i class="fas fa-layer-group text-gray-400"></i>' +
              typeHtml +
            '</div>' +
            (periodHtml ? '<div class="flex items-center gap-1">' + periodHtml + autoRenewIcon + '</div>' : '') +
            categoryHtml +
            calendarTypeHtml +
          '</div></td>' +
          '<td data-label="到期时间" class="px-4 py-3"><div class="td-content-wrapper">' +
            '<div class="text-sm text-gray-900">' + expiryDateText + '</div>' +
            lunarHtml +
            '<div class="text-xs text-gray-500 mt-1">' + daysLeftText + '</div>' +
            startDateHtml +
          '</div></td>' +
          '<td data-label="金额" class="px-4 py-3"><div class="td-content-wrapper">' +
            amountHtml +
          '</div></td>' +
          '<td data-label="提醒设置" class="px-4 py-3"><div class="td-content-wrapper">' +
            reminderHtml +
          '</div></td>' +
          '<td data-label="状态" class="px-4 py-3"><div class="td-content-wrapper">' + statusHtml + '</div></td>' +
          '<td data-label="操作" class="px-4 py-3">' +
            '<div class="action-buttons-wrapper">' +
              '<button class="edit btn-primary text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '"><i class="fas fa-edit mr-1"></i>编辑</button>' +
              '<button class="view-history bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '" title="查看支付历史"><i class="fas fa-history mr-1"></i>历史</button>' +
              '<button class="test-notify btn-info text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '"><i class="fas fa-paper-plane mr-1"></i>测试</button>' +
              '<button class="renew-now btn-success text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '" title="立即续订一个周期"><i class="fas fa-sync-alt mr-1"></i>续订</button>' +
              '<button class="delete btn-danger text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '"><i class="fas fa-trash-alt mr-1"></i>删除</button>' +
              (subscription.isActive
                ? '<button class="toggle-status btn-warning text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '" data-action="deactivate"><i class="fas fa-pause-circle mr-1"></i>停用</button>'
                : '<button class="toggle-status btn-success text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '" data-action="activate"><i class="fas fa-play-circle mr-1"></i>启用</button>') +
            '</div>' +
          '</td>';

        tbody.appendChild(row);
      });

      document.querySelectorAll('.edit').forEach(button => {
        button.addEventListener('click', editSubscription);
      });

      document.querySelectorAll('.delete').forEach(button => {
        button.addEventListener('click', deleteSubscription);
      });

      document.querySelectorAll('.toggle-status').forEach(button => {
        button.addEventListener('click', toggleSubscriptionStatus);
      });

      document.querySelectorAll('.test-notify').forEach(button => {
        button.addEventListener('click', testSubscriptionNotification);
      });

      document.querySelectorAll('.renew-now').forEach(button => {
        button.addEventListener('click', renewSubscriptionNow);
      });

      document.querySelectorAll('.view-history').forEach(button => {
        button.addEventListener('click', viewPaymentHistory);
      });

      attachHoverListeners();
    }

    const searchInput = document.getElementById('searchKeyword');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => renderSubscriptionTable(), 200);
      });
    }

    const categorySelect = document.getElementById('categoryFilter');
    if (categorySelect) {
      categorySelect.addEventListener('change', () => renderSubscriptionTable());
    }

    // 获取所有订阅并按到期时间排序
    async function loadSubscriptions(showLoading = true) {
      try {
        const listShowLunar = document.getElementById('listShowLunar');
        const saved = localStorage.getItem('showLunar');
        if (listShowLunar) {
          if (saved !== null) {
            listShowLunar.checked = saved === 'true';
          } else {
            listShowLunar.checked = true;
          }
        }

        const tbody = document.getElementById('subscriptionsBody');
        if (tbody && showLoading) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>加载中...</td></tr>';
        }

        const response = await fetch('/api/subscriptions');
        const data = await response.json();

        subscriptionsCache = Array.isArray(data) ? data : [];
        populateCategoryFilter(subscriptionsCache);
        renderSubscriptionTable();
      } catch (error) {
        console.error('加载订阅失败:', error);
        const tbody = document.getElementById('subscriptionsBody');
        if (tbody) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>加载失败，请刷新页面重试</td></tr>';
        }
        showToast('加载订阅列表失败', 'error');
      }
    }
    
    async function testSubscriptionNotification(e) {
        const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
        const id = button.dataset.id;
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>';
        button.disabled = true;

        try {
            const response = await fetch('/api/subscriptions/' + id + '/test-notify', { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                showToast(result.message || '测试通知已发送', 'success');
            } else {
                showToast(result.message || '测试通知发送失败', 'error');
            }
        } catch (error) {
            console.error('测试通知失败:', error);
            showToast('发送测试通知时发生错误', 'error');
        } finally {
            button.innerHTML = originalContent;
            button.disabled = false;
        }
    }

    async function renewSubscriptionNow(e) {
        const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
        const id = button.dataset.id;

        try {
            const response = await fetch('/api/subscriptions/' + id);
            const subscription = await response.json();
            showRenewFormModal(subscription);
        } catch (error) {
            console.error('获取订阅信息失败:', error);
            showToast('获取订阅信息时发生错误', 'error');
        }
    }

    function showRenewFormModal(subscription) {
        const today = new Date().toISOString().split('T')[0];
        
        // 获取当前到期日的显示文本
        let currentExpiryDisplay = '无';
        if (subscription.expiryDate) {
            const datePart = subscription.expiryDate.split('T')[0];
            
            currentExpiryDisplay = datePart;
            
            // 只有当订阅类型明确为“使用农历”时，才计算并显示农历日期文本
            if (subscription.useLunar) {
                try {
                    const parts = datePart.split('-');
                    const y = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10);
                    const d = parseInt(parts[2], 10);
                    
                    const lunarObj = lunarCalendar.solar2lunar(y, m, d);
                    if (lunarObj) {
                        // 统一格式
                        currentExpiryDisplay += ' (农历: ' + lunarObj.fullStr + ')';
                    }
                } catch (e) {
                    console.error('农历计算失败', e);
                }
            }
        }

        const defaultAmount = subscription.amount || 0;
        
        // 获取动态货币符号
        const currencySymbols = {
          'CNY': '¥', 'USD': '$', 'HKD': 'HK$', 'TWD': 'NT$', 
          'JPY': '¥', 'EUR': '€', 'GBP': '£', 'KRW': '₩'
        };
        const currency = subscription.currency || 'CNY';
        const symbol = currencySymbols[currency] || '¥';
        const currencyLabel = "(" + currency + " " + symbol + ")";
        
        // 【修改点1】农历标记：移除 absolute 定位，改为普通 Flex 布局元素，优化移动端显示
        // 移除了 absolute top-2 right-2，添加了 shrink-0 防止被压缩
        const lunarBadge = subscription.useLunar ? 
            '<span class="text-sm bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200 shrink-0">农历周期</span>' : '';

        // 构建 Modal HTML
        const modalHtml = 
            '<div id="renewFormModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onclick="closeRenewFormModal(event)">' +
            '    <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white" onclick="event.stopPropagation()">' +
            '        <div class="flex justify-between items-center pb-3 border-b">' +
            '            <h3 class="text-xl font-semibold text-gray-900">' +
            '                <i class="fas fa-sync-alt mr-2"></i>手动续订 - ' + subscription.name +
            '            </h3>' +
            '            <button onclick="closeRenewFormModal()" class="text-gray-400 hover:text-gray-500">' +
            '                <i class="fas fa-times text-2xl"></i>' +
            '            </button>' +
            '        </div>' +
            '' +
            '        <form id="renewForm" class="mt-4 space-y-4">' +
            '            <div>' +
            '                <label class="block text-sm font-medium text-gray-700 mb-1">支付日期</label>' +
            '                <input type="date" id="renewPaymentDate" value="' + today + '"' +
            '                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">' +
            '            </div>' +
            '' +
            '            <div>' +
            '                <label class="block text-sm font-medium text-gray-700 mb-1">支付金额 ' + currencyLabel + '</label>' +
            '                <input type="number" id="renewAmount" value="' + defaultAmount + '" step="0.01" min="0"' +
            '                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">' +
            '            </div>' +
            '' +
            '            <div>' +
            // 【修改点2】将农历徽标移动到这里，与 label 同行显示
            '                <div class="flex justify-between items-center mb-1">' +
            '                    <label class="block text-sm font-medium text-gray-700">续订周期数</label>' +
            '                    ' + lunarBadge + 
            '                </div>' +
            '                <div class="flex items-center space-x-2">' +
            '                    <input type="number" id="renewPeriodMultiplier" value="1" min="1" max="120"' +
            '                           class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"' +
            '                           oninput="updateNewExpiryPreview()">' +
            '                    <span class="text-gray-600">个</span>' + 
            '                </div>' +
            '                <p class="mt-1 text-xs text-gray-500">一次性续订多个周期（如12个月）</p>' +
            '            </div>' +
            '' +
            // 【修改点3】蓝色预览框中移除了原来的 lunarBadge 插入
            '            <div class="bg-blue-50 rounded-lg p-3 relative">' +
            '                <div class="flex justify-start items-center text-sm mb-2 gap-3">' +
            '                    <span class="text-gray-600 whitespace-nowrap">当前到期:</span>' +
            '                    <div class="font-medium break-all">' + currentExpiryDisplay + '</div>' + // 增加了 break-all 防止超长日期撑破布局
            '                </div>' +
            '                <div class="flex justify-start items-center text-sm gap-3">' +
            '                    <span class="text-gray-600 whitespace-nowrap">新到期日:</span>' +
            '                    <div class="font-medium text-blue-600 break-all" id="newExpiryPreview">计算中...</div>' +
            '                </div>' +
            '            </div>' +
            '' +
            '            <div>' +
            '                <label class="block text-sm font-medium text-gray-700 mb-1">备注 (可选)</label>' +
            '                <input type="text" id="renewNote" placeholder="例如：年度优惠、价格调整"' +
            '                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">' +
            '            </div>' +
            '' +
            '            <div class="flex justify-end space-x-3 pt-3">' +
            '                <button type="button" onclick="closeRenewFormModal()"' +
            '                        class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">' +
            '                    取消' +
            '                </button>' +
            '                <button type="submit" id="confirmRenewBtn"' +
            '                        class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md">' +
            '                    <i class="fas fa-check mr-1"></i>确认续订' +
            '                </button>' +
            '            </div>' +
            '        </form>' +
            '    </div>' +
            '</div>';

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 保存订阅信息到表单
        document.getElementById('renewForm').dataset.subscriptionId = subscription.id;
        document.getElementById('renewForm').dataset.subscriptionData = JSON.stringify(subscription);

        // 初始化新到期日预览
        updateNewExpiryPreview();

        // 绑定表单提交事件
        document.getElementById('renewForm').addEventListener('submit', handleRenewFormSubmit);
        document.getElementById('renewPeriodMultiplier').addEventListener('input', updateNewExpiryPreview);
    }

    function updateNewExpiryPreview() {
        const form = document.getElementById('renewForm');
        if (!form) return;

        const subscription = JSON.parse(form.dataset.subscriptionData);
        const multiplier = parseInt(document.getElementById('renewPeriodMultiplier').value) || 1;

        // 获取基准日期，避免直接 new Date() 的时区问题
        const getDateParts = (dateStr) => {
            if (!dateStr) return { year: 2024, month: 1, day: 1 };
            const part = dateStr.split('T')[0];
            const parts = part.split('-');
            return {
                year: parseInt(parts[0], 10),
                month: parseInt(parts[1], 10),
                day: parseInt(parts[2], 10)
            };
        };

        const parts = getDateParts(subscription.expiryDate);
        
        if (subscription.useLunar) {
            try {
                // 1. 转为农历对象
                let lunar = lunarCalendar.solar2lunar(parts.year, parts.month, parts.day);
                
                if (lunar) {
                    // 2. 循环添加周期
                    let nextLunar = lunar;
                    for(let i = 0; i < multiplier; i++) {
                        nextLunar = lunarBiz.addLunarPeriod(nextLunar, subscription.periodValue, subscription.periodUnit);
                    }
                    
                    // 3. 转回公历
                    const solar = lunarBiz.lunar2solar(nextLunar);
                    
                    // 重点：用计算出的公历日期重新获取完整的农历对象，确保有 fullStr 属性
                    const fullNextLunar = lunarCalendar.solar2lunar(solar.year, solar.month, solar.day);
                    
                    // 格式化输出 YYYY-MM-DD
                    const resultStr = solar.year + '-' + 
                                      String(solar.month).padStart(2, '0') + '-' + 
                                      String(solar.day).padStart(2, '0');
                                      
                    document.getElementById('newExpiryPreview').textContent = resultStr + ' (农历: ' + fullNextLunar.fullStr + ')';
                } else {
                    document.getElementById('newExpiryPreview').textContent = '日期计算错误';
                }
            } catch (e) {
                console.error(e);
                document.getElementById('newExpiryPreview').textContent = '计算出错';
            }
        } else {
            // 公历计算逻辑
            const tempDate = new Date(parts.year, parts.month - 1, parts.day);
            const totalPeriodValue = subscription.periodValue * multiplier;
            
            if (subscription.periodUnit === 'day') {
                tempDate.setDate(tempDate.getDate() + totalPeriodValue);
            } else if (subscription.periodUnit === 'month') {
                tempDate.setMonth(tempDate.getMonth() + totalPeriodValue);
            } else if (subscription.periodUnit === 'year') {
                tempDate.setFullYear(tempDate.getFullYear() + totalPeriodValue);
            }
            
            // 格式化输出 YYYY-MM-DD
            const y = tempDate.getFullYear();
            const m = String(tempDate.getMonth() + 1).padStart(2, '0');
            const d = String(tempDate.getDate()).padStart(2, '0');
            
            document.getElementById('newExpiryPreview').textContent = y + '-' + m + '-' + d;
        }
    }

    async function handleRenewFormSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const subscriptionId = form.dataset.subscriptionId;
        const confirmBtn = document.getElementById('confirmRenewBtn');

        const options = {
            paymentDate: document.getElementById('renewPaymentDate').value,
            amount: parseFloat(document.getElementById('renewAmount').value) || 0,
            periodMultiplier: parseInt(document.getElementById('renewPeriodMultiplier').value) || 1,
            note: document.getElementById('renewNote').value || '手动续订'
        };

        const originalBtnContent = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>续订中...';
        confirmBtn.disabled = true;

        try {
            const response = await fetch('/api/subscriptions/' + subscriptionId + '/renew', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options)
            });
            const result = await response.json();

            if (result.success) {
                showToast(result.message || '续订成功', 'success');
                closeRenewFormModal();
                await loadSubscriptions(false);
            } else {
                showToast(result.message || '续订失败', 'error');
                confirmBtn.innerHTML = originalBtnContent;
                confirmBtn.disabled = false;
            }
        } catch (error) {
            console.error('续订失败:', error);
            showToast('续订时发生错误', 'error');
            confirmBtn.innerHTML = originalBtnContent;
            confirmBtn.disabled = false;
        }
    }

    window.closeRenewFormModal = function(event) {
        if (event && event.target.id !== 'renewFormModal') {
            return;
        }
        const modal = document.getElementById('renewFormModal');
        if (modal) {
            modal.remove();
        }
    };

    async function viewPaymentHistory(e) {
        const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
        const id = button.dataset.id;

        try {
            const response = await fetch('/api/subscriptions/' + id + '/payments');
            const result = await response.json();

            if (!result.success) {
                showToast(result.message || '获取支付历史失败', 'error');
                return;
            }

            const payments = result.payments || [];
            const subscriptionResponse = await fetch('/api/subscriptions/' + id);
            const subscriptionData = await subscriptionResponse.json();
            const subscription = subscriptionData;

            showPaymentHistoryModal(subscription, payments);
        } catch (error) {
            console.error('获取支付历史失败:', error);
            showToast('获取支付历史时发生错误', 'error');
        }
    }

    function showPaymentHistoryModal(subscription, payments) {
        const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const paymentCount = payments.length;

        let paymentsHtml = '';
        if (payments.length === 0) {
            paymentsHtml = '<div class="text-center text-gray-500 py-8">暂无支付记录</div>';
        } else {
            paymentsHtml = payments.reverse().map(payment => {
                const typeLabel = payment.type === 'initial' ? '初始订阅' :
                                payment.type === 'manual' ? '手动续订' :
                                payment.type === 'auto' ? '自动续订' : '未知';
                const typeClass = payment.type === 'initial' ? 'bg-blue-100 text-blue-800' :
                                payment.type === 'manual' ? 'bg-green-100 text-green-800' :
                                payment.type === 'auto' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800';
                const date = new Date(payment.date);
                const formattedDate = date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
                const formattedTime = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

                // 计费周期格式化
                let periodHtml = '';
                if (payment.periodStart && payment.periodEnd) {
                    const periodStart = new Date(payment.periodStart);
                    const periodEnd = new Date(payment.periodEnd);
                    const options = { year: 'numeric', month: 'short', day: 'numeric' };
                    const startStr = periodStart.toLocaleDateString('zh-CN', options);
                    const endStr = periodEnd.toLocaleDateString('zh-CN', options);
                    periodHtml = '<div class="mt-1 ml-6 text-xs text-gray-500"><i class="fas fa-clock mr-1"></i>计费周期: ' + startStr + ' - ' + endStr + '</div>';
                }

                const noteHtml = payment.note ? '<div class="mt-1 ml-6 text-sm text-gray-600">' + payment.note + '</div>' : '';
                const paymentDataJson = JSON.stringify(payment).replace(/"/g, '&quot;');
                return \`
                    <div class="border-b border-gray-200 py-3 hover:bg-gray-50">
                        <div class="flex justify-between items-start gap-3">
                            <div class="flex-1">
                                <div class="flex items-center gap-2">
                                    <i class="fas fa-calendar-alt text-gray-400"></i>
                                    <span class="font-medium">\${formattedDate} \${formattedTime}</span>
                                    <span class="px-2 py-1 rounded text-xs font-medium \${typeClass}">\${typeLabel}</span>
                                </div>
                                \${periodHtml}
                                \${noteHtml}
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="text-right">
                                    <div class="text-lg font-bold text-gray-900">¥\${payment.amount.toFixed(2)}</div>
                                </div>
                                <div class="flex gap-1">
                                    <button onclick="editPaymentRecord('\${subscription.id}', '\${payment.id}')"
                                            class="text-blue-600 hover:text-blue-800 px-2 py-1"
                                            title="编辑">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deletePaymentRecord('\${subscription.id}', '\${payment.id}')"
                                            class="text-red-600 hover:text-red-800 px-2 py-1"
                                            title="删除">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        const modalHtml = \`
            <div id="paymentHistoryModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onclick="closePaymentHistoryModal(event)">
                <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white" onclick="event.stopPropagation()">
                    <div class="flex justify-between items-center pb-3 border-b">
                        <h3 class="text-xl font-semibold text-gray-900">
                            <i class="fas fa-history mr-2"></i>\${subscription.name} - 支付历史
                        </h3>
                        <button onclick="closePaymentHistoryModal()" class="text-gray-400 hover:text-gray-500">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>

                    <div class="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="text-center">
                                <div class="text-sm text-gray-600">累计支出</div>
                                <div class="text-2xl font-bold text-purple-600">¥\${totalAmount.toFixed(2)}</div>
                            </div>
                            <div class="text-center">
                                <div class="text-sm text-gray-600">支付次数</div>
                                <div class="text-2xl font-bold text-blue-600">\${paymentCount}</div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 max-h-96 overflow-y-auto">
                        \${paymentsHtml}
                    </div>

                    <div class="mt-4 flex justify-end">
                        <button onclick="closePaymentHistoryModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        \`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    window.closePaymentHistoryModal = function(event) {
        if (event && event.target.id !== 'paymentHistoryModal') {
            return;
        }
        const modal = document.getElementById('paymentHistoryModal');
        if (modal) {
            modal.remove();
        }
    };

    window.deletePaymentRecord = async function(subscriptionId, paymentId) {
        if (!confirm('确认删除此支付记录？删除后将重新计算统计数据。')) {
            return;
        }

        try {
            const response = await fetch(\`/api/subscriptions/\${subscriptionId}/payments/\${paymentId}\`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                showToast(result.message || '支付记录已删除', 'success');
                // 关闭当前模态框
                closePaymentHistoryModal();
                // 刷新订阅列表
                await loadSubscriptions(false);
            } else {
                showToast(result.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除支付记录失败:', error);
            showToast('删除时发生错误', 'error');
        }
    };

    window.editPaymentRecord = async function(subscriptionId, paymentId) {
        try {
            // 获取订阅信息
            const subResponse = await fetch(\`/api/subscriptions/\${subscriptionId}\`);
            const subscription = await subResponse.json();

            // 获取支付历史
            const payResponse = await fetch(\`/api/subscriptions/\${subscriptionId}/payments\`);
            const payResult = await payResponse.json();

            const payment = payResult.payments.find(p => p.id === paymentId);
            if (!payment) {
                showToast('支付记录不存在', 'error');
                return;
            }

            showEditPaymentModal(subscription, payment);
        } catch (error) {
            console.error('获取支付记录失败:', error);
            showToast('获取支付记录时发生错误', 'error');
        }
    };

    function showEditPaymentModal(subscription, payment) {
        const paymentDate = new Date(payment.date);
        const formattedDate = paymentDate.toISOString().split('T')[0];

        const modalHtml = \`
            <div id="editPaymentModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onclick="closeEditPaymentModal(event)">
                <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white" onclick="event.stopPropagation()">
                    <div class="flex justify-between items-center pb-3 border-b">
                        <h3 class="text-xl font-semibold text-gray-900">
                            <i class="fas fa-edit mr-2"></i>编辑支付记录
                        </h3>
                        <button onclick="closeEditPaymentModal()" class="text-gray-400 hover:text-gray-500">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>

                    <form id="editPaymentForm" class="mt-4 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">订阅名称</label>
                            <input type="text" value="\${subscription.name}" disabled
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">支付日期</label>
                            <input type="date" id="editPaymentDate" value="\${formattedDate}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">支付金额 (¥)</label>
                            <input type="number" id="editPaymentAmount" value="\${payment.amount}" step="0.01" min="0"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
                            <input type="text" id="editPaymentNote" value="\${payment.note || ''}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        </div>

                        <div class="flex justify-end space-x-3 pt-3">
                            <button type="button" onclick="closeEditPaymentModal()"
                                    class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">
                                取消
                            </button>
                            <button type="submit" id="confirmEditBtn"
                                    class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md">
                                <i class="fas fa-check mr-1"></i>保存
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        \`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 保存信息到表单
        document.getElementById('editPaymentForm').dataset.subscriptionId = subscription.id;
        document.getElementById('editPaymentForm').dataset.paymentId = payment.id;

        // 绑定表单提交事件
        document.getElementById('editPaymentForm').addEventListener('submit', handleEditPaymentSubmit);
    }

    async function handleEditPaymentSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const subscriptionId = form.dataset.subscriptionId;
        const paymentId = form.dataset.paymentId;
        const confirmBtn = document.getElementById('confirmEditBtn');

        const paymentData = {
            date: document.getElementById('editPaymentDate').value,
            amount: parseFloat(document.getElementById('editPaymentAmount').value) || 0,
            note: document.getElementById('editPaymentNote').value
        };

        const originalBtnContent = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>保存中...';
        confirmBtn.disabled = true;

        try {
            const response = await fetch(\`/api/subscriptions/\${subscriptionId}/payments/\${paymentId}\`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });
            const result = await response.json();

            if (result.success) {
                showToast(result.message || '支付记录已更新', 'success');
                closeEditPaymentModal();
                closePaymentHistoryModal();
                await loadSubscriptions(false);
            } else {
                showToast(result.message || '更新失败', 'error');
                confirmBtn.innerHTML = originalBtnContent;
                confirmBtn.disabled = false;
            }
        } catch (error) {
            console.error('更新支付记录失败:', error);
            showToast('更新时发生错误', 'error');
            confirmBtn.innerHTML = originalBtnContent;
            confirmBtn.disabled = false;
        }
    }

    window.closeEditPaymentModal = function(event) {
        if (event && event.target.id !== 'editPaymentModal') {
            return;
        }
        const modal = document.getElementById('editPaymentModal');
        if (modal) {
            modal.remove();
        }
    };

    async function toggleSubscriptionStatus(e) {
      const id = e.target.dataset.id || e.target.parentElement.dataset.id;
      const action = e.target.dataset.action || e.target.parentElement.dataset.action;
      const isActivate = action === 'activate';
      
      const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + (isActivate ? '启用中...' : '停用中...');
      button.disabled = true;
      
      try {
        const response = await fetch('/api/subscriptions/' + id + '/toggle-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: isActivate })
        });
        
        if (response.ok) {
          showToast((isActivate ? '启用' : '停用') + '成功', 'success');
          loadSubscriptions();
        } else {
          const error = await response.json();
          showToast((isActivate ? '启用' : '停用') + '失败: ' + (error.message || '未知错误'), 'error');
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      } catch (error) {
        console.error((isActivate ? '启用' : '停用') + '订阅失败:', error);
        showToast((isActivate ? '启用' : '停用') + '失败，请稍后再试', 'error');
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    }
    
    document.getElementById('addSubscriptionBtn').addEventListener('click', () => {
      document.getElementById('modalTitle').textContent = '添加新订阅';
      document.getElementById('subscriptionModal').classList.remove('hidden');

      document.getElementById('subscriptionForm').reset();
      document.getElementById('currency').value = 'CNY'; // 默认设置为CNY
      document.getElementById('subscriptionId').value = '';
      clearFieldErrors();

      const today = new Date().toISOString().split('T')[0]; // 前端使用本地时间
      document.getElementById('startDate').value = today;
      document.getElementById('category').value = '';
      document.getElementById('reminderValue').value = '7';
      document.getElementById('reminderUnit').value = 'day';
      document.getElementById('isActive').checked = true;
      document.getElementById('autoRenew').checked = true;

      loadLunarPreference();
      calculateExpiryDate();
      setupModalEventListeners();
    });

    // 自定义日期选择器功能
    class CustomDatePicker {
      constructor(inputId, pickerId, calendarId, monthId, yearId, prevBtnId, nextBtnId) {
        console.log('CustomDatePicker 构造函数:', { inputId, pickerId, calendarId, monthId, yearId, prevBtnId, nextBtnId });
        
        this.input = document.getElementById(inputId);
        this.picker = document.getElementById(pickerId);
        this.calendar = document.getElementById(calendarId);
        this.monthElement = document.getElementById(monthId);
        this.yearElement = document.getElementById(yearId);
        this.prevBtn = document.getElementById(prevBtnId);
        this.nextBtn = document.getElementById(nextBtnId);
        
        // 新增元素
        this.monthPicker = document.getElementById(pickerId.replace('Picker', 'MonthPicker'));
        this.yearPicker = document.getElementById(pickerId.replace('Picker', 'YearPicker'));
        this.backToCalendarBtn = document.getElementById(pickerId.replace('Picker', 'BackToCalendar'));
        this.backToCalendarFromYearBtn = document.getElementById(pickerId.replace('Picker', 'BackToCalendarFromYear'));
        this.goToTodayBtn = document.getElementById(pickerId.replace('Picker', 'GoToToday'));
        this.prevYearDecadeBtn = document.getElementById(pickerId.replace('Picker', 'PrevYearDecade'));
        this.nextYearDecadeBtn = document.getElementById(pickerId.replace('Picker', 'NextYearDecade'));
        this.yearRangeElement = document.getElementById(pickerId.replace('Picker', 'YearRange'));
        this.yearGrid = document.getElementById(pickerId.replace('Picker', 'YearGrid'));
        
        console.log('找到的元素:', {
          input: !!this.input,
          picker: !!this.picker,
          calendar: !!this.calendar,
          monthElement: !!this.monthElement,
          yearElement: !!this.yearElement,
          prevBtn: !!this.prevBtn,
          nextBtn: !!this.nextBtn
        });
        
        this.currentDate = new Date();
        this.selectedDate = null;
        this.currentView = 'calendar'; // 'calendar', 'month', 'year'
        this.yearDecade = Math.floor(this.currentDate.getFullYear() / 10) * 10;
        
        this.init();
      }
      
      init() {
        console.log('初始化日期选择器，输入框:', !!this.input, '选择器:', !!this.picker);
        
        // 绑定基本事件
        if (this.input) {
          // 移除之前的事件监听器（如果存在）
          this.input.removeEventListener('click', this._forceShowHandler);
          this._forceShowHandler = () => this.forceShow();
          this.input.addEventListener('click', this._forceShowHandler);
          if (this._manualInputHandler) {
            this.input.removeEventListener('blur', this._manualInputHandler);
          }
          this._manualInputHandler = () => this.syncFromInputValue();
          this.input.addEventListener('blur', this._manualInputHandler);

          if (this._manualKeydownHandler) {
            this.input.removeEventListener('keydown', this._manualKeydownHandler);
          }
          this._manualKeydownHandler = (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              this.syncFromInputValue();
            }
          };
          this.input.addEventListener('keydown', this._manualKeydownHandler);
        }
        
        if (this.prevBtn) {
          this.prevBtn.removeEventListener('click', this._prevHandler);
          this._prevHandler = () => this.previousMonth();
          this.prevBtn.addEventListener('click', this._prevHandler);
        }
        
        if (this.nextBtn) {
          this.nextBtn.removeEventListener('click', this._nextHandler);
          this._nextHandler = () => this.nextMonth();
          this.nextBtn.addEventListener('click', this._nextHandler);
        }
        
        // 绑定月份和年份点击事件
        if (this.monthElement) {
          this.monthElement.removeEventListener('click', this._showMonthHandler);
          this._showMonthHandler = () => this.showMonthPicker();
          this.monthElement.addEventListener('click', this._showMonthHandler);
        }
        
        if (this.yearElement) {
          this.yearElement.removeEventListener('click', this._showYearHandler);
          this._showYearHandler = () => this.showYearPicker();
          this.yearElement.addEventListener('click', this._showYearHandler);
        }
        
        // 绑定月份选择器事件
        if (this.monthPicker) {
          this.monthPicker.removeEventListener('click', this._monthSelectHandler);
          this._monthSelectHandler = (e) => {
            if (e.target.classList.contains('month-option')) {
              const month = parseInt(e.target.dataset.month);
              this.selectMonth(month);
            }
          };
          this.monthPicker.addEventListener('click', this._monthSelectHandler);
        }
        
        if (this.backToCalendarBtn) {
          this.backToCalendarBtn.removeEventListener('click', this._backToCalendarHandler);
          this._backToCalendarHandler = () => this.showCalendar();
          this.backToCalendarBtn.addEventListener('click', this._backToCalendarHandler);
        }
        
        if (this.backToCalendarFromYearBtn) {
          this.backToCalendarFromYearBtn.removeEventListener('click', this._backToCalendarFromYearHandler);
          this._backToCalendarFromYearHandler = () => this.showCalendar();
          this.backToCalendarFromYearBtn.addEventListener('click', this._backToCalendarFromYearHandler);
        }
        
        // 绑定年份选择器事件
        if (this.prevYearDecadeBtn) {
        this.prevYearDecadeBtn.removeEventListener('click', this._prevYearDecadeHandler);
        this._prevYearDecadeHandler = (e) => {
            e.stopPropagation(); // 防止事件冒泡到表单
            this.previousYearDecade();
        };
        this.prevYearDecadeBtn.addEventListener('click', this._prevYearDecadeHandler);
        }

        if (this.nextYearDecadeBtn) {
        this.nextYearDecadeBtn.removeEventListener('click', this._nextYearDecadeHandler);
        this._nextYearDecadeHandler = (e) => {
            e.stopPropagation(); // 防止事件冒泡到表单
            this.nextYearDecade();
        };
        this.nextYearDecadeBtn.addEventListener('click', this._nextYearDecadeHandler);
}
        
        // 绑定回到今天事件
        if (this.goToTodayBtn) {
          this.goToTodayBtn.removeEventListener('click', this._goToTodayHandler);
          this._goToTodayHandler = () => this.goToToday();
          this.goToTodayBtn.addEventListener('click', this._goToTodayHandler);
        }
        
        // 点击外部关闭
        if (this._outsideClickHandler) {
          document.removeEventListener('click', this._outsideClickHandler);
        }
        this._outsideClickHandler = (e) => {
          if (this.picker && !this.picker.contains(e.target) && !this.input.contains(e.target)) {
            console.log('点击外部，隐藏日期选择器');
            this.hide();
          }
        };
        document.addEventListener('click', this._outsideClickHandler);
        
        // 初始化显示
        this.syncFromInputValue();
        this.render();
        this.renderYearGrid();
      }
      
      toggle() {
        console.log('toggle 被调用');
        console.log('picker 元素:', this.picker);
        console.log('picker 类名:', this.picker ? this.picker.className : 'null');
        console.log('是否包含 hidden:', this.picker ? this.picker.classList.contains('hidden') : 'null');
        
        if (this.picker && this.picker.classList.contains('hidden')) {
          console.log('显示日期选择器');
          this.show();
        } else {
          console.log('隐藏日期选择器');
          this.hide();
        }
      }
      
      // 强制显示日期选择器
      forceShow() {
        console.log('forceShow 被调用');
        if (this.picker) {
          // 确保选择器显示
          this.picker.classList.remove('hidden');
          // 重置到日历视图
          this.currentView = 'calendar';
          this.hideAllViews();
          this.render();
          console.log('日期选择器已显示');
        } else {
          console.error('日期选择器元素不存在');
        }
      }
      
      show() {
        if (this.picker) {
          this.picker.classList.remove('hidden');
          this.render();
        }
      }
      
      hide() {
        if (this.picker) {
          this.picker.classList.add('hidden');
        }
      }
      
      previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
      }
      
      nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
      }
      
      selectDate(date) {
        this.selectedDate = date;
        if (this.input) {
          // 使用本地时间格式化，避免时区问题
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          this.input.value = year + '-' + month + '-' + day;
        }
        this.hide();
        
        // 触发change事件，但不冒泡到表单
        if (this.input) {
          const event = new Event('change', { bubbles: false });
          this.input.dispatchEvent(event);
        }
      }

      syncFromInputValue() {
        if (!this.input) {
          return;
        }
        const value = this.input.value.trim();
        if (!value) {
          this.selectedDate = null;
          return;
        }

        const match = value.match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})$/);
        if (!match) {
          if (typeof showToast === 'function') {
            showToast('日期格式需为 YYYY-MM-DD', 'warning');
          }
          return;
        }

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const parsed = new Date(year, month - 1, day);
        if (isNaN(parsed.getTime()) || parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
          if (typeof showToast === 'function') {
            showToast('请输入有效的日期', 'warning');
          }
          return;
        }

        this.selectedDate = parsed;
        this.currentDate = new Date(parsed);
        this.render();

        const event = new Event('change', { bubbles: false });
        this.input.dispatchEvent(event);
      }
      
      render() {
        if (!this.monthElement || !this.yearElement || !this.calendar) return;
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // 更新月份年份显示
        this.monthElement.textContent = (month + 1) + '月';
        this.yearElement.textContent = year;
        
        // 清空日历
        this.calendar.innerHTML = '';
        
        // 获取当月第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // 生成日历网格
        for (let i = 0; i < 42; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          
          const dayElement = document.createElement('div');
          dayElement.className = 'calendar-day';
          
          // 判断是否是当前月份
          if (date.getMonth() !== month) {
            dayElement.classList.add('other-month');
          }
          
          // 判断是否是今天
          const today = new Date();
          if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
          }
          
          // 判断是否是选中日期
          if (this.selectedDate && date.toDateString() === this.selectedDate.toDateString()) {
            dayElement.classList.add('selected');
          }
          
          // 获取农历信息
          let lunarText = '';
          try {
            const lunar = lunarCalendar.solar2lunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
            if (lunar) {
              if (lunar.day === 1) {
                // 初一，只显示月份
                lunarText = lunar.isLeap ? '闰' + lunar.monthStr.replace('闰', '') : lunar.monthStr;
              } else {
                // 不是初一，显示日
                lunarText = lunar.dayStr;
              }
            }
          } catch (error) {
            console.error('农历转换错误:', error);
          }
          
          dayElement.innerHTML =
            '<div>' + date.getDate() + '</div>' +
            '<div class="lunar-text">' + lunarText + '</div>';
          
          dayElement.addEventListener('click', () => this.selectDate(date));
          
          this.calendar.appendChild(dayElement);
        }
      }
      
      // 显示月份选择器
      showMonthPicker() {
        this.currentView = 'month';
        this.hideAllViews();
        if (this.monthPicker) {
          this.monthPicker.classList.remove('hidden');
          // 高亮当前月份
          const monthOptions = this.monthPicker.querySelectorAll('.month-option');
          monthOptions.forEach((option, index) => {
            option.classList.remove('selected');
            if (index === this.currentDate.getMonth()) {
              option.classList.add('selected');
            }
          });
        }
      }
      
      // 显示年份选择器
      showYearPicker() {
        this.currentView = 'year';
        this.hideAllViews();
        if (this.yearPicker) {
          this.yearPicker.classList.remove('hidden');
        }
        this.renderYearGrid();
      }
      
      // 显示日历视图
      showCalendar() {
        this.currentView = 'calendar';
        this.hideAllViews();
        this.render();
      }
      
      // 隐藏所有视图
      hideAllViews() {
        if (this.monthPicker) this.monthPicker.classList.add('hidden');
        if (this.yearPicker) this.yearPicker.classList.add('hidden');
        // 注意：不隐藏日历视图，因为它是主视图
      }
      
      // 选择月份
      selectMonth(month) {
        this.currentDate.setMonth(month);
        this.showCalendar();
      }
      
      // 选择年份
      selectYear(year) {
        this.currentDate.setFullYear(year);
        this.showCalendar();
      }
      
      // 上一十年
      previousYearDecade() {
        this.yearDecade -= 10;
        this.renderYearGrid();
      }
      
      // 下一十年
      nextYearDecade() {
        this.yearDecade += 10;
        this.renderYearGrid();
      }
      
      // 渲染年份网格
      renderYearGrid() {
        if (!this.yearGrid || !this.yearRangeElement) return;
        
        const startYear = this.yearDecade;
        const endYear = this.yearDecade + 9;
        
        // 更新年份范围显示
        this.yearRangeElement.textContent = startYear + '-' + endYear;
        
        // 清空年份网格
        this.yearGrid.innerHTML = '';
        
        // 生成年份按钮
        for (let year = startYear; year <= endYear; year++) {
          const yearBtn = document.createElement('button');
          yearBtn.type = 'button';
          yearBtn.className = 'year-option px-3 py-2 text-sm rounded hover:bg-gray-100';
          yearBtn.textContent = year;
          yearBtn.dataset.year = year;
          
          // 高亮当前年份
          if (year === this.currentDate.getFullYear()) {
            yearBtn.classList.add('bg-indigo-100', 'text-indigo-600');
          }
          
          // 限制年份范围 1900-2100
          if (year < 1900 || year > 2100) {
            yearBtn.disabled = true;
            yearBtn.classList.add('opacity-50', 'cursor-not-allowed');
          } else {
            yearBtn.addEventListener('click', () => this.selectYear(year));
          }
          
          this.yearGrid.appendChild(yearBtn);
        }
      }
      
      // 回到今天
      goToToday() {
        this.currentDate = new Date();
        this.yearDecade = Math.floor(this.currentDate.getFullYear() / 10) * 10;
        this.showCalendar();
      }
      
      destroy() {
        this.hide();
        
        // 清理事件监听器
        if (this.input && this._forceShowHandler) {
          this.input.removeEventListener('click', this._forceShowHandler);
        }
        if (this.input && this._manualInputHandler) {
          this.input.removeEventListener('blur', this._manualInputHandler);
        }
        if (this.input && this._manualKeydownHandler) {
          this.input.removeEventListener('keydown', this._manualKeydownHandler);
        }
        if (this.prevBtn && this._prevHandler) {
          this.prevBtn.removeEventListener('click', this._prevHandler);
        }
        if (this.nextBtn && this._nextHandler) {
          this.nextBtn.removeEventListener('click', this._nextHandler);
        }
        if (this.monthElement && this._showMonthHandler) {
          this.monthElement.removeEventListener('click', this._showMonthHandler);
        }
        if (this.yearElement && this._showYearHandler) {
          this.yearElement.removeEventListener('click', this._showYearHandler);
        }
        if (this.monthPicker && this._monthSelectHandler) {
          this.monthPicker.removeEventListener('click', this._monthSelectHandler);
        }
        if (this.backToCalendarBtn && this._backToCalendarHandler) {
          this.backToCalendarBtn.removeEventListener('click', this._backToCalendarHandler);
        }
        if (this.backToCalendarFromYearBtn && this._backToCalendarFromYearHandler) {
          this.backToCalendarFromYearBtn.removeEventListener('click', this._backToCalendarFromYearHandler);
        }
        if (this.prevYearDecadeBtn && this._prevYearDecadeHandler) {
          this.prevYearDecadeBtn.removeEventListener('click', this._prevYearDecadeHandler);
        }
        if (this.nextYearDecadeBtn && this._nextYearDecadeHandler) {
          this.nextYearDecadeBtn.removeEventListener('click', this._nextYearDecadeHandler);
        }
        if (this.goToTodayBtn && this._goToTodayHandler) {
          this.goToTodayBtn.removeEventListener('click', this._goToTodayHandler);
        }
        if (this._outsideClickHandler) {
          document.removeEventListener('click', this._outsideClickHandler);
        }
      }
    }
    
    function setupModalEventListeners() {
      // 获取DOM元素
      const calculateExpiryBtn = document.getElementById('calculateExpiryBtn');
      const useLunar = document.getElementById('useLunar');
      const showLunar = document.getElementById('showLunar');
      const startDate = document.getElementById('startDate');
      const expiryDate = document.getElementById('expiryDate');
      const cancelBtn = document.getElementById('cancelBtn');
      
      // 直接绑定事件监听器（简化处理，避免重复移除的问题）
      if (calculateExpiryBtn) {
        calculateExpiryBtn.addEventListener('click', calculateExpiryDate);
      }
      if (useLunar) {
        useLunar.addEventListener('change', calculateExpiryDate);
      }
      if (showLunar) {
        showLunar.addEventListener('change', toggleLunarDisplay);
      }
      if (startDate) {
        startDate.addEventListener('change', () => updateLunarDisplay('startDate', 'startDateLunar'));
      }
      if (expiryDate) {
        expiryDate.addEventListener('change', () => updateLunarDisplay('expiryDate', 'expiryDateLunar'));
      }
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          document.getElementById('subscriptionModal').classList.add('hidden');
        });
      }
      // 为周期相关字段添加事件监听
      ['startDate', 'periodValue', 'periodUnit'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener('change', calculateExpiryDate);
        }
      });

      // 初始化自定义日期选择器
      try {
        // 安全地清理之前的实例
        if (window.startDatePicker && typeof window.startDatePicker.destroy === 'function') {
          window.startDatePicker.destroy();
        }
        if (window.expiryDatePicker && typeof window.expiryDatePicker.destroy === 'function') {
          window.expiryDatePicker.destroy();
        }
        
        // 清理全局变量
        window.startDatePicker = null;
        window.expiryDatePicker = null;
        
        // 确保DOM元素存在后再创建选择器
        setTimeout(() => {
          console.log('创建开始日期选择器...');
          window.startDatePicker = new CustomDatePicker(
            'startDate', 'startDatePicker', 'startDateCalendar', 
            'startDateMonth', 'startDateYear', 'startDatePrevMonth', 'startDateNextMonth'
          );
          
          console.log('创建到期日期选择器...');
          window.expiryDatePicker = new CustomDatePicker(
            'expiryDate', 'expiryDatePicker', 'expiryDateCalendar', 
            'expiryDateMonth', 'expiryDateYear', 'expiryDatePrevMonth', 'expiryDateNextMonth'
          );
          
          console.log('日期选择器初始化完成');
        }, 50);
      } catch (error) {
        console.error('初始化日期选择器失败:', error);
        // 确保清理失败的实例
        window.startDatePicker = null;
        window.expiryDatePicker = null;
      }
    }

	// 3. 新增修改， calculateExpiryDate 函数，支持农历周期推算     
	function calculateExpiryDate() {
	  const startDate = document.getElementById('startDate').value;
	  const periodValue = parseInt(document.getElementById('periodValue').value);
	  const periodUnit = document.getElementById('periodUnit').value;
	  const useLunar = document.getElementById('useLunar').checked;

	  if (!startDate || !periodValue || !periodUnit) {
		return;
	  }

	  if (useLunar) {
		// 农历推算
		const start = new Date(startDate);
		const lunar = lunarCalendar.solar2lunar(start.getFullYear(), start.getMonth() + 1, start.getDate());
		let nextLunar = addLunarPeriod(lunar, periodValue, periodUnit);
		const solar = lunar2solar(nextLunar);
		
		// 使用与公历相同的方式创建日期  
		const expiry = new Date(startDate); // 从原始日期开始  
		expiry.setFullYear(solar.year);  
		expiry.setMonth(solar.month - 1);  
		expiry.setDate(solar.day);  
		document.getElementById('expiryDate').value = expiry.toISOString().split('T')[0];
		console.log('start:', start);
		console.log('nextLunar:', nextLunar);
		console.log('expiry:', expiry);
		console.log('expiryDate:', document.getElementById('expiryDate').value);
		
		console.log('solar from lunar2solar:', solar);  
		console.log('solar.year:', solar.year, 'solar.month:', solar.month, 'solar.day:', solar.day);
		console.log('expiry.getTime():', expiry.getTime());  
		console.log('expiry.toString():', expiry.toString());
		
		
	  } else {
		// 公历推算
		const start = new Date(startDate);
		const expiry = new Date(start);
		if (periodUnit === 'day') {
		  expiry.setDate(start.getDate() + periodValue);
		} else if (periodUnit === 'month') {
		  expiry.setMonth(start.getMonth() + periodValue);
		} else if (periodUnit === 'year') {
		  expiry.setFullYear(start.getFullYear() + periodValue);
		}
		document.getElementById('expiryDate').value = expiry.toISOString().split('T')[0];
		console.log('start:', start);
		console.log('expiry:', expiry);
		console.log('expiryDate:', document.getElementById('expiryDate').value);
	  }

	  // 更新农历显示
	  updateLunarDisplay('startDate', 'startDateLunar');
	  updateLunarDisplay('expiryDate', 'expiryDateLunar');
	}
    
    document.getElementById('closeModal').addEventListener('click', () => {
      document.getElementById('subscriptionModal').classList.add('hidden');
    });
    
    // 禁止点击弹窗外区域关闭弹窗，防止误操作丢失内容
    // document.getElementById('subscriptionModal').addEventListener('click', (event) => {
    //   if (event.target === document.getElementById('subscriptionModal')) {
    //     document.getElementById('subscriptionModal').classList.add('hidden');
    //   }
    // });
    
	
	// 4. 新增修改，监听 useLunar 复选框变化时也自动重新计算
	// 注意：这个事件监听器已经在 setupModalEventListeners 中处理了   
   // 新增修改，表单提交时带上 useLunar 字段
    document.getElementById('subscriptionForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }
      
      const id = document.getElementById('subscriptionId').value;
      const reminderUnit = document.getElementById('reminderUnit').value;
      const reminderValue = Number(document.getElementById('reminderValue').value) || 0;

      const subscription = {
        name: document.getElementById('name').value.trim(),
        customType: document.getElementById('customType').value.trim(),
        category: document.getElementById('category').value.trim(),
        notes: document.getElementById('notes').value.trim() || '',
        currency: document.getElementById('currency').value, // 新增修改，表单提交时带上 currency 字段
        amount: document.getElementById('amount').value ? parseFloat(document.getElementById('amount').value) : null,
        isActive: document.getElementById('isActive').checked,
        autoRenew: document.getElementById('autoRenew').checked,
        startDate: document.getElementById('startDate').value,
        expiryDate: document.getElementById('expiryDate').value,
        periodValue: Number(document.getElementById('periodValue').value),
        periodUnit: document.getElementById('periodUnit').value,
        reminderUnit: reminderUnit,
        reminderValue: reminderValue,
        reminderDays: reminderUnit === 'day' ? reminderValue : 0,
        reminderHours: reminderUnit === 'hour' ? reminderValue : undefined,
        useLunar: document.getElementById('useLunar').checked
      };
      
      const submitButton = e.target.querySelector('button[type="submit"]');
      const originalContent = submitButton.innerHTML;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + (id ? '更新中...' : '保存中...');
      submitButton.disabled = true;
      
      try {
        const url = id ? '/api/subscriptions/' + id : '/api/subscriptions';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
        
        const result = await response.json();
        
        if (result.success) {
          showToast((id ? '更新' : '添加') + '订阅成功', 'success');
          document.getElementById('subscriptionModal').classList.add('hidden');
          loadSubscriptions();
        } else {
          showToast((id ? '更新' : '添加') + '订阅失败: ' + (result.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error((id ? '更新' : '添加') + '订阅失败:', error);
        showToast((id ? '更新' : '添加') + '订阅失败，请稍后再试', 'error');
      } finally {
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
      }
    });
    
	    // 新增修改，编辑订阅时回显 useLunar 字段
    async function editSubscription(e) {
      const id = e.target.dataset.id || e.target.parentElement.dataset.id;
      
      try {
        const response = await fetch('/api/subscriptions/' + id);
        const subscription = await response.json();
        
        if (subscription) {
          document.getElementById('modalTitle').textContent = '编辑订阅';
          document.getElementById('subscriptionId').value = subscription.id;
          document.getElementById('name').value = subscription.name;
          document.getElementById('customType').value = subscription.customType || '';
          document.getElementById('category').value = subscription.category || '';
          document.getElementById('notes').value = subscription.notes || '';
          document.getElementById('amount').value = subscription.amount || '';
          document.getElementById('currency').value = subscription.currency || 'CNY'; // 默认设置为 CNY
          document.getElementById('isActive').checked = subscription.isActive !== false;
          document.getElementById('autoRenew').checked = subscription.autoRenew !== false;
          document.getElementById('startDate').value = subscription.startDate ? subscription.startDate.split('T')[0] : '';
          document.getElementById('expiryDate').value = subscription.expiryDate ? subscription.expiryDate.split('T')[0] : '';
          document.getElementById('periodValue').value = subscription.periodValue || 1;
          document.getElementById('periodUnit').value = subscription.periodUnit || 'month';
          const reminderUnit = subscription.reminderUnit || (subscription.reminderHours !== undefined ? 'hour' : 'day');
          let reminderValue;
          if (reminderUnit === 'hour') {
            if (subscription.reminderValue !== undefined && subscription.reminderValue !== null) {
              reminderValue = subscription.reminderValue;
            } else if (subscription.reminderHours !== undefined) {
              reminderValue = subscription.reminderHours;
            } else {
              reminderValue = 0;
            }
          } else {
            if (subscription.reminderValue !== undefined && subscription.reminderValue !== null) {
              reminderValue = subscription.reminderValue;
            } else if (subscription.reminderDays !== undefined) {
              reminderValue = subscription.reminderDays;
            } else {
              reminderValue = 7;
            }
          }
          document.getElementById('reminderUnit').value = reminderUnit;
          document.getElementById('reminderValue').value = reminderValue;
          document.getElementById('useLunar').checked = !!subscription.useLunar;
          
          clearFieldErrors();
          loadLunarPreference();
          document.getElementById('subscriptionModal').classList.remove('hidden');
          
          // 重要：编辑订阅时也需要重新设置事件监听器
          setupModalEventListeners();

          // 更新农历显示
          setTimeout(() => {
            updateLunarDisplay('startDate', 'startDateLunar');
            updateLunarDisplay('expiryDate', 'expiryDateLunar');
          }, 100);
        }
      } catch (error) {
        console.error('获取订阅信息失败:', error);
        showToast('获取订阅信息失败', 'error');
      }
    }
    
    async function deleteSubscription(e) {
      const id = e.target.dataset.id || e.target.parentElement.dataset.id;
      
      if (!confirm('确定要删除这个订阅吗？此操作不可恢复。')) {
        return;
      }
      
      const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>删除中...';
      button.disabled = true;
      
      try {
        const response = await fetch('/api/subscriptions/' + id, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          showToast('删除成功', 'success');
          loadSubscriptions();
        } else {
          const error = await response.json();
          showToast('删除失败: ' + (error.message || '未知错误'), 'error');
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      } catch (error) {
        console.error('删除订阅失败:', error);
        showToast('删除失败，请稍后再试', 'error');
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    }
    
    // 全局时区配置
    let globalTimezone = 'UTC';
    
    // 检测时区更新
    function checkTimezoneUpdate() {
      const lastUpdate = localStorage.getItem('timezoneUpdated');
      if (lastUpdate) {
        const updateTime = parseInt(lastUpdate);
        const currentTime = Date.now();
        // 如果时区更新发生在最近5秒内，则刷新页面
        if (currentTime - updateTime < 5000) {
          localStorage.removeItem('timezoneUpdated');
          window.location.reload();
        }
      }
    }
    
    // 页面加载时检查时区更新，并应用 URL 参数预设筛选（供仪表盘排行跳转使用）
    window.addEventListener('load', () => {
      checkTimezoneUpdate();
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const presetSearch = urlParams.get('search');
        const presetCategory = urlParams.get('category');
        if (presetSearch) {
          const presetInput = document.getElementById('searchKeyword');
          if (presetInput) presetInput.value = presetSearch;
        }
        if (presetCategory) {
          window.__presetCategory = presetCategory;
        }
      } catch (e) {
        console.error('解析 URL 筛选参数失败:', e);
      }
      loadSubscriptions();
    });
    
    // 定期检查时区更新（每2秒检查一次）
    setInterval(checkTimezoneUpdate, 2000);

    // 实时显示系统时间和时区
    async function showSystemTime() {
      try {
        // 获取后台配置的时区
        const response = await fetch('/api/config');
        const config = await response.json();
        globalTimezone = config.TIMEZONE || 'UTC';
        
        // 格式化当前时间
        function formatTime(dt, tz) {
          return dt.toLocaleString('zh-CN', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        function formatTimezoneDisplay(tz) {
          try {
            // 使用更准确的时区偏移计算方法
            const now = new Date();
            const dtf = new Intl.DateTimeFormat('en-US', {
              timeZone: tz,
              hour12: false,
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            const parts = dtf.formatToParts(now);
            const get = type => Number(parts.find(x => x.type === type).value);
            const target = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
            const utc = now.getTime();
            const offset = Math.round((target - utc) / (1000 * 60 * 60));
            
            // 时区中文名称映射
            const timezoneNames = {
              'UTC': '世界标准时间',
              'Asia/Shanghai': '中国标准时间',
              'Asia/Hong_Kong': '香港时间',
              'Asia/Taipei': '台北时间',
              'Asia/Singapore': '新加坡时间',
              'Asia/Tokyo': '日本时间',
              'Asia/Seoul': '韩国时间',
              'America/New_York': '美国东部时间',
              'America/Los_Angeles': '美国太平洋时间',
              'America/Chicago': '美国中部时间',
              'America/Denver': '美国山地时间',
              'Europe/London': '英国时间',
              'Europe/Paris': '巴黎时间',
              'Europe/Berlin': '柏林时间',
              'Europe/Moscow': '莫斯科时间',
              'Australia/Sydney': '悉尼时间',
              'Australia/Melbourne': '墨尔本时间',
              'Pacific/Auckland': '奥克兰时间'
            };
            
            const offsetStr = offset >= 0 ? '+' + offset : offset;
            const timezoneName = timezoneNames[tz] || tz;
            return timezoneName + ' (UTC' + offsetStr + ')';
          } catch (error) {
            console.error('格式化时区显示失败:', error);
            return tz;
          }
        }
        function update() {
          const now = new Date();
          const timeStr = formatTime(now, globalTimezone);
          const tzStr = formatTimezoneDisplay(globalTimezone);
          const el = document.getElementById('systemTimeDisplay');
          if (el) {
            el.textContent = timeStr + '  ' + tzStr;
          }
        }
        update();
        // 每秒刷新
        setInterval(update, 1000);
        
        // 定期检查时区变化并重新加载订阅列表（每30秒检查一次）
        setInterval(async () => {
          try {
            const response = await fetch('/api/config');
            const config = await response.json();
            const newTimezone = config.TIMEZONE || 'UTC';
            
            if (globalTimezone !== newTimezone) {
              globalTimezone = newTimezone;
              console.log('时区已更新为:', globalTimezone);
              // 重新加载订阅列表以更新天数计算
              loadSubscriptions();
            }
          } catch (error) {
            console.error('检查时区更新失败:', error);
          }
        }, 30000);
        
        // 初始加载订阅列表
        loadSubscriptions();
      } catch (e) {
        // 出错时显示本地时间
        const el = document.getElementById('systemTimeDisplay');
        if (el) {
          el.textContent = new Date().toLocaleString();
        }
      }
    }
    showSystemTime();
  </script>
</body>
</html>
`;

const configPage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>系统配置 - 订阅管理系统</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <style>
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); transition: all 0.3s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-secondary { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); transition: all 0.3s; }
    .btn-secondary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    
    .toast {
      position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px;
      color: white; font-weight: 500; z-index: 1000; transform: translateX(400px);
      transition: all 0.3s ease-in-out; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .toast.show { transform: translateX(0); }
    .toast.success { background-color: #10b981; }
    .toast.error { background-color: #ef4444; }
    .toast.info { background-color: #3b82f6; }
    .toast.warning { background-color: #f59e0b; }
    
    .config-section { 
      border: 1px solid #e5e7eb; 
      border-radius: 8px; 
      padding: 16px; 
      margin-bottom: 24px; 
    }
    .config-section.active { 
      background-color: #f8fafc; 
      border-color: #6366f1; 
    }
    .config-section.inactive { 
      display: none;
    }
  </style>
${DARK_MODE_SNIPPET}</head>

<body class="bg-gray-100 min-h-screen">
  <div id="toast-container"></div>

  <nav class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <i class="fas fa-calendar-check text-indigo-600 text-2xl mr-2"></i>
          <span class="font-bold text-xl text-gray-800">订阅管理系统</span>
          <span id="systemTimeDisplay" class="ml-4 text-base text-indigo-600 font-normal"></span>
        </div>
        <div class="flex items-center space-x-4">
          <a href="/admin/dashboard" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-chart-line mr-1"></i>仪表盘
          </a>
          <a href="/admin" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-list mr-1"></i>订阅列表
          </a>
          <a href="/admin/config" class="text-indigo-600 border-b-2 border-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-cog mr-1"></i>系统配置
          </a>
          <a href="/api/logout" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-sign-out-alt mr-1"></i>退出登录
          </a>
        </div>
      </div>
    </div>
  </nav>
  
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">系统配置</h2>
      
      <form id="configForm" class="space-y-8">
        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">管理员账户</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="adminUsername" class="block text-sm font-medium text-gray-700">用户名</label>
              <input type="text" id="adminUsername" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            </div>
            <div>
              <label for="adminPassword" class="block text-sm font-medium text-gray-700">密码</label>
              <input type="password" id="adminPassword" placeholder="如不修改密码，请留空" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <p class="mt-1 text-sm text-gray-500">留空表示不修改当前密码</p>
            </div>
          </div>
        </div>
        
        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">显示设置</h3>
          
          
          <div class="mb-6">
            <label class="inline-flex items-center">
              <input type="checkbox" id="showLunarGlobal" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked>
              <span class="ml-2 text-sm text-gray-700">在通知中显示农历日期</span>
            </label>
            <p class="mt-1 text-sm text-gray-500">控制是否在通知消息中包含农历日期信息</p>
          </div>
          <div class="mb-6">
            <label class="inline-flex items-center">
              <input type="checkbox" id="darkModeToggle" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
              <span class="ml-2 text-sm text-gray-700">启用暗黑模式</span>
            </label>
            <p class="mt-1 text-sm text-gray-500">切换深色界面主题，偏好保存在本地浏览器中，对所有页面生效</p>
          </div>
        </div>


        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">时区设置</h3>
          <div class="mb-6">
          <label for="timezone" class="block text-sm font-medium text-gray-700 mb-1">时区选择</label>
          <select id="timezone" name="timezone" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
            <option value="UTC">世界标准时间（UTC+0）</option>
            <option value="Asia/Shanghai">中国标准时间（UTC+8）</option>
            <option value="Asia/Hong_Kong">香港时间（UTC+8）</option>
            <option value="Asia/Taipei">台北时间（UTC+8）</option>
            <option value="Asia/Singapore">新加坡时间（UTC+8）</option>
            <option value="Asia/Tokyo">日本时间（UTC+9）</option>
            <option value="Asia/Seoul">韩国时间（UTC+9）</option>
            <option value="America/New_York">美国东部时间（UTC-5）</option>
            <option value="America/Chicago">美国中部时间（UTC-6）</option>
            <option value="America/Denver">美国山地时间（UTC-7）</option>
            <option value="America/Los_Angeles">美国太平洋时间（UTC-8）</option>
            <option value="Europe/London">英国时间（UTC+0）</option>
            <option value="Europe/Paris">巴黎时间（UTC+1）</option>
            <option value="Europe/Berlin">柏林时间（UTC+1）</option>
            <option value="Europe/Moscow">莫斯科时间（UTC+3）</option>
            <option value="Australia/Sydney">悉尼时间（UTC+10）</option>
            <option value="Australia/Melbourne">墨尔本时间（UTC+10）</option>
            <option value="Pacific/Auckland">奥克兰时间（UTC+12）</option>
          </select>
            <p class="mt-1 text-sm text-gray-500">选择需要使用时区，系统会按该时区计算剩余时间（提醒 Cron 仍基于 UTC，请在 Cloudflare 控制台换算触发时间）</p>
          </div>
        </div>

        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">财务设置</h3>
          <div class="mb-6">
            <label for="exchangeRates" class="block text-sm font-medium text-gray-700">多币种汇率（JSON，以 CNY 为基准）</label>
            <textarea id="exchangeRates" rows="5"
              placeholder='{"CNY": 1, "USD": 6.98, "EUR": 8.16}'
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"></textarea>
            <p class="mt-1 text-sm text-gray-500">仪表盘统计会将各币种金额按此汇率换算后汇总；键为币种代码，值为兑换为 CNY 的汇率。留空或格式错误时使用默认汇率。</p>
          </div>
        </div>

        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">数据管理</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-indigo-50 border border-indigo-100 rounded-md p-4">
              <h4 class="text-sm font-medium text-indigo-900 mb-2"><i class="fas fa-download mr-1"></i>导出备份</h4>
              <p class="text-xs text-indigo-700 mb-3">下载全部订阅数据的 JSON 备份文件（不含管理员密码等敏感信息）。</p>
              <button type="button" id="exportDataBtn" class="btn-info text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-file-export mr-1"></i>导出数据
              </button>
            </div>
            <div class="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h4 class="text-sm font-medium text-gray-900 mb-2"><i class="fas fa-upload mr-1"></i>导入恢复</h4>
              <p class="text-xs text-gray-600 mb-3">从导出的 JSON 备份文件恢复订阅数据。</p>
              <div class="flex flex-col gap-2">
                <input type="file" id="importFile" accept=".json,application/json"
                  class="w-full min-w-0 text-xs text-gray-600 border border-gray-300 rounded-md px-2 py-1.5">
                <div class="flex flex-wrap gap-2">
                  <select id="importMode" class="flex-1 min-w-0 text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white">
                    <option value="merge">合并（跳过重复）</option>
                    <option value="replace">替换（清空现有）</option>
                  </select>
                  <button type="button" id="importDataBtn" class="btn-info text-white px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap">
                    导入
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
            <h4 class="text-sm font-medium text-gray-900 mb-2"><i class="fas fa-cloud mr-1"></i>WebDAV 云备份</h4>
            <p class="text-xs text-gray-600 mb-3">将备份上传到你的 WebDAV 网盘（如坚果云、Alist、Nextcloud 等）。填写目录地址与账号后先点击上方「保存配置」，再执行备份/查看。备份文件会统一存放在该目录下的子目录中（目录名可自定义，默认 <code>SubsTracker</code>，自动创建）。</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <input type="text" id="webdavUrl" placeholder="WebDAV 目录地址，如 https://dav.jianguoyun.com/dav/backup/"
                class="w-full min-w-0 text-sm border border-gray-300 rounded-md px-2 py-1.5">
              <input type="text" id="webdavDir" placeholder="备份子目录名，默认 SubsTracker"
                class="w-full min-w-0 text-sm border border-gray-300 rounded-md px-2 py-1.5">
              <input type="text" id="webdavUsername" placeholder="WebDAV 用户名"
                class="w-full min-w-0 text-sm border border-gray-300 rounded-md px-2 py-1.5">
              <input type="password" id="webdavPassword" placeholder="WebDAV 密码 / 应用密码"
                class="w-full min-w-0 text-sm border border-gray-300 rounded-md px-2 py-1.5">
            </div>
            <div class="flex flex-wrap gap-2">
              <select id="webdavRestoreMode" class="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white">
                <option value="merge">合并（跳过重复）</option>
                <option value="replace">替换（清空现有）</option>
              </select>
              <button type="button" id="webdavBackupBtn" class="btn-info text-white px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap">
                <i class="fas fa-cloud-upload-alt mr-1"></i>立即备份
              </button>
              <button type="button" id="webdavListBtn" class="btn-secondary text-white px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap">
                <i class="fas fa-sync-alt mr-1"></i>查看远端备份
              </button>
            </div>
            <div id="webdavList" class="mt-3 hidden">
              <div class="text-xs text-gray-500 mb-1">远端备份文件：</div>
              <div id="webdavListItems" class="space-y-1 max-h-60 overflow-y-auto"></div>
            </div>
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700">iCal 日历订阅地址</label>
            <div class="mt-1 flex flex-col sm:flex-row gap-2">
              <input type="text" id="icalUrl" readonly placeholder="配置第三方 API 令牌并保存后生成"
                class="flex-1 border border-gray-200 rounded-md bg-gray-50 py-2 px-3 text-sm text-gray-600 font-mono">
              <button type="button" id="copyIcalUrlBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                <i class="far fa-copy mr-1"></i>复制地址
              </button>
            </div>
            <p class="mt-1 text-sm text-gray-500">将此地址添加到 Apple 日历、Google 日历等支持 iCal 订阅的应用中，即可在日历中查看各订阅的到期提醒。地址使用上方「第三方 API 访问令牌」鉴权。</p>
          </div>
        </div>

        
        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">通知设置</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label for="notificationHours" class="block text-sm font-medium text-gray-700">通知时段（UTC）</label>
              <input type="text" id="notificationHours" placeholder="例如：08, 12, 20 或输入 * 表示全天"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <p class="mt-1 text-sm text-gray-500">可输入多个小时，使用逗号或空格分隔；留空则默认每天执行一次任务即可</p>
            </div>
            <div class="bg-indigo-50 border border-indigo-100 rounded-md p-3 text-sm text-indigo-700">
              <p class="font-medium mb-1">提示</p>
              <p>Cloudflare Workers Cron 以 UTC 计算，例如北京时间 08:00 需设置 Cron 为 <code>0 0 * * *</code> 并在此填入 08。</p>
              <p class="mt-1">若 Cron 已设置为每小时执行，可用该字段限制实际发送提醒的小时段。</p>
            </div>
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-3">通知方式（可多选）</label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="telegram" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">Telegram</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="notifyx" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked>
                <span class="ml-2 text-sm text-gray-700 font-semibold">NotifyX</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="webhook" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">Webhook 通知</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="wechatbot" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">企业微信机器人</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="email" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">邮件通知</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="bark" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">Bark</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="dingtalk" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">钉钉机器人</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="feishu" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">飞书机器人</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="serverchan" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">Server酱</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="pushplus" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">PushPlus</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="wxpusher" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">WxPusher</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="discord" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">Discord</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="slack" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">Slack</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="ntfy" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">ntfy</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="pushover" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">Pushover</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="pushdeer" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">PushDeer</span>
              </label>
            </div>
            <div class="mt-2 flex flex-wrap gap-4">
              <a href="https://www.notifyx.cn/" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> NotifyX官网
              </a>
              <a href="https://webhook.site" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> Webhook 调试工具
              </a>
              <a href="https://developer.work.weixin.qq.com/document/path/91770" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> 企业微信机器人文档
              </a>
              <a href="https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> 获取 Resend API Key
              </a>
              <a href="https://apps.apple.com/cn/app/bark-customed-notifications/id1403753865" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> Bark iOS应用
              </a>
            </div>
          </div>

          <div class="mb-6">
            <label for="thirdPartyToken" class="block text-sm font-medium text-gray-700">第三方 API 访问令牌</label>
            <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
              <input type="text" id="thirdPartyToken" placeholder="建议使用随机字符串，例如：iH5s9vB3..."
                class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <button type="button" id="generateThirdPartyToken" class="btn-info text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                <i class="fas fa-magic mr-2"></i>生成令牌
              </button>
            </div>
            <p class="mt-1 text-sm text-gray-500">调用 /api/notify/{token} 接口时需携带此令牌；留空表示禁用第三方 API 推送。</p>
          </div>
          
          <div id="telegramConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">Telegram 配置</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label for="tgBotToken" class="block text-sm font-medium text-gray-700">Bot Token</label>
                <input type="text" id="tgBotToken" placeholder="从 @BotFather 获取" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
              <div>
                <label for="tgChatId" class="block text-sm font-medium text-gray-700">Chat ID</label>
                <input type="text" id="tgChatId" placeholder="可从 @userinfobot 获取" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testTelegramBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 Telegram 通知
              </button>
            </div>
          </div>
          
          <div id="notifyxConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">NotifyX 配置</h4>
            <div class="mb-4">
              <label for="notifyxApiKey" class="block text-sm font-medium text-gray-700">API Key</label>
              <input type="text" id="notifyxApiKey" placeholder="从 NotifyX 平台获取的 API Key" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <p class="mt-1 text-sm text-gray-500">从 <a href="https://www.notifyx.cn/" target="_blank" class="text-indigo-600 hover:text-indigo-800">NotifyX平台</a> 获取的 API Key</p>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testNotifyXBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 NotifyX 通知
              </button>
            </div>
          </div>

          <div id="webhookConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">Webhook 通知 配置</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="webhookUrl" class="block text-sm font-medium text-gray-700">Webhook 通知 URL</label>
                <input type="url" id="webhookUrl" placeholder="https://your-webhook-endpoint.com/path" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">请填写自建服务或第三方平台提供的 Webhook 地址，例如 <code>https://your-webhook-endpoint.com/path</code></p>
              </div>
              <div>
                <label for="webhookMethod" class="block text-sm font-medium text-gray-700">请求方法</label>
                <select id="webhookMethod" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                </select>
              </div>
              <div>
                <label for="webhookHeaders" class="block text-sm font-medium text-gray-700">自定义请求头 (JSON格式，可选)</label>
                <textarea id="webhookHeaders" rows="3" placeholder='{"Authorization": "Bearer your-token", "Content-Type": "application/json"}' class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                <p class="mt-1 text-sm text-gray-500">JSON格式的自定义请求头，留空使用默认</p>
              </div>
              <div>
                <label for="webhookTemplate" class="block text-sm font-medium text-gray-700">消息模板 (JSON格式，可选)</label>
                <textarea id="webhookTemplate" rows="4" placeholder='{"title": "{{title}}", "content": "{{content}}", "timestamp": "{{timestamp}}"}' class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                <p class="mt-1 text-sm text-gray-500">支持变量: {{title}}, {{content}}, {{timestamp}}。留空使用默认格式</p>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testWebhookBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 Webhook 通知
              </button>
            </div>
          </div>

          <div id="wechatbotConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">企业微信机器人 配置</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="wechatbotWebhook" class="block text-sm font-medium text-gray-700">机器人 Webhook URL</label>
                <input type="url" id="wechatbotWebhook" placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=your-key" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">从企业微信群聊中添加机器人获取的 Webhook URL</p>
              </div>
              <div>
                <label for="wechatbotMsgType" class="block text-sm font-medium text-gray-700">消息类型</label>
                <select id="wechatbotMsgType" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="text">文本消息</option>
                  <option value="markdown">Markdown消息</option>
                </select>
                <p class="mt-1 text-sm text-gray-500">选择发送的消息格式类型</p>
              </div>
              <div>
                <label for="wechatbotAtMobiles" class="block text-sm font-medium text-gray-700">@手机号 (可选)</label>
                <input type="text" id="wechatbotAtMobiles" placeholder="13800138000,13900139000" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">需要@的手机号，多个用逗号分隔，留空则不@任何人</p>
              </div>
              <div>
                <label for="wechatbotAtAll" class="block text-sm font-medium text-gray-700 mb-2">@所有人</label>
                <label class="inline-flex items-center">
                  <input type="checkbox" id="wechatbotAtAll" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                  <span class="ml-2 text-sm text-gray-700">发送消息时@所有人</span>
                </label>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testWechatBotBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 企业微信机器人
              </button>
            </div>
          </div>

          <div id="emailConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">邮件通知 配置</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="resendApiKey" class="block text-sm font-medium text-gray-700">Resend API Key</label>
                <input type="text" id="resendApiKey" placeholder="re_xxxxxxxxxx" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">从 <a href="https://resend.com/api-keys" target="_blank" class="text-indigo-600 hover:text-indigo-800">Resend控制台</a> 获取的 API Key</p>
              </div>
              <div>
                <label for="emailFrom" class="block text-sm font-medium text-gray-700">发件人邮箱</label>
                <input type="email" id="emailFrom" placeholder="noreply@yourdomain.com" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">必须是已在Resend验证的域名邮箱</p>
              </div>
              <div>
                <label for="emailFromName" class="block text-sm font-medium text-gray-700">发件人名称</label>
                <input type="text" id="emailFromName" placeholder="订阅提醒系统" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">显示在邮件中的发件人名称</p>
              </div>
              <div>
                <label for="emailTo" class="block text-sm font-medium text-gray-700">收件人邮箱</label>
                <input type="email" id="emailTo" placeholder="user@example.com" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">接收通知邮件的邮箱地址</p>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testEmailBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 邮件通知
              </button>
            </div>
          </div>

          <div id="barkConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">Bark 配置</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="barkServer" class="block text-sm font-medium text-gray-700">服务器地址</label>
                <input type="url" id="barkServer" placeholder="https://api.day.app" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">Bark 服务器地址，默认为官方服务器，也可以使用自建服务器</p>
              </div>
              <div>
                <label for="barkDeviceKey" class="block text-sm font-medium text-gray-700">设备Key</label>
                <input type="text" id="barkDeviceKey" placeholder="从Bark应用获取的设备Key" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">从 <a href="https://apps.apple.com/cn/app/bark-customed-notifications/id1403753865" target="_blank" class="text-indigo-600 hover:text-indigo-800">Bark iOS 应用</a> 中获取的设备Key</p>
              </div>
              <div>
                <label for="barkIsArchive" class="block text-sm font-medium text-gray-700 mb-2">保存推送</label>
                <label class="inline-flex items-center">
                  <input type="checkbox" id="barkIsArchive" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                  <span class="ml-2 text-sm text-gray-700">保存推送到历史记录</span>
                </label>
                <p class="mt-1 text-sm text-gray-500">勾选后推送消息会保存到 Bark 的历史记录中</p>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testBarkBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 Bark 通知
              </button>
            </div>
          </div>

          <div id="dingtalkConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">钉钉机器人 配置</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="dingtalkWebhook" class="block text-sm font-medium text-gray-700">机器人 Webhook URL</label>
                <input type="url" id="dingtalkWebhook" placeholder="https://oapi.dingtalk.com/robot/send?access_token=xxx" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">钉钉群添加自定义机器人后获取的 Webhook URL</p>
              </div>
              <div>
                <label for="dingtalkSecret" class="block text-sm font-medium text-gray-700">加签密钥（可选）</label>
                <input type="text" id="dingtalkSecret" placeholder="SEC 开头的加签密钥，未开启加签则留空" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">机器人安全设置为“加签”时填写</p>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testDingtalkBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 钉钉机器人
              </button>
            </div>
          </div>

          <div id="feishuConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">飞书机器人 配置</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="feishuWebhook" class="block text-sm font-medium text-gray-700">机器人 Webhook URL</label>
                <input type="url" id="feishuWebhook" placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/xxx" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">飞书群添加自定义机器人后获取的 Webhook URL</p>
              </div>
              <div>
                <label for="feishuSecret" class="block text-sm font-medium text-gray-700">签名校验密钥（可选）</label>
                <input type="text" id="feishuSecret" placeholder="签名校验密钥，未开启则留空" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">机器人安全设置为“签名校验”时填写</p>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testFeishuBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 飞书机器人
              </button>
            </div>
          </div>

          <div id="serverchanConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">Server酱 配置</h4>
            <div class="mb-4">
              <label for="serverchanSendKey" class="block text-sm font-medium text-gray-700">SendKey</label>
              <input type="text" id="serverchanSendKey" placeholder="SCT 开头的 SendKey" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <p class="mt-1 text-sm text-gray-500">从 <a href="https://sct.ftqq.com/" target="_blank" class="text-indigo-600 hover:text-indigo-800">Server酱官网</a> 获取，推送到微信服务号</p>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testServerchanBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 Server酱
              </button>
            </div>
          </div>

          <div id="pushplusConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">PushPlus 配置</h4>
            <div class="mb-4">
              <label for="pushplusToken" class="block text-sm font-medium text-gray-700">Token</label>
              <input type="text" id="pushplusToken" placeholder="从 PushPlus 官网获取的 Token" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <p class="mt-1 text-sm text-gray-500">从 <a href="https://www.pushplus.plus/" target="_blank" class="text-indigo-600 hover:text-indigo-800">PushPlus 官网</a> 获取，推送到微信</p>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testPushplusBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 PushPlus
              </button>
            </div>
          </div>

          <div id="wxpusherConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">WxPusher 配置</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label for="wxpusherAppToken" class="block text-sm font-medium text-gray-700">AppToken</label>
                <input type="text" id="wxpusherAppToken" placeholder="创建应用后获取的 AppToken" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
              <div>
                <label for="wxpusherUid" class="block text-sm font-medium text-gray-700">用户 UID</label>
                <input type="text" id="wxpusherUid" placeholder="关注后获取的 UID，如 UID_xxx" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>
            <p class="mt-1 text-sm text-gray-500 mb-4">从 <a href="https://wxpusher.zjiecode.com/" target="_blank" class="text-indigo-600 hover:text-indigo-800">WxPusher 官网</a> 创建应用并关注后获取，推送到微信</p>
            <div class="flex justify-end">
              <button type="button" id="testWxpusherBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 WxPusher
              </button>
            </div>
          </div>

          <div id="discordConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">Discord 配置</h4>
            <div class="mb-4">
              <label for="discordWebhook" class="block text-sm font-medium text-gray-700">Webhook URL</label>
              <input type="url" id="discordWebhook" placeholder="https://discord.com/api/webhooks/xxx/yyy" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <p class="mt-1 text-sm text-gray-500">频道设置 → 整合 → Webhook 创建后获取</p>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testDiscordBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 Discord
              </button>
            </div>
          </div>

          <div id="slackConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">Slack 配置</h4>
            <div class="mb-4">
              <label for="slackWebhook" class="block text-sm font-medium text-gray-700">Incoming Webhook URL</label>
              <input type="url" id="slackWebhook" placeholder="https://hooks.slack.com/services/Txxx/Bxxx/xxx" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <p class="mt-1 text-sm text-gray-500">Slack 应用中启用 Incoming Webhooks 后获取</p>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testSlackBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 Slack
              </button>
            </div>
          </div>

          <div id="ntfyConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">ntfy 配置</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label for="ntfyServer" class="block text-sm font-medium text-gray-700">服务器地址</label>
                <input type="url" id="ntfyServer" placeholder="https://ntfy.sh" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">默认官方服务器，也可使用自建服务</p>
              </div>
              <div>
                <label for="ntfyTopic" class="block text-sm font-medium text-gray-700">Topic</label>
                <input type="text" id="ntfyTopic" placeholder="自定义主题名，如 substracker-abc123" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">App 中订阅同名主题即可接收，建议使用不易猜测的名称</p>
              </div>
              <div>
                <label for="ntfyToken" class="block text-sm font-medium text-gray-700">访问令牌（可选）</label>
                <input type="text" id="ntfyToken" placeholder="服务器开启鉴权时填写" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testNtfyBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 ntfy
              </button>
            </div>
          </div>

          <div id="pushoverConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">Pushover 配置</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label for="pushoverToken" class="block text-sm font-medium text-gray-700">API Token</label>
                <input type="text" id="pushoverToken" placeholder="创建应用后获取的 API Token" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
              <div>
                <label for="pushoverUser" class="block text-sm font-medium text-gray-700">User Key</label>
                <input type="text" id="pushoverUser" placeholder="Pushover 用户 Key" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>
            <p class="mt-1 text-sm text-gray-500 mb-4">从 <a href="https://pushover.net/" target="_blank" class="text-indigo-600 hover:text-indigo-800">Pushover 官网</a> 获取，iOS/Android 应用推送</p>
            <div class="flex justify-end">
              <button type="button" id="testPushoverBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 Pushover
              </button>
            </div>
          </div>

          <div id="pushdeerConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">PushDeer 配置</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label for="pushdeerServer" class="block text-sm font-medium text-gray-700">服务器地址</label>
                <input type="url" id="pushdeerServer" placeholder="https://api2.pushdeer.com" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">默认官方服务器，也可使用自建服务</p>
              </div>
              <div>
                <label for="pushdeerKey" class="block text-sm font-medium text-gray-700">Push Key</label>
                <input type="text" id="pushdeerKey" placeholder="PDU 开头的 Push Key" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testPushdeerBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>测试 PushDeer
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button type="submit" class="btn-primary text-white px-6 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-save mr-2"></i>保存配置
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    function showToast(message, type = 'success', duration = 3000) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      
      const icon = type === 'success' ? 'check-circle' :
                   type === 'error' ? 'exclamation-circle' :
                   type === 'warning' ? 'exclamation-triangle' : 'info-circle';
      
      toast.innerHTML = '<div class="flex items-center"><i class="fas fa-' + icon + ' mr-2"></i><span>' + message + '</span></div>';
      
      container.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 100);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (container.contains(toast)) {
            container.removeChild(toast);
          }
        }, 300);
      }, duration);
    }

    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();

        document.getElementById('adminUsername').value = config.ADMIN_USERNAME || '';
        document.getElementById('tgBotToken').value = config.TG_BOT_TOKEN || '';
        document.getElementById('tgChatId').value = config.TG_CHAT_ID || '';
        document.getElementById('notifyxApiKey').value = config.NOTIFYX_API_KEY || '';
        document.getElementById('webhookUrl').value = config.WEBHOOK_URL || '';
        document.getElementById('webhookMethod').value = config.WEBHOOK_METHOD || 'POST';
        document.getElementById('webhookHeaders').value = config.WEBHOOK_HEADERS || '';
        document.getElementById('webhookTemplate').value = config.WEBHOOK_TEMPLATE || '';
        document.getElementById('wechatbotWebhook').value = config.WECHATBOT_WEBHOOK || '';
        document.getElementById('wechatbotMsgType').value = config.WECHATBOT_MSG_TYPE || 'text';
        document.getElementById('wechatbotAtMobiles').value = config.WECHATBOT_AT_MOBILES || '';
        document.getElementById('wechatbotAtAll').checked = config.WECHATBOT_AT_ALL === 'true';
        document.getElementById('resendApiKey').value = config.RESEND_API_KEY || '';
        document.getElementById('emailFrom').value = config.EMAIL_FROM || '';
        document.getElementById('emailFromName').value = config.EMAIL_FROM_NAME || '订阅提醒系统';
        document.getElementById('emailTo').value = config.EMAIL_TO || '';
        document.getElementById('barkServer').value = config.BARK_SERVER || 'https://api.day.app';
        document.getElementById('barkDeviceKey').value = config.BARK_DEVICE_KEY || '';
        document.getElementById('barkIsArchive').checked = config.BARK_IS_ARCHIVE === 'true';
        document.getElementById('dingtalkWebhook').value = config.DINGTALK_WEBHOOK || '';
        document.getElementById('dingtalkSecret').value = config.DINGTALK_SECRET || '';
        document.getElementById('feishuWebhook').value = config.FEISHU_WEBHOOK || '';
        document.getElementById('feishuSecret').value = config.FEISHU_SECRET || '';
        document.getElementById('serverchanSendKey').value = config.SERVERCHAN_SENDKEY || '';
        document.getElementById('pushplusToken').value = config.PUSHPLUS_TOKEN || '';
        document.getElementById('wxpusherAppToken').value = config.WXPUSHER_APP_TOKEN || '';
        document.getElementById('wxpusherUid').value = config.WXPUSHER_UID || '';
        document.getElementById('discordWebhook').value = config.DISCORD_WEBHOOK || '';
        document.getElementById('slackWebhook').value = config.SLACK_WEBHOOK || '';
        document.getElementById('ntfyServer').value = config.NTFY_SERVER || 'https://ntfy.sh';
        document.getElementById('ntfyTopic').value = config.NTFY_TOPIC || '';
        document.getElementById('ntfyToken').value = config.NTFY_TOKEN || '';
        document.getElementById('pushoverToken').value = config.PUSHOVER_TOKEN || '';
        document.getElementById('pushoverUser').value = config.PUSHOVER_USER || '';
        document.getElementById('pushdeerServer').value = config.PUSHDEER_SERVER || 'https://api2.pushdeer.com';
        document.getElementById('pushdeerKey').value = config.PUSHDEER_KEY || '';
        document.getElementById('thirdPartyToken').value = config.THIRD_PARTY_API_TOKEN || '';
        // 加载汇率配置（格式化为便于编辑的 JSON）
        const exchangeRatesInput = document.getElementById('exchangeRates');
        if (exchangeRatesInput) {
          exchangeRatesInput.value = config.EXCHANGE_RATES ? JSON.stringify(config.EXCHANGE_RATES, null, 2) : '';
        }
        // 生成 iCal 日历订阅地址（依赖第三方 API 令牌）
        const icalUrlInput = document.getElementById('icalUrl');
        if (icalUrlInput) {
          icalUrlInput.value = config.THIRD_PARTY_API_TOKEN
            ? window.location.origin + '/calendar?token=' + encodeURIComponent(config.THIRD_PARTY_API_TOKEN)
            : '';
        }
        const notificationHoursInput = document.getElementById('notificationHours');
        if (notificationHoursInput) {
          // 将通知小时数组格式化为逗号分隔的字符串，便于管理员查看与编辑
          const hours = Array.isArray(config.NOTIFICATION_HOURS) ? config.NOTIFICATION_HOURS : [];
          notificationHoursInput.value = hours.join(', ');
        }
        
        // 加载农历显示设置
        document.getElementById('showLunarGlobal').checked = config.SHOW_LUNAR === true;

        // 加载 WebDAV 备份配置
        document.getElementById('webdavUrl').value = config.WEBDAV_URL || '';
        document.getElementById('webdavDir').value = config.WEBDAV_DIR || 'SubsTracker';
        document.getElementById('webdavUsername').value = config.WEBDAV_USERNAME || '';
        document.getElementById('webdavPassword').value = config.WEBDAV_PASSWORD || '';

        // 动态生成时区选项，并设置保存的值
        generateTimezoneOptions(config.TIMEZONE || 'UTC');

        // 处理多选通知渠道
        const enabledNotifiers = config.ENABLED_NOTIFIERS || ['notifyx'];
        document.querySelectorAll('input[name="enabledNotifiers"]').forEach(checkbox => {
          checkbox.checked = enabledNotifiers.includes(checkbox.value);
        });

        toggleNotificationConfigs(enabledNotifiers);
      } catch (error) {
        console.error('加载配置失败:', error);
        showToast('加载配置失败，请刷新页面重试', 'error');
      }
    }
    
    // 动态生成时区选项
    function generateTimezoneOptions(selectedTimezone = 'UTC') {
      const timezoneSelect = document.getElementById('timezone');
      
      const timezones = [
        { value: 'UTC', name: '世界标准时间', offset: '+0' },
        { value: 'Asia/Shanghai', name: '中国标准时间', offset: '+8' },
        { value: 'Asia/Hong_Kong', name: '香港时间', offset: '+8' },
        { value: 'Asia/Taipei', name: '台北时间', offset: '+8' },
        { value: 'Asia/Singapore', name: '新加坡时间', offset: '+8' },
        { value: 'Asia/Tokyo', name: '日本时间', offset: '+9' },
        { value: 'Asia/Seoul', name: '韩国时间', offset: '+9' },
        { value: 'America/New_York', name: '美国东部时间', offset: '-5' },
        { value: 'America/Chicago', name: '美国中部时间', offset: '-6' },
        { value: 'America/Denver', name: '美国山地时间', offset: '-7' },
        { value: 'America/Los_Angeles', name: '美国太平洋时间', offset: '-8' },
        { value: 'Europe/London', name: '英国时间', offset: '+0' },
        { value: 'Europe/Paris', name: '巴黎时间', offset: '+1' },
        { value: 'Europe/Berlin', name: '柏林时间', offset: '+1' },
        { value: 'Europe/Moscow', name: '莫斯科时间', offset: '+3' },
        { value: 'Australia/Sydney', name: '悉尼时间', offset: '+10' },
        { value: 'Australia/Melbourne', name: '墨尔本时间', offset: '+10' },
        { value: 'Pacific/Auckland', name: '奥克兰时间', offset: '+12' }
      ];
      
      // 清空现有选项
      timezoneSelect.innerHTML = '';
      
      // 添加新选项
      timezones.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz.value;
        option.textContent = tz.name + '（UTC' + tz.offset + '）';
        timezoneSelect.appendChild(option);
      });
      
      // 设置选中的时区
      timezoneSelect.value = selectedTimezone;
    }
    
    // 渠道标识 → 配置区块 DOM ID 映射
    const NOTIFIER_CONFIG_IDS = {
      telegram: 'telegramConfig',
      notifyx: 'notifyxConfig',
      webhook: 'webhookConfig',
      wechatbot: 'wechatbotConfig',
      email: 'emailConfig',
      bark: 'barkConfig',
      dingtalk: 'dingtalkConfig',
      feishu: 'feishuConfig',
      serverchan: 'serverchanConfig',
      pushplus: 'pushplusConfig',
      wxpusher: 'wxpusherConfig',
      discord: 'discordConfig',
      slack: 'slackConfig',
      ntfy: 'ntfyConfig',
      pushover: 'pushoverConfig',
      pushdeer: 'pushdeerConfig'
    };

    function toggleNotificationConfigs(enabledNotifiers) {
      // 仅显示勾选启用的渠道配置框，其余隐藏
      Object.values(NOTIFIER_CONFIG_IDS).forEach(id => {
        const section = document.getElementById(id);
        if (section) {
          section.classList.add('inactive');
          section.classList.remove('active');
        }
      });

      enabledNotifiers.forEach(type => {
        const section = document.getElementById(NOTIFIER_CONFIG_IDS[type]);
        if (section) {
          section.classList.remove('inactive');
          section.classList.add('active');
        }
      });
    }

    document.querySelectorAll('input[name="enabledNotifiers"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const enabledNotifiers = Array.from(document.querySelectorAll('input[name="enabledNotifiers"]:checked'))
          .map(cb => cb.value);
        toggleNotificationConfigs(enabledNotifiers);
      });
    });
    
    document.getElementById('configForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const enabledNotifiers = Array.from(document.querySelectorAll('input[name="enabledNotifiers"]:checked'))
        .map(cb => cb.value);

      if (enabledNotifiers.length === 0) {
        showToast('请至少选择一种通知方式', 'warning');
        return;
      }

      const config = {
        ADMIN_USERNAME: document.getElementById('adminUsername').value.trim(),
        TG_BOT_TOKEN: document.getElementById('tgBotToken').value.trim(),
        TG_CHAT_ID: document.getElementById('tgChatId').value.trim(),
        NOTIFYX_API_KEY: document.getElementById('notifyxApiKey').value.trim(),
        WEBHOOK_URL: document.getElementById('webhookUrl').value.trim(),
        WEBHOOK_METHOD: document.getElementById('webhookMethod').value,
        WEBHOOK_HEADERS: document.getElementById('webhookHeaders').value.trim(),
        WEBHOOK_TEMPLATE: document.getElementById('webhookTemplate').value.trim(),
        SHOW_LUNAR: document.getElementById('showLunarGlobal').checked,
        WECHATBOT_WEBHOOK: document.getElementById('wechatbotWebhook').value.trim(),
        WECHATBOT_MSG_TYPE: document.getElementById('wechatbotMsgType').value,
        WECHATBOT_AT_MOBILES: document.getElementById('wechatbotAtMobiles').value.trim(),
        WECHATBOT_AT_ALL: document.getElementById('wechatbotAtAll').checked.toString(),
        RESEND_API_KEY: document.getElementById('resendApiKey').value.trim(),
        EMAIL_FROM: document.getElementById('emailFrom').value.trim(),
        EMAIL_FROM_NAME: document.getElementById('emailFromName').value.trim(),
        EMAIL_TO: document.getElementById('emailTo').value.trim(),
        BARK_SERVER: document.getElementById('barkServer').value.trim() || 'https://api.day.app',
        BARK_DEVICE_KEY: document.getElementById('barkDeviceKey').value.trim(),
        BARK_IS_ARCHIVE: document.getElementById('barkIsArchive').checked.toString(),
        DINGTALK_WEBHOOK: document.getElementById('dingtalkWebhook').value.trim(),
        DINGTALK_SECRET: document.getElementById('dingtalkSecret').value.trim(),
        FEISHU_WEBHOOK: document.getElementById('feishuWebhook').value.trim(),
        FEISHU_SECRET: document.getElementById('feishuSecret').value.trim(),
        SERVERCHAN_SENDKEY: document.getElementById('serverchanSendKey').value.trim(),
        PUSHPLUS_TOKEN: document.getElementById('pushplusToken').value.trim(),
        WXPUSHER_APP_TOKEN: document.getElementById('wxpusherAppToken').value.trim(),
        WXPUSHER_UID: document.getElementById('wxpusherUid').value.trim(),
        DISCORD_WEBHOOK: document.getElementById('discordWebhook').value.trim(),
        SLACK_WEBHOOK: document.getElementById('slackWebhook').value.trim(),
        NTFY_SERVER: document.getElementById('ntfyServer').value.trim() || 'https://ntfy.sh',
        NTFY_TOPIC: document.getElementById('ntfyTopic').value.trim(),
        NTFY_TOKEN: document.getElementById('ntfyToken').value.trim(),
        PUSHOVER_TOKEN: document.getElementById('pushoverToken').value.trim(),
        PUSHOVER_USER: document.getElementById('pushoverUser').value.trim(),
        PUSHDEER_SERVER: document.getElementById('pushdeerServer').value.trim() || 'https://api2.pushdeer.com',
        PUSHDEER_KEY: document.getElementById('pushdeerKey').value.trim(),
        ENABLED_NOTIFIERS: enabledNotifiers,
        TIMEZONE: document.getElementById('timezone').value.trim(),
        THIRD_PARTY_API_TOKEN: document.getElementById('thirdPartyToken').value.trim(),
        WEBDAV_URL: document.getElementById('webdavUrl').value.trim(),
        WEBDAV_DIR: document.getElementById('webdavDir').value.trim(),
        WEBDAV_USERNAME: document.getElementById('webdavUsername').value.trim(),
        WEBDAV_PASSWORD: document.getElementById('webdavPassword').value,
        // 汇率配置直接传递原始 JSON 文本，由后端统一解析校验
        EXCHANGE_RATES: document.getElementById('exchangeRates') ? document.getElementById('exchangeRates').value.trim() : '',
        // 前端先行整理通知小时列表，后端仍会再次校验
        NOTIFICATION_HOURS: (() => {
          const raw = document.getElementById('notificationHours').value.trim();
          if (!raw) {
            return [];
          }
          return raw
            .split(/[,，\s]+/)
            .map(item => item.trim())
            .filter(item => item.length > 0);
        })()
      };

      const passwordField = document.getElementById('adminPassword');
      if (passwordField.value.trim()) {
        config.ADMIN_PASSWORD = passwordField.value.trim();
      }

      const submitButton = e.target.querySelector('button[type="submit"]');
      const originalContent = submitButton.innerHTML;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
      submitButton.disabled = true;

      try {
        const response = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });

        const result = await response.json();

        if (result.success) {
          showToast('配置保存成功', 'success');
          passwordField.value = '';
          
          // 更新全局时区并重新显示时间
          globalTimezone = config.TIMEZONE;
          showSystemTime();
          
          // 标记时区已更新，供其他页面检测
          localStorage.setItem('timezoneUpdated', Date.now().toString());
          
          // 如果当前在订阅列表页面，则自动刷新页面以更新时区显示
          if (window.location.pathname === '/admin') {
            window.location.reload();
          }
        } else {
          showToast('配置保存失败: ' + (result.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('保存配置失败:', error);
        showToast('保存配置失败，请稍后再试', 'error');
      } finally {
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
      }
    });
    
    async function testNotification(type) {
      const serviceNameMap = {
        telegram: 'Telegram',
        notifyx: 'NotifyX',
        wechatbot: '企业微信机器人',
        email: '邮件通知',
        bark: 'Bark',
        webhook: 'Webhook 通知',
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
      const buttonIdMap = {
        telegram: 'testTelegramBtn',
        notifyx: 'testNotifyXBtn',
        wechatbot: 'testWechatBotBtn',
        email: 'testEmailBtn',
        bark: 'testBarkBtn',
        webhook: 'testWebhookBtn',
        dingtalk: 'testDingtalkBtn',
        feishu: 'testFeishuBtn',
        serverchan: 'testServerchanBtn',
        pushplus: 'testPushplusBtn',
        wxpusher: 'testWxpusherBtn',
        discord: 'testDiscordBtn',
        slack: 'testSlackBtn',
        ntfy: 'testNtfyBtn',
        pushover: 'testPushoverBtn',
        pushdeer: 'testPushdeerBtn'
      };
      const buttonId = buttonIdMap[type] || 'test' + type.charAt(0).toUpperCase() + type.slice(1) + 'Btn';
      const button = document.getElementById(buttonId);
      if (!button) {
        console.error('未找到测试按钮:', buttonId);
        return;
      }
      const originalContent = button.innerHTML;
      const serviceName = serviceNameMap[type] || type;

      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>测试中...';
      button.disabled = true;

      const config = {};
      if (type === 'telegram') {
        config.TG_BOT_TOKEN = document.getElementById('tgBotToken').value.trim();
        config.TG_CHAT_ID = document.getElementById('tgChatId').value.trim();

        if (!config.TG_BOT_TOKEN || !config.TG_CHAT_ID) {
          showToast('请先填写 Telegram Bot Token 和 Chat ID', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'notifyx') {
        config.NOTIFYX_API_KEY = document.getElementById('notifyxApiKey').value.trim();

        if (!config.NOTIFYX_API_KEY) {
          showToast('请先填写 NotifyX API Key', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'webhook') {
        config.WEBHOOK_URL = document.getElementById('webhookUrl').value.trim();
        config.WEBHOOK_METHOD = document.getElementById('webhookMethod').value;
        config.WEBHOOK_HEADERS = document.getElementById('webhookHeaders').value.trim();
        config.WEBHOOK_TEMPLATE = document.getElementById('webhookTemplate').value.trim();

        if (!config.WEBHOOK_URL) {
          showToast('请先填写 Webhook 通知 URL', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'wechatbot') {
        config.WECHATBOT_WEBHOOK = document.getElementById('wechatbotWebhook').value.trim();
        config.WECHATBOT_MSG_TYPE = document.getElementById('wechatbotMsgType').value;
        config.WECHATBOT_AT_MOBILES = document.getElementById('wechatbotAtMobiles').value.trim();
        config.WECHATBOT_AT_ALL = document.getElementById('wechatbotAtAll').checked.toString();

        if (!config.WECHATBOT_WEBHOOK) {
          showToast('请先填写企业微信机器人 Webhook URL', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'email') {
        config.RESEND_API_KEY = document.getElementById('resendApiKey').value.trim();
        config.EMAIL_FROM = document.getElementById('emailFrom').value.trim();
        config.EMAIL_FROM_NAME = document.getElementById('emailFromName').value.trim();
        config.EMAIL_TO = document.getElementById('emailTo').value.trim();

        if (!config.RESEND_API_KEY || !config.EMAIL_FROM || !config.EMAIL_TO) {
          showToast('请先填写 Resend API Key、发件人邮箱和收件人邮箱', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'bark') {
        config.BARK_SERVER = document.getElementById('barkServer').value.trim() || 'https://api.day.app';
        config.BARK_DEVICE_KEY = document.getElementById('barkDeviceKey').value.trim();
        config.BARK_IS_ARCHIVE = document.getElementById('barkIsArchive').checked.toString();

        if (!config.BARK_DEVICE_KEY) {
          showToast('请先填写 Bark 设备Key', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'dingtalk') {
        config.DINGTALK_WEBHOOK = document.getElementById('dingtalkWebhook').value.trim();
        config.DINGTALK_SECRET = document.getElementById('dingtalkSecret').value.trim();

        if (!config.DINGTALK_WEBHOOK) {
          showToast('请先填写钉钉机器人 Webhook URL', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'feishu') {
        config.FEISHU_WEBHOOK = document.getElementById('feishuWebhook').value.trim();
        config.FEISHU_SECRET = document.getElementById('feishuSecret').value.trim();

        if (!config.FEISHU_WEBHOOK) {
          showToast('请先填写飞书机器人 Webhook URL', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'serverchan') {
        config.SERVERCHAN_SENDKEY = document.getElementById('serverchanSendKey').value.trim();

        if (!config.SERVERCHAN_SENDKEY) {
          showToast('请先填写 Server酱 SendKey', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'pushplus') {
        config.PUSHPLUS_TOKEN = document.getElementById('pushplusToken').value.trim();

        if (!config.PUSHPLUS_TOKEN) {
          showToast('请先填写 PushPlus Token', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'wxpusher') {
        config.WXPUSHER_APP_TOKEN = document.getElementById('wxpusherAppToken').value.trim();
        config.WXPUSHER_UID = document.getElementById('wxpusherUid').value.trim();

        if (!config.WXPUSHER_APP_TOKEN || !config.WXPUSHER_UID) {
          showToast('请先填写 WxPusher AppToken 和用户 UID', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'discord') {
        config.DISCORD_WEBHOOK = document.getElementById('discordWebhook').value.trim();

        if (!config.DISCORD_WEBHOOK) {
          showToast('请先填写 Discord Webhook URL', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'slack') {
        config.SLACK_WEBHOOK = document.getElementById('slackWebhook').value.trim();

        if (!config.SLACK_WEBHOOK) {
          showToast('请先填写 Slack Incoming Webhook URL', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'ntfy') {
        config.NTFY_SERVER = document.getElementById('ntfyServer').value.trim() || 'https://ntfy.sh';
        config.NTFY_TOPIC = document.getElementById('ntfyTopic').value.trim();
        config.NTFY_TOKEN = document.getElementById('ntfyToken').value.trim();

        if (!config.NTFY_TOPIC) {
          showToast('请先填写 ntfy Topic', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'pushover') {
        config.PUSHOVER_TOKEN = document.getElementById('pushoverToken').value.trim();
        config.PUSHOVER_USER = document.getElementById('pushoverUser').value.trim();

        if (!config.PUSHOVER_TOKEN || !config.PUSHOVER_USER) {
          showToast('请先填写 Pushover API Token 和 User Key', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'pushdeer') {
        config.PUSHDEER_SERVER = document.getElementById('pushdeerServer').value.trim() || 'https://api2.pushdeer.com';
        config.PUSHDEER_KEY = document.getElementById('pushdeerKey').value.trim();

        if (!config.PUSHDEER_KEY) {
          showToast('请先填写 PushDeer Push Key', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      }

      try {
        const response = await fetch('/api/test-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: type, ...config })
        });

        const result = await response.json();

        if (result.success) {
          showToast(serviceName + ' 通知测试成功！', 'success');
        } else {
          showToast(serviceName + ' 通知测试失败: ' + (result.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('测试通知失败:', error);
        showToast('测试失败，请稍后再试', 'error');
      } finally {
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    }
    
    document.getElementById('testTelegramBtn').addEventListener('click', () => {
      testNotification('telegram');
    });
    
    document.getElementById('testNotifyXBtn').addEventListener('click', () => {
      testNotification('notifyx');
    });

    document.getElementById('testWebhookBtn').addEventListener('click', () => {
      testNotification('webhook');
    });

    document.getElementById('testWechatBotBtn').addEventListener('click', () => {
      testNotification('wechatbot');
    });

    document.getElementById('testEmailBtn').addEventListener('click', () => {
      testNotification('email');
    });

    document.getElementById('testBarkBtn').addEventListener('click', () => {
      testNotification('bark');
    });

    document.getElementById('testDingtalkBtn').addEventListener('click', () => {
      testNotification('dingtalk');
    });

    document.getElementById('testFeishuBtn').addEventListener('click', () => {
      testNotification('feishu');
    });

    document.getElementById('testServerchanBtn').addEventListener('click', () => {
      testNotification('serverchan');
    });

    document.getElementById('testPushplusBtn').addEventListener('click', () => {
      testNotification('pushplus');
    });

    document.getElementById('testWxpusherBtn').addEventListener('click', () => {
      testNotification('wxpusher');
    });

    document.getElementById('testDiscordBtn').addEventListener('click', () => {
      testNotification('discord');
    });

    document.getElementById('testSlackBtn').addEventListener('click', () => {
      testNotification('slack');
    });

    document.getElementById('testNtfyBtn').addEventListener('click', () => {
      testNotification('ntfy');
    });

    document.getElementById('testPushoverBtn').addEventListener('click', () => {
      testNotification('pushover');
    });

    document.getElementById('testPushdeerBtn').addEventListener('click', () => {
      testNotification('pushdeer');
    });

    document.getElementById('generateThirdPartyToken').addEventListener('click', () => {
      try {
        // 生成 32 位随机令牌，避免出现特殊字符，方便写入 URL
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const buffer = new Uint8Array(32);
        window.crypto.getRandomValues(buffer);
        const token = Array.from(buffer).map(v => charset[v % charset.length]).join('');
        const input = document.getElementById('thirdPartyToken');
        input.value = token;
        input.dispatchEvent(new Event('input'));
        showToast('已生成新的第三方 API 令牌，请保存配置后生效', 'info');
      } catch (error) {
        console.error('生成令牌失败:', error);
        showToast('生成令牌失败，请手动输入', 'error');
      }
    });

    // 令牌变更时同步更新 iCal 订阅地址预览
    const thirdPartyTokenInput = document.getElementById('thirdPartyToken');
    if (thirdPartyTokenInput) {
      thirdPartyTokenInput.addEventListener('input', () => {
        const icalUrlInput = document.getElementById('icalUrl');
        if (icalUrlInput) {
          const tokenValue = thirdPartyTokenInput.value.trim();
          icalUrlInput.value = tokenValue
            ? window.location.origin + '/calendar?token=' + encodeURIComponent(tokenValue)
            : '';
        }
      });
    }

    // 导出订阅数据备份
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', () => {
        window.open('/api/export', '_blank');
      });
    }

    // 导入订阅数据备份
    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) {
      importDataBtn.addEventListener('click', async () => {
        const fileInput = document.getElementById('importFile');
        const modeSelect = document.getElementById('importMode');
        const file = fileInput && fileInput.files && fileInput.files[0];

        if (!file) {
          showToast('请先选择要导入的 JSON 备份文件', 'warning');
          return;
        }

        const mode = modeSelect ? modeSelect.value : 'merge';
        if (mode === 'replace' && !confirm('替换模式将清空当前所有订阅数据，确定继续吗？')) {
          return;
        }

        const originalContent = importDataBtn.innerHTML;
        importDataBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>导入中...';
        importDataBtn.disabled = true;

        try {
          const fileContent = await file.text();
          const importData = JSON.parse(fileContent);
          const response = await fetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscriptions: importData.subscriptions || importData, mode })
          });
          const result = await response.json();
          if (result.success) {
            showToast(result.message || '导入成功', 'success');
          } else {
            showToast(result.message || '导入失败', 'error');
          }
        } catch (error) {
          console.error('导入数据失败:', error);
          showToast('导入失败：文件格式错误或网络异常', 'error');
        } finally {
          importDataBtn.innerHTML = originalContent;
          importDataBtn.disabled = false;
          fileInput.value = '';
        }
      });
    }

    // WebDAV 云备份操作
    const webdavBackupBtn = document.getElementById('webdavBackupBtn');
    if (webdavBackupBtn) {
      webdavBackupBtn.addEventListener('click', async () => {
        if (!document.getElementById('webdavUrl').value.trim()) {
          showToast('请先填写 WebDAV 地址并保存配置', 'warning');
          return;
        }
        const originalContent = webdavBackupBtn.innerHTML;
        webdavBackupBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>备份中...';
        webdavBackupBtn.disabled = true;
        try {
          const response = await fetch('/api/webdav/backup', { method: 'POST' });
          const result = await response.json();
          if (result.success) {
            showToast(result.message || '备份成功', 'success');
            refreshWebdavList();
          } else {
            showToast(result.message || '备份失败', 'error');
          }
        } catch (error) {
          console.error('WebDAV 备份失败:', error);
          showToast('WebDAV 备份失败，请检查网络与配置', 'error');
        } finally {
          webdavBackupBtn.innerHTML = originalContent;
          webdavBackupBtn.disabled = false;
        }
      });
    }

    const webdavListBtn = document.getElementById('webdavListBtn');
    if (webdavListBtn) {
      webdavListBtn.addEventListener('click', refreshWebdavList);
    }

    // 拉取并渲染远端备份文件列表
    async function refreshWebdavList() {
      const listContainer = document.getElementById('webdavList');
      const listItems = document.getElementById('webdavListItems');
      if (!listContainer || !listItems) return;
      try {
        const response = await fetch('/api/webdav/list');
        const result = await response.json();
        if (!result.success) {
          showToast(result.message || '获取备份列表失败', 'error');
          return;
        }
        const files = result.data || [];
        listContainer.classList.remove('hidden');
        if (files.length === 0) {
          listItems.innerHTML = '<div class="text-xs text-gray-500">远端暂无备份文件</div>';
          return;
        }
        listItems.innerHTML = '';
        files.forEach(file => {
          const row = document.createElement('div');
          row.className = 'flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-md px-2 py-1.5';
          const info = document.createElement('div');
          info.className = 'min-w-0 flex-1';
          const displayTime = file.lastModified ? new Date(file.lastModified).toLocaleString() : '未知时间';
          const displaySize = file.size ? (file.size / 1024).toFixed(1) + ' KB' : '未知大小';
          info.innerHTML = '<div class="text-xs text-gray-800 truncate"></div>' +
            '<div class="text-xs text-gray-500"></div>';
          info.firstChild.textContent = file.name;
          info.lastChild.textContent = displayTime + ' · ' + displaySize;
          const restoreBtn = document.createElement('button');
          restoreBtn.type = 'button';
          restoreBtn.className = 'btn-secondary text-white px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap';
          restoreBtn.textContent = '恢复';
          restoreBtn.addEventListener('click', () => restoreWebdavBackup(file.name));
          const deleteBtn = document.createElement('button');
          deleteBtn.type = 'button';
          deleteBtn.className = 'btn-danger text-white px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap';
          deleteBtn.textContent = '删除';
          deleteBtn.addEventListener('click', () => deleteWebdavBackup(file.name));
          row.appendChild(info);
          row.appendChild(restoreBtn);
          row.appendChild(deleteBtn);
          listItems.appendChild(row);
        });
      } catch (error) {
        console.error('获取 WebDAV 备份列表失败:', error);
        showToast('获取备份列表失败，请检查 WebDAV 配置', 'error');
      }
    }

    // 删除远端备份文件
    async function deleteWebdavBackup(filename) {
      if (!confirm('确认删除远端备份「' + filename + '」？此操作不可恢复。')) {
        return;
      }
      try {
        const response = await fetch('/api/webdav/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: filename })
        });
        const result = await response.json();
        if (result.success) {
          showToast(result.message || '删除成功', 'success');
          refreshWebdavList();
        } else {
          showToast(result.message || '删除失败', 'error');
        }
      } catch (error) {
        console.error('WebDAV 删除失败:', error);
        showToast('删除失败，请稍后再试', 'error');
      }
    }

    // 从远端备份文件恢复数据
    async function restoreWebdavBackup(filename) {
      const modeSelect = document.getElementById('webdavRestoreMode');
      const mode = modeSelect ? modeSelect.value : 'merge';
      if (mode === 'replace' && !confirm('替换模式将清空当前所有订阅数据，确定继续吗？')) {
        return;
      }
      if (!confirm('确认从远端备份「' + filename + '」恢复数据？（' + (mode === 'replace' ? '替换' : '合并') + '模式）')) {
        return;
      }
      try {
        const response = await fetch('/api/webdav/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: filename, mode })
        });
        const result = await response.json();
        if (result.success) {
          showToast(result.message || '恢复成功', 'success');
        } else {
          showToast(result.message || '恢复失败', 'error');
        }
      } catch (error) {
        console.error('WebDAV 恢复失败:', error);
        showToast('恢复失败，请稍后再试', 'error');
      }
    }

    // 复制 iCal 订阅地址
    const copyIcalUrlBtn = document.getElementById('copyIcalUrlBtn');
    if (copyIcalUrlBtn) {
      copyIcalUrlBtn.addEventListener('click', async () => {
        const icalUrlInput = document.getElementById('icalUrl');
        if (!icalUrlInput || !icalUrlInput.value) {
          showToast('请先配置第三方 API 令牌并保存', 'warning');
          return;
        }
        try {
          await navigator.clipboard.writeText(icalUrlInput.value);
          showToast('iCal 订阅地址已复制', 'success');
        } catch (error) {
          // 兼容不支持剪贴板 API 的环境
          icalUrlInput.select();
          document.execCommand('copy');
          showToast('iCal 订阅地址已复制', 'success');
        }
      });
    }

    // 暗黑模式开关：立即生效并保存到 localStorage，所有页面共用
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      darkModeToggle.checked = localStorage.getItem('darkMode') === 'true';
      darkModeToggle.addEventListener('change', () => {
        const enabled = darkModeToggle.checked;
        localStorage.setItem('darkMode', enabled ? 'true' : 'false');
        document.documentElement.classList.toggle('dark', enabled);
        showToast(enabled ? '已启用暗黑模式' : '已切换回浅色模式', 'success');
      });
    }

    window.addEventListener('load', loadConfig);
    
    // 全局时区配置
    let globalTimezone = 'UTC';
    
    // 实时显示系统时间和时区
    async function showSystemTime() {
      try {
        // 获取后台配置的时区
        const response = await fetch('/api/config');
        const config = await response.json();
        globalTimezone = config.TIMEZONE || 'UTC';
        
        // 格式化当前时间
        function formatTime(dt, tz) {
          return dt.toLocaleString('zh-CN', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        function formatTimezoneDisplay(tz) {
          try {
            // 使用更准确的时区偏移计算方法
            const now = new Date();
            const dtf = new Intl.DateTimeFormat('en-US', {
              timeZone: tz,
              hour12: false,
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            const parts = dtf.formatToParts(now);
            const get = type => Number(parts.find(x => x.type === type).value);
            const target = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
            const utc = now.getTime();
            const offset = Math.round((target - utc) / (1000 * 60 * 60));
            
            // 时区中文名称映射
            const timezoneNames = {
              'UTC': '世界标准时间',
              'Asia/Shanghai': '中国标准时间',
              'Asia/Hong_Kong': '香港时间',
              'Asia/Taipei': '台北时间',
              'Asia/Singapore': '新加坡时间',
              'Asia/Tokyo': '日本时间',
              'Asia/Seoul': '韩国时间',
              'America/New_York': '美国东部时间',
              'America/Los_Angeles': '美国太平洋时间',
              'America/Chicago': '美国中部时间',
              'America/Denver': '美国山地时间',
              'Europe/London': '英国时间',
              'Europe/Paris': '巴黎时间',
              'Europe/Berlin': '柏林时间',
              'Europe/Moscow': '莫斯科时间',
              'Australia/Sydney': '悉尼时间',
              'Australia/Melbourne': '墨尔本时间',
              'Pacific/Auckland': '奥克兰时间'
            };
            
            const offsetStr = offset >= 0 ? '+' + offset : offset;
            const timezoneName = timezoneNames[tz] || tz;
            return timezoneName + ' (UTC' + offsetStr + ')';
          } catch (error) {
            console.error('格式化时区显示失败:', error);
            return tz;
          }
        }
        function update() {
          const now = new Date();
          const timeStr = formatTime(now, globalTimezone);
          const tzStr = formatTimezoneDisplay(globalTimezone);
          const el = document.getElementById('systemTimeDisplay');
          if (el) {
            el.textContent = timeStr + '  ' + tzStr;
          }
        }
        update();
        // 每秒刷新
        setInterval(update, 1000);
        
        // 定期检查时区变化并重新加载订阅列表（每30秒检查一次）
        setInterval(async () => {
          try {
            const response = await fetch('/api/config');
            const config = await response.json();
            const newTimezone = config.TIMEZONE || 'UTC';
            
            if (globalTimezone !== newTimezone) {
              globalTimezone = newTimezone;
              console.log('时区已更新为:', globalTimezone);
              // 重新加载订阅列表以更新天数计算
              loadSubscriptions();
            }
          } catch (error) {
            console.error('检查时区更新失败:', error);
          }
        }, 30000);
      } catch (e) {
        // 出错时显示本地时间
        const el = document.getElementById('systemTimeDisplay');
        if (el) {
          el.textContent = new Date().toLocaleString();
        }
      }
    }
    showSystemTime();
  </script>
</body>
</html>
`;

// 管理页面
// 与前端一致的分类切割正则，用于提取标签信息
const CATEGORY_SEPARATOR_REGEX = /[\/,，\s]+/;


function dashboardPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>仪表盘 - SubsTracker</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <style>
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); transition: all 0.3s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-secondary { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); transition: all 0.3s; }
    .btn-secondary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .stat-card{background:white;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:transform 0.2s,box-shadow 0.2s}
    .stat-card:hover{transform:translateY(-4px);box-shadow:0 4px 16px rgba(0,0,0,0.15)}
    .stat-card-header{color:#6b7280;font-size:0.875rem;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem}
    .stat-card-value{font-size:2rem;font-weight:700;color:#1f2937;margin-bottom:0.25rem}
    .stat-card-subtitle{color:#9ca3af;font-size:0.875rem}
    .stat-card-trend{display:inline-flex;align-items:center;gap:0.25rem;font-size:0.875rem;margin-top:0.5rem;padding:0.25rem 0.5rem;border-radius:6px}
    .stat-card-trend.up{color:#10b981;background:#d1fae5}
    .stat-card-trend.down{color:#ef4444;background:#fee2e2}
    .stat-card-trend.flat{color:#6b7280;background:#f3f4f6}
    .list-item{display:flex;align-items:center;justify-content:space-between;padding:1rem;border-radius:8px;transition:background 0.2s}
    .list-item:hover{background:#f9fafb}
    .list-item:not(:last-child){border-bottom:1px solid #f3f4f6}
    .list-item-content{flex:1}
    .list-item-name{font-weight:600;color:#1f2937;margin-bottom:0.25rem}
    .list-item-meta{display:flex;align-items:center;gap:1rem;font-size:0.875rem;color:#6b7280;flex-wrap:wrap}
    .list-item-amount{font-size:1.125rem;font-weight:700;color:#10b981}
    .list-item-badge{display:inline-block;padding:0.25rem 0.75rem;border-radius:12px;font-size:0.75rem;font-weight:500;background:#e0e7ff;color:#4f46e5}
    .ranking-item{margin-bottom:1rem}
    .ranking-item-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem}
    .ranking-item-name{font-weight:600;color:#1f2937}
    .ranking-item-value{display:flex;align-items:center;gap:0.5rem;font-size:0.875rem}
    .ranking-item-amount{font-weight:700;color:#1f2937}
    .ranking-item-percentage{color:#10b981}
    .ranking-progress{width:100%;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden}
    .ranking-progress-bar{height:100%;border-radius:4px;transition:width 0.6s ease}
    .ranking-progress-bar.color-1{background:linear-gradient(90deg,#6366f1,#8b5cf6)}
    .ranking-progress-bar.color-2{background:linear-gradient(90deg,#10b981,#059669)}
    .ranking-progress-bar.color-3{background:linear-gradient(90deg,#f59e0b,#d97706)}
    .ranking-progress-bar.color-4{background:linear-gradient(90deg,#ef4444,#dc2626)}
    .ranking-progress-bar.color-5{background:linear-gradient(90deg,#8b5cf6,#7c3aed)}
    .empty-state{text-align:center;padding:3rem 1rem;color:#9ca3af}
    .empty-state-icon{font-size:3rem;margin-bottom:1rem;opacity:0.5}
    .empty-state-text{font-size:0.875rem}
    .loading-skeleton{background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:200% 100%;animation:loading 1.5s infinite;height:100px;border-radius:8px}
    @keyframes loading{0%{background-position:200% 0}100%{background-position:-200% 0}}
  </style>
${DARK_MODE_SNIPPET}</head>

<body class="bg-gray-50">
  <nav class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <i class="fas fa-calendar-check text-indigo-600 text-2xl mr-2"></i>
          <span class="font-bold text-xl text-gray-800">订阅管理系统</span>
        </div>
        <div class="flex items-center space-x-4">
          <a href="/admin/dashboard" class="text-indigo-600 border-b-2 border-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-chart-line mr-1"></i>仪表盘
          </a>
          <a href="/admin" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-list mr-1"></i>订阅列表
          </a>
          <a href="/admin/config" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-cog mr-1"></i>系统配置
          </a>
          <a href="/api/logout" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-sign-out-alt mr-1"></i>退出登录
          </a>
        </div>
      </div>
    </div>
  </nav>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">📊 仪表板</h2>
        <p class="text-sm text-gray-500 mt-1">订阅费用和活动概览（统计金额已折合为 CNY）</p>
      </div>
      <div class="flex items-center gap-2 relative">
        <button type="button" id="cardSettingsBtn" class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
          <i class="fas fa-th-large mr-1"></i>编辑卡片
        </button>
        <div id="cardSettingsPanel" class="hidden absolute right-0 top-11 z-20 w-60 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <div class="text-xs text-gray-500 mb-2">勾选要显示的卡片（偏好保存后跨设备同步）</div>
          <div id="cardSettingsList" class="space-y-1"></div>
        </div>
      </div>
    </div>

    <div id="statsGrid" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div id="card-statMonthly" class="stat-card"><div class="loading-skeleton"></div></div>
      <div id="card-statYearly" class="stat-card"><div class="loading-skeleton"></div></div>
      <div id="card-statActive" class="stat-card"><div class="loading-skeleton"></div></div>
      <div id="card-statDaily" class="stat-card"><div class="loading-skeleton"></div></div>
      <div id="card-statCountdown" class="stat-card"><div class="loading-skeleton"></div></div>
      <div id="card-statPaidPending" class="stat-card"><div class="loading-skeleton"></div></div>
    </div>

    <div id="card-trendCard" class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fas fa-chart-line text-indigo-500"></i>
          <h3 class="text-lg font-medium text-gray-900">支出趋势</h3>
        </div>
        <span class="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">近12个月 (折合CNY)</span>
      </div>
      <div class="p-6" id="expenseTrend">
        <div class="loading-skeleton"></div>
      </div>
    </div>

    <div id="card-currencyCard" class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fas fa-coins text-yellow-500"></i>
          <h3 class="text-lg font-medium text-gray-900">币种分布</h3>
        </div>
        <span class="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">活跃订阅月均金额</span>
      </div>
      <div class="p-6" id="currencyDist">
        <div class="loading-skeleton"></div>
      </div>
    </div>

    <div id="card-recentCard" class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fas fa-calendar-check text-blue-500"></i>
          <h3 class="text-lg font-medium text-gray-900">最近支付</h3>
        </div>
        <span class="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">过去7天</span>
      </div>
      <div class="p-6" id="recentPayments">
        <div class="loading-skeleton"></div>
      </div>
    </div>

    <div id="card-upcomingCard" class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fas fa-clock text-yellow-500"></i>
          <h3 class="text-lg font-medium text-gray-900">即将续费</h3>
        </div>
        <select id="upcomingDays" class="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white">
                  <option value="3">未来3天</option>
                  <option value="7" selected>未来7天</option>
                  <option value="30">未来30天</option>
                  <option value="60">未来60天</option>
                  <option value="180">未来180天</option>
                </select>
      </div>
      <div class="p-6" id="upcomingRenewals">
        <div class="loading-skeleton"></div>
      </div>
    </div>

    <div id="rankingsToolbar" class="flex items-center justify-between mb-3">
      <span class="text-sm text-gray-500">支出排行统计周期（点击排行项可跳转到对应订阅）</span>
      <select id="rankingPeriod" class="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white">
        <option value="year">本年</option>
        <option value="12m">近12个月</option>
      </select>
    </div>

    <div id="rankingsGrid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div id="card-typeCard" class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <i class="fas fa-chart-bar text-purple-500"></i>
          <h3 class="text-lg font-medium text-gray-900">按类型支出排行</h3>
        </div>
        <div class="p-6" id="expenseByType">
          <div class="loading-skeleton"></div>
        </div>
      </div>

      <div id="card-categoryCard" class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <i class="fas fa-folder text-green-500"></i>
          <h3 class="text-lg font-medium text-gray-900">按分类支出统计</h3>
        </div>
        <div class="p-6" id="expenseByCategory">
          <div class="loading-skeleton"></div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // 定义货币符号映射
    const currencySymbols = {
      'CNY': '¥', 'USD': '$', 'HKD': 'HK$', 'TWD': 'NT$', 
      'JPY': '¥', 'EUR': '€', 'GBP': '£', 'KRW': '₩'
    };
    function getSymbol(currency) {
      return currencySymbols[currency] || '¥';
    }

    // 卡片 ID 与显示名称（与后端 DASHBOARD_CARD_IDS 保持一致）
    const CARD_LABELS = {
      statMonthly: '月度支出', statYearly: '年度支出', statActive: '活跃订阅',
      statDaily: '日均成本', statCountdown: '到期倒计时', statPaidPending: '本月已付/待付',
      trendCard: '支出趋势', currencyCard: '币种分布', recentCard: '最近支付',
      upcomingCard: '即将续费', typeCard: '按类型支出排行', categoryCard: '按分类支出统计'
    };
    let dashboardCards = {};
    let dashboardPeriod = 'year';
    let upcomingDays = 7;

    function applyCardVisibility() {
      let rankingsVisible = false;
      Object.keys(CARD_LABELS).forEach(id => {
        const el = document.getElementById('card-' + id);
        if (!el) return;
        const visible = dashboardCards[id] !== false;
        el.style.display = visible ? '' : 'none';
        if (id === 'typeCard' || id === 'categoryCard') rankingsVisible = rankingsVisible || visible;
      });
      const toolbar = document.getElementById('rankingsToolbar');
      if (toolbar) toolbar.style.display = rankingsVisible ? '' : 'none';
    }

    async function loadCardPreferences() {
      try {
        const r = await fetch('/api/config');
        const cfg = await r.json();
        dashboardCards = (cfg && cfg.DASHBOARD_CARDS && typeof cfg.DASHBOARD_CARDS === 'object') ? cfg.DASHBOARD_CARDS : {};
      } catch (e) {
        dashboardCards = {};
      }
      applyCardVisibility();
      renderCardSettings();
    }

    function renderCardSettings() {
      const list = document.getElementById('cardSettingsList');
      if (!list) return;
      list.innerHTML = Object.entries(CARD_LABELS).map(([id, label]) => \`
        <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer py-0.5">
          <input type="checkbox" data-card-id="\${id}" \${dashboardCards[id] !== false ? 'checked' : ''} class="card-pref-checkbox">
          \${label}
        </label>
      \`).join('');
      list.querySelectorAll('.card-pref-checkbox').forEach(cb => {
        cb.addEventListener('change', saveCardPreferences);
      });
    }

    async function saveCardPreferences() {
      document.querySelectorAll('.card-pref-checkbox').forEach(cb => {
        dashboardCards[cb.dataset.cardId] = cb.checked;
      });
      applyCardVisibility();
      try {
        const r = await fetch('/api/dashboard/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cards: dashboardCards })
        });
        const d = await r.json();
        if (!d.success) throw new Error(d.message || '保存失败');
      } catch (e) {
        console.error('保存卡片偏好失败:', e);
      }
    }

    function renderStatCards(data) {
      const monthly = document.getElementById('card-statMonthly');
      if (monthly) {
        monthly.innerHTML = \`
          <div class="stat-card-header">月度支出 (CNY)</div>
          <div class="stat-card-value">¥\${data.monthlyExpense.amount.toFixed(2)}</div>
          <div class="stat-card-subtitle">本月折合支出</div>
          <div class="stat-card-trend \${data.monthlyExpense.trendDirection}">
            <i class="fas fa-arrow-\${data.monthlyExpense.trendDirection==='up'?'up':data.monthlyExpense.trendDirection==='down'?'down':'right'}"></i>
            \${data.monthlyExpense.trend}%
          </div>
        \`;
      }
      const yearly = document.getElementById('card-statYearly');
      if (yearly) {
        yearly.innerHTML = \`
          <div class="stat-card-header">年度支出 (CNY)</div>
          <div class="stat-card-value">¥\${data.yearlyExpense.amount.toFixed(2)}</div>
          <div class="stat-card-subtitle">月均支出: ¥\${data.yearlyExpense.monthlyAverage.toFixed(2)}</div>
        \`;
      }
      const active = document.getElementById('card-statActive');
      if (active) {
        active.innerHTML = \`
          <div class="stat-card-header">活跃订阅</div>
          <div class="stat-card-value">\${data.activeSubscriptions.active}</div>
          <div class="stat-card-subtitle">总订阅数: \${data.activeSubscriptions.total}</div>
          \${data.activeSubscriptions.expiringSoon > 0 ? \`<div class="stat-card-trend down"><i class="fas fa-exclamation-circle"></i>\${data.activeSubscriptions.expiringSoon} 即将到期</div>\` : ''}
        \`;
      }
      const daily = document.getElementById('card-statDaily');
      if (daily) {
        daily.innerHTML = \`
          <div class="stat-card-header">日均成本 (CNY)</div>
          <div class="stat-card-value">¥\${(data.yearlyExpense.amount / 365).toFixed(2)}</div>
          <div class="stat-card-subtitle">年度支出 ÷ 365</div>
        \`;
      }
      const countdown = document.getElementById('card-statCountdown');
      if (countdown) {
        countdown.innerHTML = data.nextExpiry ? \`
          <div class="stat-card-header">到期倒计时</div>
          <div class="stat-card-value">\${data.nextExpiry.daysRemaining === 0 ? '今天' : data.nextExpiry.daysRemaining + ' 天'}</div>
          <div class="stat-card-subtitle">\${data.nextExpiry.name} · \${new Date(data.nextExpiry.expiryDate).toLocaleDateString('zh-CN')}</div>
        \` : \`
          <div class="stat-card-header">到期倒计时</div>
          <div class="stat-card-value" style="font-size:1.25rem">—</div>
          <div class="stat-card-subtitle">暂无即将到期的订阅</div>
        \`;
      }
      const paidPending = document.getElementById('card-statPaidPending');
      if (paidPending) {
        const mb = data.monthlyBreakdown || { paid: 0, pending: 0 };
        paidPending.innerHTML = \`
          <div class="stat-card-header">本月已付 / 待付 (CNY)</div>
          <div class="stat-card-value" style="font-size:1.5rem">¥\${mb.paid.toFixed(2)} / ¥\${mb.pending.toFixed(2)}</div>
          <div class="stat-card-subtitle">合计 ¥\${(mb.paid + mb.pending).toFixed(2)}</div>
        \`;
      }
    }

    function renderTrendCard(data) {
      const trend = document.getElementById('expenseTrend');
      if (!trend) return;
      const items = data.monthlyTrend || [];
      if (items.length === 0) {
        trend.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📈</div><div class="empty-state-text">暂无支出数据</div></div>';
        return;
      }
      const max = Math.max(...items.map(m => m.amount), 1);
      trend.innerHTML = '<div style="display:flex;align-items:flex-end;gap:4px;height:200px">' + items.map(m => \`
        <div style="flex:1;height:100%;display:flex;flex-direction:column;align-items:center;gap:4px" title="\${m.month}: ¥\${m.amount.toFixed(2)}">
          <span style="font-size:0.625rem;color:#6b7280">\${m.amount > 0 ? '¥' + m.amount.toFixed(0) : ''}</span>
          <div style="flex:1;width:70%;max-width:32px;display:flex;align-items:flex-end">
            <div style="width:100%;height:\${m.amount > 0 ? Math.max((m.amount / max) * 100, 5) : 1}%;background:linear-gradient(180deg,#818cf8,#6366f1);border-radius:4px 4px 0 0;min-height:2px"></div>
          </div>
          <span style="font-size:0.625rem;color:#9ca3af;white-space:nowrap">\${m.month.slice(5)}月</span>
        </div>
      \`).join('') + '</div>';
    }

    function renderCurrencyCard(data) {
      const cd = document.getElementById('currencyDist');
      if (!cd) return;
      const items = data.currencyDistribution || [];
      cd.innerHTML = items.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🪙</div><div class="empty-state-text">暂无活跃订阅</div></div>' :
        items.map(item => \`
          <div class="list-item">
            <div class="list-item-content">
              <div class="list-item-name">\${item.currency}</div>
            </div>
            <div class="list-item-amount">\${getSymbol(item.currency)}\${item.amount.toFixed(2)}<span style="font-size:0.75rem;font-weight:400;color:#9ca3af"> /月</span></div>
          </div>
        \`).join('');
    }

    async function loadDashboardData(){
      try {
        const r=await fetch('/api/dashboard/stats?days=' + upcomingDays + (dashboardPeriod === '12m' ? '&period=12m' : ''));
        const d=await r.json();
        if(!d.success) throw new Error(d.message||'加载失败');
        
        const data=d.data;
        renderStatCards(data);
        renderTrendCard(data);
        renderCurrencyCard(data);
        
        const rp=document.getElementById('recentPayments');
        if (rp) rp.innerHTML=data.recentPayments.length===0?'<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">过去7天内没有支付记录</div></div>':
        data.recentPayments.map(s=>\`
          <div class="list-item">
            <div class="list-item-content">
              <div class="list-item-name">\${s.name}</div>
              <div class="list-item-meta">
                <span><i class="fas fa-calendar"></i> \${new Date(s.paymentDate).toLocaleDateString('zh-CN')}</span>
                \${s.customType?\`<span class="list-item-badge">\${s.customType}</span>\`:''}
              </div>
            </div>
            <div class="list-item-amount">\${getSymbol(s.currency)}\${(s.amount||0).toFixed(2)}</div>
          </div>
        \`).join('');
        
        const ur=document.getElementById('upcomingRenewals');
        if (ur) ur.innerHTML=data.upcomingRenewals.length===0?'<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">未来'+upcomingDays+'天内没有即将续费的订阅</div></div>':
        data.upcomingRenewals.map(s=>\`
          <div class="list-item">
            <div class="list-item-content">
              <div class="list-item-name">\${s.name}</div>
              <div class="list-item-meta">
                <span><i class="fas fa-clock"></i> \${new Date(s.renewalDate).toLocaleDateString('zh-CN')}</span>
                <span style="color:#f59e0b;font-weight:600">\${s.daysUntilRenewal} 天后</span>
                \${s.customType?\`<span class="list-item-badge">\${s.customType}</span>\`:''}
              </div>
            </div>
            <div class="list-item-amount">\${getSymbol(s.currency)}\${(s.amount||0).toFixed(2)}</div>
          </div>
        \`).join('');
        
        // 支出排行（点击可跳转到订阅列表并预设筛选）
        const et=document.getElementById('expenseByType');
        if (et) et.innerHTML=data.expenseByType.length===0?'<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">暂无支出数据</div></div>':
        data.expenseByType.map((item,i)=>\`
          <div class="ranking-item">
            <div class="ranking-item-header">
              <div class="ranking-item-name"><a href="/admin?search=\${encodeURIComponent(item.type)}" style="color:inherit">\${item.type}</a></div>
              <div class="ranking-item-value">
                <span class="ranking-item-amount">¥\${item.amount.toFixed(2)}</span>
                <span class="ranking-item-percentage">\${item.percentage}%</span>
              </div>
            </div>
            <div class="ranking-progress">
              <div class="ranking-progress-bar color-\${(i%5)+1}" style="width:\${item.percentage}%"></div>
            </div>
          </div>
        \`).join('');
        
        const ec=document.getElementById('expenseByCategory');
        if (ec) ec.innerHTML=data.expenseByCategory.length===0?'<div class="empty-state"><div class="empty-state-icon">📂</div><div class="empty-state-text">暂无支出数据</div></div>':
        data.expenseByCategory.map((item,i)=>\`
          <div class="ranking-item">
            <div class="ranking-item-header">
              <div class="ranking-item-name"><a href="/admin?search=\${encodeURIComponent(item.category)}" style="color:inherit">\${item.category}</a></div>
              <div class="ranking-item-value">
                <span class="ranking-item-amount">¥\${item.amount.toFixed(2)}</span>
                <span class="ranking-item-percentage">\${item.percentage}%</span>
              </div>
            </div>
            <div class="ranking-progress">
              <div class="ranking-progress-bar color-\${(i%5)+1}" style="width:\${item.percentage}%"></div>
            </div>
          </div>
        \`).join('');
      } catch(e){
        console.error('加载仪表盘数据失败:',e);
        const monthly = document.getElementById('card-statMonthly');
        if (monthly) monthly.innerHTML='<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载失败:'+e.message+'</div></div>';
      }
    }

    loadCardPreferences();
    loadDashboardData();
    setInterval(loadDashboardData, 60000);

    // 排行统计周期切换
    const rankingPeriodSelect = document.getElementById('rankingPeriod');
    if (rankingPeriodSelect) {
      rankingPeriodSelect.addEventListener('change', () => {
        dashboardPeriod = rankingPeriodSelect.value;
        loadDashboardData();
      });
    }

    // 即将续费时间窗口切换
    const upcomingDaysSelect = document.getElementById('upcomingDays');
    if (upcomingDaysSelect) {
      upcomingDaysSelect.addEventListener('change', () => {
        upcomingDays = Number(upcomingDaysSelect.value) || 7;
        loadDashboardData();
      });
    }

    // 卡片设置面板开关
    const cardSettingsBtn = document.getElementById('cardSettingsBtn');
    const cardSettingsPanel = document.getElementById('cardSettingsPanel');
    if (cardSettingsBtn && cardSettingsPanel) {
      cardSettingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cardSettingsPanel.classList.toggle('hidden');
      });
      document.addEventListener('click', (e) => {
        if (!cardSettingsPanel.classList.contains('hidden') && !cardSettingsPanel.contains(e.target)) {
          cardSettingsPanel.classList.add('hidden');
        }
      });
    }
  </script>
</body>
</html>`;
}
function extractTagsFromSubscriptions(subscriptions = []) {
  const tagSet = new Set();
  (subscriptions || []).forEach(sub => {
    if (!sub || typeof sub !== 'object') {
      return;
    }
    if (Array.isArray(sub.tags)) {
      sub.tags.forEach(tag => {
        if (typeof tag === 'string' && tag.trim().length > 0) {
          tagSet.add(tag.trim());
        }
      });
    }
    if (typeof sub.category === 'string') {
      sub.category.split(CATEGORY_SEPARATOR_REGEX)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .forEach(tag => tagSet.add(tag));
    }
    if (typeof sub.customType === 'string' && sub.customType.trim().length > 0) {
      tagSet.add(sub.customType.trim());
    }
  });
  return Array.from(tagSet);
}

export { loginPage, adminPage, configPage, dashboardPage, extractTagsFromSubscriptions };
