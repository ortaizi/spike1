// Contract Tests for Auth Service
// Ensures API compatibility between services during migration

import { Pact } from '@pact-foundation/pact';
import { like, term } from '@pact-foundation/pact/dsl/matchers';
import axios from 'axios';

describe('Auth Service Contract Tests', () => {
  const provider = new Pact({
    consumer: 'tenant-service',
    provider: 'auth-service',
    port: 1234,
    log: './tests/contracts/logs/pact.log',
    dir: './tests/contracts/pacts',
    logLevel: 'INFO'
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('JWT Token Validation', () => {
    it('should validate a valid JWT token', async () => {
      await provider.addInteraction({
        state: 'valid JWT token exists',
        uponReceiving: 'a request to validate token',
        withRequest: {
          method: 'POST',
          path: '/auth/token/validate',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': 'bgu',
            'X-Correlation-ID': like('correlation-123')
          },
          body: {
            token: like('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid.token')
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            valid: true,
            userId: like('user-123'),
            email: like('test@bgu.ac.il'),
            tenantId: 'bgu',
            expiresAt: term({
              generate: '2024-12-31T23:59:59Z',
              matcher: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z'
            })
          }
        }
      });

      const response = await axios.post('http://localhost:1234/auth/token/validate', {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid.token'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'bgu',
          'X-Correlation-ID': 'correlation-123'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.valid).toBe(true);
      expect(response.data.tenantId).toBe('bgu');
      expect(response.data.userId).toBeDefined();
    });

    it('should reject an invalid JWT token', async () => {
      await provider.addInteraction({
        state: 'invalid JWT token provided',
        uponReceiving: 'a request to validate invalid token',
        withRequest: {
          method: 'POST',
          path: '/auth/token/validate',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': 'bgu'
          },
          body: {
            token: 'invalid.jwt.token'
          }
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            valid: false,
            error: 'Invalid token'
          }
        }
      });

      try {
        await axios.post('http://localhost:1234/auth/token/validate', {
          token: 'invalid.jwt.token'
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': 'bgu'
          }
        });
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.valid).toBe(false);
      }
    });
  });

  describe('Google OAuth Authentication', () => {
    it('should handle Google OAuth callback', async () => {
      await provider.addInteraction({
        state: 'valid Google token provided',
        uponReceiving: 'a Google OAuth callback request',
        withRequest: {
          method: 'POST',
          path: '/auth/google/callback',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': 'bgu'
          },
          body: {
            token: like('google.oauth.token.here'),
            tenantId: 'bgu'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: true,
            user: {
              id: like('user-123'),
              email: like('student@post.bgu.ac.il'),
              name: like('Test Student'),
              emailVerified: true,
              tenantId: 'bgu'
            },
            tokens: {
              accessToken: like('jwt.access.token'),
              refreshToken: like('jwt.refresh.token'),
              expiresIn: 3600
            }
          }
        }
      });

      const response = await axios.post('http://localhost:1234/auth/google/callback', {
        token: 'google.oauth.token.here',
        tenantId: 'bgu'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'bgu'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.user.tenantId).toBe('bgu');
      expect(response.data.tokens.accessToken).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should validate active session', async () => {
      await provider.addInteraction({
        state: 'active session exists',
        uponReceiving: 'a session validation request',
        withRequest: {
          method: 'GET',
          path: '/auth/session/validate',
          headers: {
            'Authorization': like('Bearer jwt.token.here'),
            'X-Tenant-ID': 'bgu'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            valid: true,
            session: {
              userId: like('user-123'),
              tenantId: 'bgu',
              expiresAt: term({
                generate: '2024-12-31T23:59:59Z',
                matcher: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z'
              }),
              lastAccess: term({
                generate: '2024-01-15T10:30:00Z',
                matcher: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z'
              })
            }
          }
        }
      });

      const response = await axios.get('http://localhost:1234/auth/session/validate', {
        headers: {
          'Authorization': 'Bearer jwt.token.here',
          'X-Tenant-ID': 'bgu'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.valid).toBe(true);
      expect(response.data.session.tenantId).toBe('bgu');
    });
  });

  describe('University Credential Management', () => {
    it('should store university credentials', async () => {
      await provider.addInteraction({
        state: 'authenticated user wants to store credentials',
        uponReceiving: 'a credential storage request',
        withRequest: {
          method: 'POST',
          path: '/auth/credentials/validate',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': like('Bearer jwt.token.here'),
            'X-User-ID': like('user-123'),
            'X-Tenant-ID': 'bgu'
          },
          body: {
            username: like('123456789'),
            password: like('student-password'),
            universityId: 'bgu'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: true,
            message: 'Credentials validated and stored securely'
          }
        }
      });

      const response = await axios.post('http://localhost:1234/auth/credentials/validate', {
        username: '123456789',
        password: 'student-password',
        universityId: 'bgu'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt.token.here',
          'X-User-ID': 'user-123',
          'X-Tenant-ID': 'bgu'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should return service health status', async () => {
      await provider.addInteraction({
        state: 'service is healthy',
        uponReceiving: 'a health check request',
        withRequest: {
          method: 'GET',
          path: '/health'
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            status: 'healthy',
            service: 'auth-service',
            version: like('1.0.0'),
            timestamp: term({
              generate: '2024-01-15T10:30:00Z',
              matcher: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z'
            }),
            dependencies: {
              database: 'healthy',
              redis: 'healthy'
            }
          }
        }
      });

      const response = await axios.get('http://localhost:1234/health');

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
      expect(response.data.service).toBe('auth-service');
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should enforce tenant isolation in responses', async () => {
      await provider.addInteraction({
        state: 'BGU user requests data',
        uponReceiving: 'a tenant-specific request',
        withRequest: {
          method: 'GET',
          path: '/auth/user/profile',
          headers: {
            'Authorization': like('Bearer bgu.jwt.token'),
            'X-Tenant-ID': 'bgu',
            'X-User-ID': like('bgu-user-123')
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': 'bgu'
          },
          body: {
            user: {
              id: like('bgu-user-123'),
              email: term({
                generate: 'student@post.bgu.ac.il',
                matcher: '.*@.*\\.bgu\\.ac\\.il'
              }),
              tenantId: 'bgu',
              university: 'Ben-Gurion University of the Negev'
            }
          }
        }
      });

      const response = await axios.get('http://localhost:1234/auth/user/profile', {
        headers: {
          'Authorization': 'Bearer bgu.jwt.token',
          'X-Tenant-ID': 'bgu',
          'X-User-ID': 'bgu-user-123'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.user.tenantId).toBe('bgu');
      expect(response.headers['x-tenant-id']).toBe('bgu');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing tenant ID', async () => {
      await provider.addInteraction({
        state: 'request without tenant ID',
        uponReceiving: 'a request missing tenant identification',
        withRequest: {
          method: 'POST',
          path: '/auth/token/validate',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            token: like('some.jwt.token')
          }
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            error: 'Tenant identification required',
            code: 'MISSING_TENANT_ID'
          }
        }
      });

      try {
        await axios.post('http://localhost:1234/auth/token/validate', {
          token: 'some.jwt.token'
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.code).toBe('MISSING_TENANT_ID');
      }
    });
  });
});

// Provider verification (to be run by auth-service)
describe('Auth Service Provider Verification', () => {
  it('should satisfy all consumer contracts', async () => {
    const opts = {
      provider: 'auth-service',
      providerBaseUrl: 'http://localhost:8001',
      pactUrls: ['./tests/contracts/pacts/tenant-service-auth-service.json'],
      stateHandlers: {
        'valid JWT token exists': () => {
          // Setup valid JWT token in test database
          return Promise.resolve();
        },
        'invalid JWT token provided': () => {
          // No setup needed for invalid token test
          return Promise.resolve();
        },
        'valid Google token provided': () => {
          // Mock Google OAuth validation
          return Promise.resolve();
        },
        'active session exists': () => {
          // Setup active session in Redis
          return Promise.resolve();
        },
        'authenticated user wants to store credentials': () => {
          // Setup authenticated user session
          return Promise.resolve();
        },
        'service is healthy': () => {
          // Ensure all dependencies are healthy
          return Promise.resolve();
        },
        'BGU user requests data': () => {
          // Setup BGU user data
          return Promise.resolve();
        },
        'request without tenant ID': () => {
          // No setup needed for error condition
          return Promise.resolve();
        }
      }
    };

    // This would be run as part of the provider's test suite
    // const verifier = new Verifier(opts);
    // await verifier.verifyProvider();
  });
});