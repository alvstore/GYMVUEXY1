/**
 * Integration Tests for Branch API
 * Tests CRUD operations with authentication and RBAC
 */

import { describe, it, expect, beforeAll } from '@jest/globals'

const API_BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:5000'
const TEST_USER = {
  email: 'admin@vuexy.com',
  password: 'admin'
}

let authToken: string
let testBranchId: string

describe('Branch API Integration Tests', () => {
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

  describe('POST /api/apps/branches - Create Branch', () => {
    it('should create a new branch', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        },
        body: JSON.stringify({
          code: 'TEST001',
          name: 'Test Branch',
          address: '123 Test St',
          phone: '+1234567890',
          email: 'test@branch.com',
          country: 'USA',
          currency: 'USD',
          timezone: 'America/New_York'
        })
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.branch).toBeDefined()
      expect(data.branch.code).toBe('TEST001')
      expect(data.branch.name).toBe('Test Branch')
      
      testBranchId = data.branch.id
    })

    it('should return 400 for missing required fields', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        },
        body: JSON.stringify({
          // Missing code and name
          address: '123 Test St'
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 409 for duplicate branch code', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        },
        body: JSON.stringify({
          code: 'TEST001', // Same code as above
          name: 'Duplicate Branch'
        })
      })

      expect(response.status).toBe(409)
    })

    it('should return 401 without authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'UNAUTH',
          name: 'Unauthorized Branch'
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/apps/branches - Get Branches', () => {
    it('should retrieve all branches for tenant', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/branches`, {
        headers: { 'Cookie': authToken }
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.branches)).toBe(true)
    })

    it('should return 401 without authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/branches`)
      expect(response.status).toBe(401)
    })
  })

  describe('PATCH /api/apps/branches - Update Branch', () => {
    it('should update an existing branch', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/branches`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        },
        body: JSON.stringify({
          id: testBranchId,
          name: 'Updated Test Branch',
          phone: '+1987654321'
        })
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.branch.name).toBe('Updated Test Branch')
      expect(data.branch.phone).toBe('+1987654321')
    })

    it('should return 400 for missing id', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/branches`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authToken
        },
        body: JSON.stringify({
          name: 'No ID Branch'
        })
      })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/apps/branches - Delete Branch', () => {
    it('should soft delete a branch', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/branches?id=${testBranchId}`, {
        method: 'DELETE',
        headers: { 'Cookie': authToken }
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 for missing id', async () => {
      const response = await fetch(`${API_BASE_URL}/api/apps/branches`, {
        method: 'DELETE',
        headers: { 'Cookie': authToken }
      })

      expect(response.status).toBe(400)
    })
  })
})
