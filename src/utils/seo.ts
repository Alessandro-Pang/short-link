import type { RouteLocationNormalized } from "vue-router";

const DEFAULT_TITLE = "短链接服务 · 免费开源的企业级短链平台";
const DEFAULT_DESC =
	"短链接服务（Short Link）——免费开源、支持统计与权限控制的企业级短链平台。支持自定义别名、二维码、过期与访问限制，部署便捷，稳定可靠。";

function setTag(name: string, content: string) {
	let el = document.querySelector<HTMLMetaElement>(`meta[name='${name}']`);
	if (!el) {
		el = document.createElement("meta");
		el.setAttribute("name", name);
		document.head.appendChild(el);
	}
	el.setAttribute("content", content);
}

function setOG(property: string, content: string) {
	let el = document.querySelector<HTMLMetaElement>(`meta[property='${property}']`);
	if (!el) {
		el = document.createElement("meta");
		el.setAttribute("property", property);
		document.head.appendChild(el);
	}
	el.setAttribute("content", content);
}

function setCanonical(url: string) {
	let link = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
	if (!link) {
		link = document.createElement("link");
		link.setAttribute("rel", "canonical");
		document.head.appendChild(link);
	}
	link.setAttribute("href", url);
}

export function updateSEO(route: RouteLocationNormalized) {
	const titleSuffix = "短链接服务";
	const baseUrl = window.location.origin;
	const path = route.fullPath || route.path;
	const canonical = `${baseUrl}${path}`;

	const meta: any = route.meta || {};
	const title = meta.title ? `${meta.title} · ${titleSuffix}` : DEFAULT_TITLE;
	const description = meta.description || DEFAULT_DESC;

	document.title = title;
	setTag("description", description);

	// robots: private/auth pages should be noindex
	const isPrivate = !!meta.requiresAuth || !!meta.requiresAdmin || meta.noindex === true;
	setTag("robots", isPrivate ? "noindex, nofollow" : "index, follow");

	// Canonical URL
	setCanonical(canonical);

	// Open Graph
	setOG("og:title", title);
	setOG("og:description", description);
	setOG("og:url", canonical);
}
