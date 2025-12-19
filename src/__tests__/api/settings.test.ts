/**
 * Integration Tests for Settings API
 * Tests CRUD operations with authentication and RBAC
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'

const API_BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:5000'
const TEST_USER = {
  email: 'admin@vuexy.com',
  password: 'admin'
}

let authToken: string
let testSettingId: string

describe('Settings API Integration Tests', () => {
  beforeAll(async () => {
    // Login to get session token
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    })
    
    const cookies = loginResponse.headers.get('set-cookie')
    if (cookies) {
      authToken = cookies.split(';')[0]
    }
  })

  describe('POST /api/apps/settings - Create Setting', () => {
    it('should create a new setting', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        },
        body: JSON.stringify({
          key: 'test.setting',
          value: { enabled: true, config: 'test' },
          isEncrypted: false
        })
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.setting).toBeDefined()
      expect(data.setting.key).toBe('test.setting')
      
      testSettingId = data.setting.id
    })

    it('should create a branch-specific setting', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        },
        body: JSON.stringify({
          branchId: 'branch-001',
          key: 'branch.test.setting',
          value: { branchConfig: true }
        })
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.setting.branchId).toBe('branch-001')
    })

    it('should return 400 for missing required fields', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        },
        body: JSON.stringify({
          // Missing key and value
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 401 without authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'test.unauthorized',
          value: {}
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/apps/settings - Get Settings', () => {
    it('should retrieve all settings for tenant', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/settings`, {
        headers: { 'Cookie': authToken }
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.settings)).toBe(true)
    })

    it('should filter settings by key', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/settings?key=test.setting`, {
        headers: { 'Cookie': authToken }
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.settings.length).toBeGreaterThan(0)
      expect(data.settings[0].key).toBe('test.setting')
    })

    it('should return 401 without authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/settings`)
      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/apps/settings - Update Setting', () => {
    it('should update an existing setting', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        },
        body: JSON.stringify({
          id: testSettingId,
          value: { enabled: false, config: 'updated' }
        })
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.setting.value.enabled).toBe(false)
      expect(data.setting.value.config).toBe('updated')
    })

    it('should return 400 for missing id', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        },
        body: JSON.stringify({
          value: {}
        })
      })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/apps/settings - Delete Setting', () => {
    it('should delete a setting', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/settings?id=${testSettingId}`, {
        method: 'DELETE',
        headers: { 'Cookie': authToken }
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 for missing id', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/settings`, {
        method: 'DELETE',
        headers: { 'Cookie': authToken }
      })

      expect(response.status).toBe(400)
    })
  })
})
