import * as authService from "../../service/auth";

/**
 * 获取用户绑定的身份列表
 */
export async function getUserIdentities(request, reply) {
  try {
    const identities = await authService.getUserIdentities(request.user.id);
    return reply.send({
      code: 200,
      msg: "success",
      data: identities,
    });
  } catch (error) {
    request.log.error("getUserIdentities error:", error);
    return reply.status(500).send({
      code: 500,
      msg: error.message || "Failed to retrieve user identities",
    });
  }
}

/**
 * 绑定新的身份
 */
export async function bindIdentity(request, reply) {
  try {
    const { provider, provider_user_id, provider_email, provider_metadata } =
      request.body;

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

    const result = await authService.bindUserIdentity(request.user.id, {
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
    request.log.error("bindIdentity error:", error);
    return reply.status(500).send({
      code: 500,
      msg: error.message || "Failed to bind identity",
    });
  }
}

/**
 * 解绑身份
 */
export async function unbindIdentity(request, reply) {
  try {
    const { provider } = request.params;

    if (!["github", "google", "email"].includes(provider)) {
      return reply.status(400).send({
        code: 400,
        msg: "Invalid provider",
      });
    }

    const result = await authService.unbindUserIdentity(
      request.user.id,
      provider,
    );

    return reply.send({
      code: 200,
      msg: "Identity unbound successfully",
      data: result,
    });
  } catch (error) {
    request.log.error("unbindIdentity error:", error);
    return reply.status(500).send({
      code: 500,
      msg: error.message || "Failed to unbind identity",
    });
  }
}

/**
 * 删除用户账号
 */
export async function deleteAccount(request, reply) {
  try {
    const { reason } = request.body;

    const result = await authService.deleteUserAccount(request.user.id, reason);

    return reply.send({
      code: 200,
      msg: "Account deleted successfully",
      data: result,
    });
  } catch (error) {
    request.log.error("deleteAccount error:", error);
    return reply.status(500).send({
      code: 500,
      msg: error.message || "Failed to delete account",
    });
  }
}
