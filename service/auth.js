/*
 * @Author: zi.yang
 * @Date: 2025-12-27
 * @Description: 认证服务 - Supabase Auth 验证
 * @FilePath: /short-link/service/auth.js
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * 验证 Supabase JWT Token
 * @param {string} token - JWT token
 * @returns {Promise<Object>} 用户信息
 */
export async function verifyToken(token) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error) {
      throw new Error('Token 验证失败: ' + error.message)
    }

    if (!user) {
      throw new Error('无效的 token')
    }

    return user
  } catch (error) {
    console.error('Token 验证失败:', error)
    throw error
  }
}

/**
 * 获取用户信息
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 用户信息
 */
export async function getUserById(userId) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}
