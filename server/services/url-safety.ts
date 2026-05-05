import { createHash } from "node:crypto";
import { URL_SAFETY_CONFIG } from "../config/url-safety/index.js";
import { isPrivateIp } from "../utils/validation.js";

interface SafetyCheckResult {
	safe: boolean;
	reason?: string;
}

const HIGH_RISK_RE = buildKeywordRegex(URL_SAFETY_CONFIG.HIGH_RISK_KEYWORDS);
const CONTEXTUAL_RISK_RE = buildKeywordRegex(URL_SAFETY_CONFIG.CONTEXTUAL_RISK_KEYWORDS);
const SUSPICIOUS_RE = buildKeywordRegex(URL_SAFETY_CONFIG.SUSPICIOUS_KEYWORDS);

function isAsciiKeyword(keyword: string): boolean {
	return Array.from(keyword).every((char) => char.charCodeAt(0) <= 0x7f);
}

function buildKeywordRegex(keywords: readonly string[]): RegExp {
	const patterns = keywords.map((kw) => {
		const escaped = kw.replace(/[.*+?^${}()|[\\\]]/g, "\\$&");
		if (kw.length <= 3 && isAsciiKeyword(kw)) {
			return `\\b${escaped}\\b`;
		}
		return escaped;
	});
	return new RegExp(patterns.join("|"), "gi");
}

function uniqueMatches(text: string, regex: RegExp): string[] {
	return Array.from(new Set(text.match(regex) || []));
}

function extractHostname(url: string): string {
	try {
		return new URL(url).hostname.toLowerCase();
	} catch {
		return "";
	}
}

function extractTld(hostname: string): string {
	const parts = hostname.split(".");
	return parts.length >= 2 ? parts[parts.length - 1] : "";
}

function matchesWildcard(hostname: string, pattern: string): boolean {
	if (!pattern.includes("*")) {
		return hostname === pattern || hostname.endsWith(`.${pattern}`);
	}

	if (pattern.startsWith("*.")) {
		const bare = pattern.slice(2);
		if (hostname === bare) return true;
	}

	const regexPattern = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");
	const regex = new RegExp(`^${regexPattern}$`, "i");
	return regex.test(hostname);
}

function isWhitelisted(hostname: string): boolean {
	return (URL_SAFETY_CONFIG.DOMAIN_WHITELIST as readonly string[]).some((pattern) =>
		matchesWildcard(hostname, pattern),
	);
}

function isBlacklisted(hostname: string): string | null {
	const tld = extractTld(hostname);
	if ((URL_SAFETY_CONFIG.TLD_BLACKLIST as readonly string[]).includes(tld)) {
		return `黑名单 TLD: .${tld}`;
	}

	for (const pattern of URL_SAFETY_CONFIG.DOMAIN_BLACKLIST as readonly string[]) {
		if (matchesWildcard(hostname, pattern)) {
			return `黑名单域名: ${pattern}`;
		}
	}

	return null;
}

interface FetchMeta {
	title: string;
	description: string;
	keywords: string;
	bodyText: string;
	isSSR: boolean;
}

async function fetchUrlMeta(url: string): Promise<FetchMeta> {
	const empty: FetchMeta = {
		title: "",
		description: "",
		keywords: "",
		bodyText: "",
		isSSR: false,
	};

	try {
		const parsedUrl = new URL(url);
		const hostname = parsedUrl.hostname;

		if (isPrivateIp(hostname)) {
			return empty;
		}
	} catch {
		return empty;
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), URL_SAFETY_CONFIG.FETCH_TIMEOUT_MS);

	try {
		const resp = await fetch(url, {
			method: "GET",
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; LinkSafetyBot/1.0; +https://short-link.example.com)",
				Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
				Connection: "close",
			},
			redirect: "follow",
			signal: controller.signal,
		});

		const ct = resp.headers.get("content-type") || "";
		if (!ct.includes("text/html") && !ct.includes("text/")) {
			return empty;
		}

		const buffer = await resp.arrayBuffer();
		const bytes = new Uint8Array(buffer.slice(0, URL_SAFETY_CONFIG.MAX_BODY_BYTES));

		let html = "";
		try {
			html = new TextDecoder("utf-8").decode(bytes);
		} catch {
			try {
				html = new TextDecoder("gbk").decode(bytes);
			} catch {
				html = new TextDecoder("latin1").decode(bytes);
			}
		}

		const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
		const description =
			html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] || "";
		const kw = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']*)/i)?.[1] || "";

		const textContent = html
			.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
			.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
			.replace(/<[^>]+>/g, "")
			.replace(/\s+/g, " ")
			.trim();

		const isSSR = textContent.length > 200;
		const bodyText = textContent.slice(0, 2000);

		return { title, description, keywords: kw, bodyText, isSSR };
	} catch {
		return empty;
	} finally {
		clearTimeout(timer);
	}
}

