/**
 * Shared Domain Types
 * Types shared between frontend and backend
 * Consolidates duplicate definitions
 */

// Re-export database types for convenience
export type {
  Link,
  LinkInsert,
  LinkUpdate,
  LinkAccessLog,
  LinkAccessLogInsert,
  LinkAccessLogUpdate,
  LoginLog,
  LoginLogInsert,
  LoginLogUpdate,
  UserProfile,
  UserProfileInsert,
  UserProfileUpdate,
  UserIdentity,
  UserIdentityInsert,
  UserIdentityUpdate,
  ExpirationOption,
  ExpirationOptionInsert,
  ExpirationOptionUpdate,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  Database,
} from "./database.schema";

// ============================================================================
// Access Control & Security
// ============================================================================

/**
 * Access restrictions configuration for short links
 */
export interface AccessRestrictions {
  /** List of allowed IP addresses (whitelist) */
  ip_whitelist?: string[];
  /** List of blocked IP addresses (blacklist) */
  ip_blacklist?: string[];
  /** List of allowed country codes (ISO 3166-1 alpha-2) */
  allowed_countries?: string[];
  /** List of blocked country codes (ISO 3166-1 alpha-2) */
  blocked_countries?: string[];
  /** List of allowed device types: 'mobile', 'tablet', 'desktop' */
  allowed_devices?: string[];
  /** List of allowed referrer domains */
  allowed_referrers?: string[];
  /** List of blocked referrer domains */
  blocked_referrers?: string[];
}

// ============================================================================
// Link Configuration
// ============================================================================

/**
 * Options for creating a new short link
 */
export interface LinkCreateOptions {
  /** Expiration option ID (predefined expiration rules) */
  expiration_option_id?: number;
  /** Custom expiration date (ISO 8601 format) */
  expiration_date?: string;
  /** Whether the link is active */
  is_active?: boolean;
  /** Link title */
  title?: string;
  /** Link description */
  description?: string;
  /** HTTP redirect type: 301 (permanent), 302 (temporary), 307, 308 */
  redirect_type?: number;
  /** Whether to pass query parameters to the destination URL */
  pass_query_params?: boolean;
  /** Whether to forward HTTP headers */
  forward_headers?: boolean;
  /** List of headers to forward (only used if forward_headers is true) */
  forward_header_list?: string[];
  /** Maximum number of clicks allowed (null = unlimited) */
  max_clicks?: number | null;
  /** Password protection for the link */
  password?: string;
  /** Access restrictions configuration */
  access_restrictions?: AccessRestrictions;
}

// ============================================================================
// Analytics & Tracking
// ============================================================================

/**
 * Visitor information captured during link access
 */
export interface VisitorInfo {
  /** User agent string from the browser */
  userAgent?: string;
  /** IP address of the visitor */
  ip?: string;
  /** Referrer URL */
  referrer?: string;
  /** Country code (ISO 3166-1 alpha-2) */
  country?: string;
  /** Device type: 'mobile', 'tablet', 'desktop' */
  device?: string;
}
