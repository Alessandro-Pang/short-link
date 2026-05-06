import type { FastifyReply, FastifyRequest } from "fastify";
import * as authService from "../services/auth.js";
import type { AuthenticatedRequest } from "../types/index.js";

/**
 * 获取用户绑定的身份列表
 */
export async function getUserIdentities(request: FastifyRequest, reply: FastifyReply) {
	try {
		const identities = await authService.getUserIdentities(
			(request as AuthenticatedRequest).user.id,
		);
		return reply.send({
			code: 200,
			msg: "success",
			data: identities,
		});
	} catch (error) {
		request.log.error(error, "getUserIdentities error:");
		return reply.status(500).send({
			code: 500,
			msg: error.message || "Failed to retrieve user identities",
		});
	}
}

/**
 * 绑定新的身份
 */
export async function bindIdentity(request: FastifyRequest, reply: FastifyReply) {
	try {
		const { provider, provider_user_id, provider_email, provider_metadata } = request.body as {
			provider?: string;
			provider_user_id?: string;
			provider_email?: string;
			provider_metadata?: Record<string, unknown>;
		};

		if (!provider || !provider_user_id) {
			return reply.status(400).send({
				code: 400,
				msg: "Provider and provider_user_id are required",
			});
		}

		if (!["github", "google", "email"].includes(provider)) {
			return reply.status(400).send({
				code: 400,
				msg: "Invalid provider",
			});
		}

		const result = await authService.bindUserIdentity((request as AuthenticatedRequest).user.id, {
			provider,
			provider_user_id,
			provider_email,
			provider_metadata,
		});

		return reply.send({
			code: 200,
			msg: "Identity bound successfully",
			data: result,
		});
	} catch (error) {
		request.log.error(error, "bindIdentity error:");
		return reply.status(500).send({
			code: 500,
			msg: error.message || "Failed to bind identity",
		});
	}
}

/**
 * 解绑身份
 */
export async function unbindIdentity(request: FastifyRequest, reply: FastifyReply) {
	try {
		const { provider } = request.params as Record<string, string>;

		if (!["github", "google", "email"].includes(provider)) {
			return reply.status(400).send({
				code: 400,
				msg: "Invalid provider",
			});
		}

		const result = await authService.unbindUserIdentity(
			(request as AuthenticatedRequest).user.id,
			provider,
		);

		return reply.send({
			code: 200,
			msg: "Identity unbound successfully",
			data: result,
		});
	} catch (error) {
		request.log.error(error, "unbindIdentity error:");
		return reply.status(500).send({
			code: 500,
			msg: error.message || "Failed to unbind identity",
		});
	}
}

/**
 * 删除用户账号
 */
export async function deleteAccount(request: FastifyRequest, reply: FastifyReply) {
	try {
		const { reason } = request.body as { reason?: string };

		const result = await authService.deleteUserAccount(
			(request as AuthenticatedRequest).user.id,
			reason as string,
		);

		return reply.send({
			code: 200,
			msg: "Account deleted successfully",
			data: result,
		});
	} catch (error) {
		request.log.error(error, "deleteAccount error:");
		return reply.status(500).send({
			code: 500,
			msg: error.message || "Failed to delete account",
		});
	}
}
