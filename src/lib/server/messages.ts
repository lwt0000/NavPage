/**
 * Server-generated, user-facing activity/incident text (Simplified Chinese).
 * Centralized here so no Chinese strings are scattered through the checker.
 */
export const serverMessages = {
  wentOffline: "健康检查失败，服务无法访问",
  wentCritical: "健康检查连续失败，服务状态异常",
  recovered: "服务已恢复正常访问",
  perfRecovered: "服务性能已恢复正常",
  degraded: "检测到响应变慢，服务性能下降",
  highLatency: (ms: number) => `检测到高延迟：当前响应 ${ms} 毫秒`,
  latencyNormalized: "响应延迟已恢复正常",
  authRequired: "服务可以访问，但需要登录",
  sslIssue: "SSL 证书校验失败，请检查证书配置",
  timeout: "健康检查请求超时",
  serviceAdded: (name: string) => `新服务已添加：${name}`,
  serviceUpdated: (name: string) => `服务配置已更新：${name}`,
  serviceRemoved: (name: string) => `服务已删除：${name}`,
  maintenanceStarted: "已进入维护模式，暂停健康检查",
  maintenanceEnded: "维护结束，已恢复健康检查",
  incident: {
    offline: "服务离线，等待恢复",
    critical: "服务状态严重异常",
    degraded: "服务性能下降",
  } as Record<string, string>,
  errors: {
    notFound: "未找到对应的服务",
    nameRequired: "请输入服务名称",
    urlInvalid: "地址格式不正确，请以 http:// 或 https:// 开头",
    checkFailed: "检测失败，请稍后重试",
    badRequest: "请求格式不正确",
  },
  seedEvents: [
    { type: "system", severity: "info", message: "监控系统已启动，开始自动健康检查" },
    { type: "ssl-expiring", severity: "warning", message: "SSL 证书将于 30 天后到期，请及时续期" },
    { type: "recovered", severity: "success", message: "中国线路已恢复正常访问" },
    { type: "high-latency", severity: "warning", message: "海外线路延迟升高，已自动重试" },
    { type: "config-updated", severity: "info", message: "面板配置已更新" },
  ],
} as const;
