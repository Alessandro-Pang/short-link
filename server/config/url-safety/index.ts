import { ADULT_KEYWORDS } from "./adult.js";
import { DRUGS_KEYWORDS } from "./drugs.js";
import { FRAUD_KEYWORDS } from "./fraud.js";
import { GAMBLING_KEYWORDS } from "./gambling.js";
import { SUSPICIOUS_KEYWORDS } from "./suspicious.js";
import { DOMAIN_WHITELIST, DOMAIN_BLACKLIST, TLD_BLACKLIST } from "./domains.js";

export const URL_SAFETY_CONFIG = {
	ENABLED: process.env.URL_SAFETY_ENABLED !== "false",
	GOOGLE_SAFE_BROWSING_KEY: process.env.GOOGLE_SAFE_BROWSING_KEY || "",
	FETCH_TIMEOUT_MS: 6000,
	MAX_BODY_BYTES: 30_000,
	DOMAIN_WHITELIST: DOMAIN_WHITELIST.split(",")
		.filter(Boolean)
		.map((keyword) => keyword.trim()),
	DOMAIN_BLACKLIST: DOMAIN_BLACKLIST.split(",")
		.filter(Boolean)
		.map((keyword) => keyword.trim()),
	TLD_BLACKLIST: TLD_BLACKLIST.split(",")
		.filter(Boolean)
		.map((keyword) => keyword.trim()),
	HIGH_RISK_KEYWORDS: `
		${GAMBLING_KEYWORDS},
		${ADULT_KEYWORDS},
		${DRUGS_KEYWORDS},
		${FRAUD_KEYWORDS}`
		.split(",")
		.filter(Boolean)
		.map((keyword) => keyword.trim()),
	SUSPICIOUS_KEYWORDS: SUSPICIOUS_KEYWORDS.split(",")
		.filter(Boolean)
		.map((keyword) => keyword.trim()),
} as const;