function checkMetaKeywords(meta: FetchMeta): string | null {
	const text = [meta.title, meta.description, meta.keywords].join(" ");
	if (!text.trim()) return null;

	const highMatches = uniqueMatches(text, HIGH_RISK_RE);
	if (highMatches.length > 0) {
		const unique = highMatches.slice(0, 3);
		return `页面 meta 包含违规关键词: ${unique.join(", ")}`;
	}

	const contextualMatches = uniqueMatches(text, CONTEXTUAL_RISK_RE);
	const suspiciousMatches = uniqueMatches(text, SUSPICIOUS_RE);

	if (contextualMatches.length >= URL_SAFETY_CONFIG.META_CONTEXTUAL_RISK_THRESHOLD) {
		const list = contextualMatches.slice(0, 3);
		return `页面 meta 包含上下文风险关键词组合: ${list.join(", ")}`;
	}

	if (contextualMatches.length >= 2 && suspiciousMatches.length >= 1) {
		const list = [...contextualMatches, ...suspiciousMatches].slice(0, 3);
		return `页面 meta 包含风险关键词组合: ${list.join(", ")}`;
	}

	if (suspiciousMatches.length >= 2) {
		const list = suspiciousMatches.slice(0, 3);
		return `页面 meta 可疑关键词组合: ${list.join(", ")}`;
	}

	return null;
}

function checkBodyKeywords(bodyText: string): string | null {
	if (!bodyText.trim()) return null;

	const highMatches = uniqueMatches(bodyText, HIGH_RISK_RE);
	if (highMatches.length > 0) {
		const unique = highMatches.slice(0, 3);
		return `页面内容包含违规关键词: ${unique.join(", ")}`;
	}

	const contextualMatches = uniqueMatches(bodyText, CONTEXTUAL_RISK_RE);
	const suspiciousMatches = uniqueMatches(bodyText, SUSPICIOUS_RE);

	if (contextualMatches.length >= URL_SAFETY_CONFIG.BODY_CONTEXTUAL_RISK_THRESHOLD) {
		const list = contextualMatches.slice(0, 3);
		return `页面内容包含上下文风险关键词组合: ${list.join(", ")}`;
	}

	if (contextualMatches.length >= 2 && suspiciousMatches.length >= 2) {
		const list = [...contextualMatches, ...suspiciousMatches].slice(0, 3);
		return `页面内容包含风险关键词组合: ${list.join(", ")}`;
	}

	if (suspiciousMatches.length >= 3) {
		const list = suspiciousMatches.slice(0, 3);
		return `页面内容可疑关键词组合: ${list.join(", ")}`;
	}

	return null;
}

