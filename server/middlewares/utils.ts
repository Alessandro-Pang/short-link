/**
 * 获取客户端 IP 地址
 */
export function getClientIp(request) {
  return (
    request.headers["x-real-ip"] ||
    request.headers["x-forwarded-for"]?.split(",")[0] ||
    request.ip ||
    request.socket.remoteAddress
  );
}

/**
 * 构建转发请求的 headers
 */
export function buildForwardHeaders(request, headerList = []) {
  const headers = {
    "User-Agent": request.headers["user-agent"] || "Unknown",
  };

  const lowerName = (name) => name.toLowerCase();

  if (headerList && headerList.length > 0) {
    headerList.forEach((name) => {
      const lowerCaseName = lowerName(name);
      if (request.headers[lowerCaseName]) {
        headers[name] = request.headers[lowerCaseName];
      }
    });
  } else {
    // 默认转发的 headers
    ["x-real-ip", "x-forwarded-for", "x-forwarded-proto"].forEach((name) => {
      if (request.headers[lowerName(name)]) {
        headers[name] = request.headers[lowerName(name)];
      }
    });
  }

  return headers;
}
