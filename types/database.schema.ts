import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "./database";

// 重新导出数据库类型
export type { Database, Tables, TablesInsert, TablesUpdate, Enums };

// 导出常用表类型的别名
export type Link = Tables<"links">;
export type LinkInsert = TablesInsert<"links">;
export type LinkUpdate = TablesUpdate<"links">;

export type LinkAccessLog = Tables<"link_access_logs">;
export type LinkAccessLogInsert = TablesInsert<"link_access_logs">;
export type LinkAccessLogUpdate = TablesUpdate<"link_access_logs">;

export type LoginLog = Tables<"login_logs">;
export type LoginLogInsert = TablesInsert<"login_logs">;
export type LoginLogUpdate = TablesUpdate<"login_logs">;

export type UserProfile = Tables<"user_profiles">;
export type UserProfileInsert = TablesInsert<"user_profiles">;
export type UserProfileUpdate = TablesUpdate<"user_profiles">;

export type UserIdentity = Tables<"user_identities">;
export type UserIdentityInsert = TablesInsert<"user_identities">;
export type UserIdentityUpdate = TablesUpdate<"user_identities">;

export type ExpirationOption = Tables<"expiration_options">;
export type ExpirationOptionInsert = TablesInsert<"expiration_options">;
export type ExpirationOptionUpdate = TablesUpdate<"expiration_options">;