function canonicalizeUrl(rawUrl: string): string {
	let url = rawUrl.replace(/[\t\r\n]/g, "");
	const hashIdx = url.indexOf("#");
	if (hashIdx !== -1) url = url.substring(0, hashIdx);

	let prev = "";
	while (prev !== url) {
		prev = url;
		url = decodeURIComponent(url);
	}

	const parsed = new URL(url.includes("://") ? url : `http://${url}`);
	const hostname = parsed.hostname
		.replace(/\.{2,}/g, ".")
		.replace(/^\.+|\.+$/g, "")
		.toLowerCase();

	let path = parsed.pathname || "/";
	path = path.replace(/\/\.\//g, "/");
	while (path.includes("/../")) {
		const idx = path.indexOf("/../");
		const prevSlash = path.lastIndexOf("/", idx - 1);
		path =
			prevSlash >= 0
				? path.substring(0, prevSlash) + path.substring(idx + 3)
				: path.substring(idx + 3);
	}
	path = path.replace(/\/{2,}/g, "/") || "/";

	let result = hostname + path;
	if (parsed.search) result += parsed.search;

	return Array.from(result)
		.map((ch) => {
			const code = ch.charCodeAt(0);
			return code <= 32 || code >= 127 || ch === "#" || ch === "%"
				? `%${code.toString(16).toUpperCase().padStart(2, "0")}`
				: ch;
		})
		.join("");
}

function generateExpressions(canonicalUrl: string): string[] {
	const qIdx = canonicalUrl.indexOf("?");
	const hostPath = qIdx >= 0 ? canonicalUrl.substring(0, qIdx) : canonicalUrl;
	const query = qIdx >= 0 ? canonicalUrl.substring(qIdx) : "";

	const slashIdx = hostPath.indexOf("/");
	const host = slashIdx >= 0 ? hostPath.substring(0, slashIdx) : hostPath;
	const path = slashIdx >= 0 ? hostPath.substring(slashIdx) : "/";

	const hosts = [host];
	const parts = host.split(".");
	if (parts.length > 2 && !/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
		for (let i = 1; i < Math.min(parts.length - 1, 5); i++) {
			hosts.push(parts.slice(i).join("."));
		}
	}

	const paths = new Set<string>();
	if (query) paths.add(path + query);
	paths.add(path);
	paths.add("/");
	const pathParts = path.split("/").filter(Boolean);
	for (let j = 1; j <= Math.min(pathParts.length, 4); j++) {
		paths.add(`/${pathParts.slice(0, j).join("/")}/`);
	}

	const expressions = new Set<string>();
	for (const h of hosts) {
		for (const p of Array.from(paths)) {
			expressions.add(h + p);
		}
	}
	return Array.from(expressions);
}

function hashPrefix(expression: string): { prefix: Buffer; fullHash: Buffer } {
	const fullHash = createHash("sha256").update(expression).digest();
	return { prefix: fullHash.subarray(0, 4), fullHash };
}

function decodeVarint(data: Buffer, pos: number): [number, number] {
	let result = 0;
	let shift = 0;
	while (pos < data.length) {
		const b = data[pos];
		result |= (b & 0x7f) << shift;
		pos++;
		if (!(b & 0x80)) break;
		shift += 7;
	}
	return [result, pos];
}

function decodeFullHashDetail(data: Buffer): { threatType: string } {
	const THREAT_TYPES: Record<number, string> = {
		0: "THREAT_TYPE_UNSPECIFIED",
		1: "MALWARE",
		2: "SOCIAL_ENGINEERING",
		3: "UNWANTED_SOFTWARE",
		4: "POTENTIALLY_HARMFUL_APPLICATION",
	};
	const THREAT_MESSAGES: Record<string, string> = {
		MALWARE: "该网站可能包含恶意软件或病毒",
		SOCIAL_ENGINEERING: "该网站可能是钓鱼网站，试图窃取您的个人信息",
		UNWANTED_SOFTWARE: "该网站可能包含垃圾软件",
		POTENTIALLY_HARMFUL_APPLICATION: "该网站可能包含有害应用程序",
	};
	let pos = 0;
	let threatType = "";
	while (pos < data.length) {
		const [tag, newPos] = decodeVarint(data, pos);
		pos = newPos;
		const fieldNum = tag >> 3;
		const wireType = tag & 0x7;
		if (wireType === 0) {
			const [val, np] = decodeVarint(data, pos);
			pos = np;
			if (fieldNum === 1) {
				const rawType = THREAT_TYPES[val] || `UNKNOWN(${val})`;
				if (rawType === "THREAT_TYPE_UNSPECIFIED") {
					threatType = "";
				} else {
					threatType = THREAT_MESSAGES[rawType] || rawType;
				}
			}
		} else if (wireType === 2) {
			const [len, np] = decodeVarint(data, pos);
			pos = np + len;
		} else break;
	}
	return { threatType };
}

function decodeFullHashEntry(data: Buffer): {
	fullHash: Buffer;
	details: { threatType: string }[];
} {
	let pos = 0;
	let fullHash: Buffer = Buffer.alloc(0);
	const details: { threatType: string }[] = [];
	while (pos < data.length) {
		const [tag, newPos] = decodeVarint(data, pos);
		pos = newPos;
		const fieldNum = tag >> 3;
		const wireType = tag & 0x7;
		if (wireType === 2) {
			const [len, np] = decodeVarint(data, pos);
			const chunk = data.subarray(np, np + len);
			pos = np + len;
			if (fieldNum === 1) fullHash = chunk;
			else if (fieldNum === 2) details.push(decodeFullHashDetail(chunk));
		} else if (wireType === 0) {
			const [, np] = decodeVarint(data, pos);
			pos = np;
		} else break;
	}
	return { fullHash, details };
}

function decodeSearchResponse(
	data: Buffer,
): { fullHash: Buffer; details: { threatType: string }[] }[] {
	let pos = 0;
	const entries: { fullHash: Buffer; details: { threatType: string }[] }[] = [];
	while (pos < data.length) {
		const [tag, newPos] = decodeVarint(data, pos);
		pos = newPos;
		const fieldNum = tag >> 3;
		const wireType = tag & 0x7;
		if (wireType === 2) {
			const [len, np] = decodeVarint(data, pos);
			const chunk = data.subarray(np, np + len);
			pos = np + len;
			if (fieldNum === 1) entries.push(decodeFullHashEntry(chunk));
		} else if (wireType === 0) {
			const [, np] = decodeVarint(data, pos);
			pos = np;
		} else break;
	}
	return entries;
}

async function googleSafeBrowsingCheck(url: string): Promise<string | null> {
	const apiKey = URL_SAFETY_CONFIG.GOOGLE_SAFE_BROWSING_KEY;
	if (!apiKey) return null;

	try {
		const canonical = canonicalizeUrl(url);
		const expressions = generateExpressions(canonical);
		const prefixMap = new Map<string, Buffer>();

		for (const expr of expressions) {
			const { prefix, fullHash } = hashPrefix(expr);
			prefixMap.set(prefix.toString("base64"), fullHash);
		}

		const params = new URLSearchParams();
		params.set("key", apiKey);
		for (const b64 of Array.from(prefixMap.keys())) {
			params.append("hashPrefixes", b64);
		}

		const resp = await fetch(
			`https://safebrowsing.googleapis.com/v5/hashes:search?${params.toString()}`,
			{ signal: AbortSignal.timeout(8000) },
		);

		if (resp.status !== 200) return null;

		const raw = Buffer.from(await resp.arrayBuffer());
		const entries = decodeSearchResponse(raw);

		for (const entry of entries) {
			for (const [, localFullHash] of Array.from(prefixMap)) {
				if (entry.fullHash.equals(localFullHash)) {
					const types = entry.details.map((d) => d.threatType).filter(Boolean);
					if (types.length > 0) {
						return types[0];
					}
				}
			}
		}
	} catch (error) {
		console.error("Google Safe Browsing API 检查失败:", error);
	}

	return null;
}

export async function checkUrlSafety(url: string): Promise<SafetyCheckResult> {
	if (!URL_SAFETY_CONFIG.ENABLED) {
		return { safe: true };
	}

	const hostname = extractHostname(url);
	if (!hostname) {
		return { safe: false, reason: "无法解析 URL 主机名" };
	}

	if (isWhitelisted(hostname)) {
		return { safe: true };
	}

	const blacklistReason = isBlacklisted(hostname);
	if (blacklistReason) {
		return { safe: false, reason: blacklistReason };
	}

	const meta = await fetchUrlMeta(url);

	const metaKeywordReason = checkMetaKeywords(meta);
	if (metaKeywordReason) {
		return { safe: false, reason: metaKeywordReason };
	}

	if (meta.isSSR) {
		const bodyKeywordReason = checkBodyKeywords(meta.bodyText);
		if (bodyKeywordReason) {
			return { safe: false, reason: bodyKeywordReason };
		}
	}

	const googleReason = await googleSafeBrowsingCheck(url);
	if (googleReason) {
		return { safe: false, reason: googleReason };
	}

	return { safe: true };
}
