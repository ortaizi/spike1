/**
 * 🌐 UNIVERSITIES API INTEGRATION TESTS
 *
 * Comprehensive integration testing for the universities API endpoint,
 * including Hebrew university data, feature flags, and status management.
 *
 * Part of Phase 3: Integration Testing Implementation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../../apps/web/app/api/universities/route';

describe('🌐 Universities API Integration', () => {
  beforeEach(() => {
    // Clear any previous mocks
    vi.clearAllMocks();

    // Setup test environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('📚 GET /api/universities', () => {
    describe('✅ Successful Responses', () => {
      it('should return list of Israeli universities with Hebrew names', async () => {
        const response = await GET();

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('universities');
        expect(data).toHaveProperty('total');
        expect(data).toHaveProperty('supported');
        expect(data).toHaveProperty('totalActiveUsers');

        // Check that we have universities
        expect(Array.isArray(data.universities)).toBe(true);
        expect(data.universities.length).toBeGreaterThan(0);
        expect(data.total).toBe(data.universities.length);
      });

      it('should include BGU as the primary supported university', async () => {
        const response = await GET();
        const data = await response.json();

        const bgu = data.universities.find((u: any) => u.id === 'bgu');
        expect(bgu).toBeDefined();
        expect(bgu.name).toBe('אוניברסיטת בן-גוריון בנגב');
        expect(bgu.domain).toBe('post.bgu.ac.il');
        expect(bgu.status).toBe('active');
        expect(bgu.moodleUrl).toBe('https://moodle.bgu.ac.il');

        // Verify Hebrew name contains Hebrew characters
        expect(bgu.name).toMatch(/[\u0590-\u05FF]/);
      });

      it('should include all major Israeli universities', async () => {
        const response = await GET();
        const data = await response.json();

        const expectedUniversities = [
          { id: 'bgu', name: 'אוניברסיטת בן-גוריון בנגב' },
          { id: 'technion', name: 'הטכניון' },
          { id: 'hebrew', name: 'האוניברסיטה העברית' },
          { id: 'tau', name: 'אוניברסיטת תל אביב' },
        ];

        expectedUniversities.forEach((expected) => {
          const university = data.universities.find((u: any) => u.id === expected.id);
          expect(university).toBeDefined();
          expect(university.name).toBe(expected.name);
          expect(university.name).toMatch(/[\u0590-\u05FF]/); // Contains Hebrew
        });
      });

      it('should provide correct domain mappings for each university', async () => {
        const response = await GET();
        const data = await response.json();

        const domainMappings = [
          { id: 'bgu', domain: 'post.bgu.ac.il' },
          { id: 'technion', domain: 'technion.ac.il' },
          { id: 'hebrew', domain: 'mail.huji.ac.il' },
          { id: 'tau', domain: 'post.tau.ac.il' },
        ];

        domainMappings.forEach((mapping) => {
          const university = data.universities.find((u: any) => u.id === mapping.id);
          expect(university.domain).toBe(mapping.domain);
        });
      });

      it('should include supported features for each university', async () => {
        const response = await GET();
        const data = await response.json();

        data.universities.forEach((university: any) => {
          expect(university).toHaveProperty('supportedFeatures');
          expect(university.supportedFeatures).toHaveProperty('coursesScraping');
          expect(university.supportedFeatures).toHaveProperty('assignmentTracking');
          expect(university.supportedFeatures).toHaveProperty('gradeMonitoring');
          expect(university.supportedFeatures).toHaveProperty('realTimeSync');
          expect(university.supportedFeatures).toHaveProperty('fileDownloads');
          expect(university.supportedFeatures).toHaveProperty('announcementsSync');

          // All feature flags should be boolean
          Object.values(university.supportedFeatures).forEach((feature) => {
            expect(typeof feature).toBe('boolean');
          });
        });
      });

      it('should show BGU as fully supported with all features enabled', async () => {
        const response = await GET();
        const data = await response.json();

        const bgu = data.universities.find((u: any) => u.id === 'bgu');
        expect(bgu.supportedFeatures.coursesScraping).toBe(true);
        expect(bgu.supportedFeatures.assignmentTracking).toBe(true);
        expect(bgu.supportedFeatures.gradeMonitoring).toBe(true);
        expect(bgu.supportedFeatures.realTimeSync).toBe(true);
        expect(bgu.supportedFeatures.fileDownloads).toBe(true);
        expect(bgu.supportedFeatures.announcementsSync).toBe(true);
      });

      it('should show other universities as coming soon with features disabled', async () => {
        const response = await GET();
        const data = await response.json();

        const comingSoonUniversities = ['technion', 'hebrew', 'tau'];

        comingSoonUniversities.forEach((id) => {
          const university = data.universities.find((u: any) => u.id === id);
          expect(university.status).toBe('coming_soon');

          // All features should be disabled for coming soon universities
          Object.values(university.supportedFeatures).forEach((feature) => {
            expect(feature).toBe(false);
          });
        });
      });
    });

    describe('📊 Response Statistics', () => {
      it('should provide accurate statistics about universities', async () => {
        const response = await GET();
        const data = await response.json();

        // Verify total count
        expect(data.total).toBe(data.universities.length);

        // Verify supported count (only active universities)
        const activeCount = data.universities.filter((u: any) => u.status === 'active').length;
        expect(data.supported).toBe(activeCount);

        // Currently should be 1 (only BGU is active)
        expect(data.supported).toBe(1);
      });

      it('should include active user counts for each university', async () => {
        const response = await GET();
        const data = await response.json();

        data.universities.forEach((university: any) => {
          expect(university).toHaveProperty('activeUsers');
          expect(typeof university.activeUsers).toBe('number');
          expect(university.activeUsers).toBeGreaterThanOrEqual(0);
        });

        // Total active users should be sum of all university active users
        const expectedTotal = data.universities.reduce((sum: number, u: any) => sum + u.activeUsers, 0);
        expect(data.totalActiveUsers).toBe(expectedTotal);
      });
    });

    describe('🎨 Hebrew Content Validation', () => {
      it('should maintain proper Hebrew text encoding in response', async () => {
        const response = await GET();
        const data = await response.json();

        data.universities.forEach((university: any) => {
          // University names should contain Hebrew characters
          expect(university.name).toMatch(/[\u0590-\u05FF]/);

          // Names should not contain replacement characters
          expect(university.name).not.toContain('�');
          expect(university.name).not.toContain('?');

          // Names should be properly formatted
          expect(university.name.trim().length).toBeGreaterThan(0);
        });
      });

      it('should provide correct Hebrew academic terminology', async () => {
        const response = await GET();
        const data = await response.json();

        const bgu = data.universities.find((u: any) => u.id === 'bgu');
        expect(bgu.name).toContain('אוניברסיטת');
        expect(bgu.name).toContain('בן-גוריון');

        const technion = data.universities.find((u: any) => u.id === 'technion');
        expect(technion.name).toContain('טכניון');

        const huji = data.universities.find((u: any) => u.id === 'hebrew');
        expect(huji.name).toContain('האוניברסיטה');
        expect(huji.name).toContain('העברית');

        const tau = data.universities.find((u: any) => u.id === 'tau');
        expect(tau.name).toContain('תל אביב');
      });
    });

    describe('🔗 API Endpoint Configuration', () => {
      it('should provide valid Moodle URLs for each university', async () => {
        const response = await GET();
        const data = await response.json();

        data.universities.forEach((university: any) => {
          expect(university.moodleUrl).toMatch(/^https:\/\/moodle\./);
          expect(university.apiEndpoint).toMatch(/^https:\/\/moodle\./);
          expect(university.apiEndpoint).toContain('/login/index.php');

          // URLs should be properly formatted
          expect(() => new URL(university.moodleUrl)).not.toThrow();
          expect(() => new URL(university.apiEndpoint)).not.toThrow();
        });
      });

      it('should include logo paths for each university', async () => {
        const response = await GET();
        const data = await response.json();

        data.universities.forEach((university: any) => {
          expect(university.logo).toMatch(/^\/universities\/.+-logo\.png$/);

          // Handle special case where university id doesn't match logo filename
          if (university.id === 'hebrew') {
            expect(university.logo).toContain('huji');
          } else {
            expect(university.logo).toContain(university.id);
          }
        });
      });
    });

    describe('🧪 CRITICAL: Integration Requirements', () => {
      it('CRITICAL: should provide all required fields for frontend integration', async () => {
        const response = await GET();
        const data = await response.json();

        const requiredFields = [
          'id',
          'name',
          'domain',
          'moodleUrl',
          'apiEndpoint',
          'logo',
          'activeUsers',
          'supportedFeatures',
          'status',
        ];

        data.universities.forEach((university: any) => {
          requiredFields.forEach((field) => {
            expect(university).toHaveProperty(field);
            expect(university[field]).toBeDefined();

            if (field === 'name') {
              expect(university[field]).toMatch(/[\u0590-\u05FF]/); // Hebrew content
            }
          });
        });
      });

      it('CRITICAL: should provide consistent data structure for all universities', async () => {
        const response = await GET();
        const data = await response.json();

        const firstUniversity = data.universities[0];
        const expectedStructure = Object.keys(firstUniversity);

        data.universities.forEach((university: any) => {
          expectedStructure.forEach((key) => {
            expect(university).toHaveProperty(key);
            expect(typeof university[key]).toBe(typeof firstUniversity[key]);
          });
        });
      });

      it('CRITICAL: should handle Hebrew university selection workflow', async () => {
        const response = await GET();
        const data = await response.json();

        // Simulate frontend university selection workflow
        const activeUniversities = data.universities.filter((u: any) => u.status === 'active');
        expect(activeUniversities.length).toBeGreaterThan(0);

        const bgu = activeUniversities.find((u: any) => u.id === 'bgu');
        expect(bgu).toBeDefined();

        // BGU should have all necessary data for authentication flow
        expect(bgu.domain).toBe('post.bgu.ac.il');
        expect(bgu.moodleUrl).toBeTruthy();
        expect(bgu.supportedFeatures.coursesScraping).toBe(true);

        // Hebrew name should be suitable for UI display
        expect(bgu.name).toMatch(/[\u0590-\u05FF]/);
        expect(bgu.name.length).toBeGreaterThan(5);
      });

      it('CRITICAL: should support future university expansion', async () => {
        const response = await GET();
        const data = await response.json();

        // Verify structure supports easy addition of new universities
        const comingSoonUniversities = data.universities.filter((u: any) => u.status === 'coming_soon');
        expect(comingSoonUniversities.length).toBeGreaterThan(0);

        comingSoonUniversities.forEach((university: any) => {
          // Coming soon universities should have complete structure
          expect(university.domain).toBeTruthy();
          expect(university.moodleUrl).toBeTruthy();
          expect(university.supportedFeatures).toBeDefined();
          expect(university.name).toMatch(/[\u0590-\u05FF]/);

          // But features should be disabled
          Object.values(university.supportedFeatures).forEach((feature) => {
            expect(feature).toBe(false);
          });
        });
      });

      it('CRITICAL: should handle concurrent API requests correctly', async () => {
        // Simulate multiple concurrent requests
        const requests = Array.from({ length: 5 }, () => GET());
        const responses = await Promise.all(requests);

        // All responses should be successful
        responses.forEach((response) => {
          expect(response.status).toBe(200);
        });

        // All responses should return identical data
        const responseData = await Promise.all(responses.map((r) => r.json()));
        const firstResponse = responseData[0];

        responseData.forEach((data) => {
          expect(data).toEqual(firstResponse);
          expect(data.universities.length).toBe(firstResponse.universities.length);
        });
      });
    });
  });
});
