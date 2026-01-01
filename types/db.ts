/*
 * @Description: 数据库类型统一导出
 * 从 database.types.d.ts 导出常用的数据库类型
 */

import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "./database.types";

// 重新导出数据库类型
export type { Database, Tables, TablesInsert, TablesUpdate, Enums };
