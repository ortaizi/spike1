/**
 * 🗄️ SUPABASE TESTING UTILITIES
 * 
 * Comprehensive testing utilities for Supabase integration with Hebrew academic data
 */

import { vi } from 'vitest';
import hebrewData from '../fixtures/hebrew-data';

// ================================================================================================
// 🗄️ SUPABASE MOCK CLIENT
// ================================================================================================

export class SupabaseMockClient {
  private tables: Record<string, any[]> = {
    courses: Object.values(hebrewData.courses),
    assignments: Object.values(hebrewData.assignments),
    users: Object.values(hebrewData.users),
    exams: Object.values(hebrewData.exams)
  };

  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Mock table operations
   */
  from(tableName: string) {
    const self = this;
    
    return {
      // SELECT operations
      select(columns = '*') {
        return {
          async eq(column: string, value: any) {
            await self.delay(50); // Simulate network delay
            const data = self.tables[tableName]?.filter(item => item[column] === value) || [];
            return { data, error: null };
          },

          async in(column: string, values: any[]) {
            await self.delay(50);
            const data = self.tables[tableName]?.filter(item => values.includes(item[column])) || [];
            return { data, error: null };
          },

          async gte(column: string, value: any) {
            await self.delay(50);
            const data = self.tables[tableName]?.filter(item => item[column] >= value) || [];
            return { data, error: null };
          },

          async lte(column: string, value: any) {
            await self.delay(50);
            const data = self.tables[tableName]?.filter(item => item[column] <= value) || [];
            return { data, error: null };
          },

          async order(column: string, options: { ascending?: boolean } = {}) {
            await self.delay(50);
            const data = [...(self.tables[tableName] || [])];
            data.sort((a, b) => {
              if (options.ascending === false) {
                return b[column] > a[column] ? 1 : -1;
              }
              return a[column] > b[column] ? 1 : -1;
            });
            return { data, error: null };
          },

          async limit(count: number) {
            await self.delay(50);
            const data = (self.tables[tableName] || []).slice(0, count);
            return { data, error: null };
          },

          async single() {
            await self.delay(50);
            const data = self.tables[tableName]?.[0] || null;
            return { data, error: data ? null : { message: 'No rows found' } };
          },

          // Chain operations
          eq(column: string, value: any) {
            return this.eq(column, value);
          },
          
          order(column: string, options?: { ascending?: boolean }) {
            return this.order(column, options);
          }
        };
      },

      // INSERT operations
      insert(data: any | any[]) {
        return {
          async select(columns = '*') {
            await self.delay(100);
            const items = Array.isArray(data) ? data : [data];
            const insertedItems = items.map(item => ({
              id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...item
            }));
            
            // Add to mock table
            if (!self.tables[tableName]) {
              self.tables[tableName] = [];
            }
            self.tables[tableName].push(...insertedItems);
            
            return {
              data: insertedItems,
              error: null
            };
          },

          async single() {
            const result = await this.select();
            return {
              data: result.data?.[0] || null,
              error: result.error
            };
          }
        };
      },

      // UPDATE operations
      update(data: any) {
        return {
          eq(column: string, value: any) {
            return {
              async select(columns = '*') {
                await self.delay(100);
                const items = self.tables[tableName] || [];
                const updated = items.map(item => 
                  item[column] === value 
                    ? { ...item, ...data, updated_at: new Date().toISOString() }
                    : item
                );
                self.tables[tableName] = updated;
                
                const updatedItems = updated.filter(item => item[column] === value);
                return { data: updatedItems, error: null };
              },

              async single() {
                const result = await this.select();
                return {
                  data: result.data?.[0] || null,
                  error: result.error
                };
              }
            };
          }
        };
      },

      // DELETE operations
      delete() {
        return {
          async eq(column: string, value: any) {
            await self.delay(100);
            const items = self.tables[tableName] || [];
            const filtered = items.filter(item => item[column] !== value);
            self.tables[tableName] = filtered;
            
            return { data: null, error: null };
          }
        };
      }
    };
  }

  /**
   * Mock auth operations
   */
  get auth() {
    return {
      async getUser() {
        await this.delay(100);
        return {
          data: { user: hebrewData.users.student1 },
          error: null
        };
      },

      async signInWithPassword(credentials: { email: string; password: string }) {
        await this.delay(200);
        
        // Mock successful sign in for Hebrew test user
        if (credentials.email === 'israel.israeli@post.bgu.ac.il') {
          return {
            data: { 
              user: hebrewData.users.student1,
              session: { access_token: 'mock-token', refresh_token: 'mock-refresh' }
            },
            error: null
          };
        }
        
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid credentials' }
        };
      },

      async signOut() {
        await this.delay(100);
        return { error: null };
      }
    };
  }

  /**
   * Mock real-time subscriptions
   */
  channel(channelName: string) {
    return {
      on(event: string, filter: any, callback: Function) {
        // Mock real-time updates
        setTimeout(() => {
          callback({
            eventType: event,
            new: hebrewData.courses.computerScience,
            old: null
          });
        }, 100);
        return this;
      },

      subscribe(callback?: Function) {
        if (callback) callback('SUBSCRIBED');
        return {
          unsubscribe: vi.fn()
        };
      }
    };
  }

  /**
   * Reset mock data to initial state
   */
  resetMockData() {
    this.tables = {
      courses: Object.values(hebrewData.courses),
      assignments: Object.values(hebrewData.assignments),
      users: Object.values(hebrewData.users),
      exams: Object.values(hebrewData.exams)
    };
  }

  /**
   * Seed with custom Hebrew test data
   */
  seedHebrewData(tableName: string, data: any[]) {
    this.tables[tableName] = data;
  }
}

// ================================================================================================
// 🧪 DATABASE TEST UTILITIES
// ================================================================================================

export class DatabaseTestUtils {
  private mockClient = new SupabaseMockClient();

  /**
   * Setup database mocks for testing
   */
  setupMocks() {
    vi.mock('@/lib/db', () => ({
      supabase: this.mockClient
    }));

    vi.mock('@supabase/supabase-js', () => ({
      createClient: () => this.mockClient
    }));
  }

  /**
   * Test Hebrew text storage and retrieval
   */
  async testHebrewStorage() {
    const hebrewCourse = {
      name: 'מבוא למדעי המחשב',
      description: 'קורס מבוא הכולל יסודות תכנות ואלגוריתמים',
      instructor: 'ד"ר ישראל ישראלי'
    };

    // Insert Hebrew data
    const { data: inserted } = await this.mockClient
      .from('courses')
      .insert(hebrewCourse)
      .select()
      .single();

    // Retrieve and verify Hebrew characters are preserved
    const { data: retrieved } = await this.mockClient
      .from('courses')
      .select()
      .eq('id', inserted.id)
      .single();

    return {
      inserted,
      retrieved,
      hebrewPreserved: retrieved?.name === hebrewCourse.name &&
                      retrieved?.description === hebrewCourse.description
    };
  }

  /**
   * Test Hebrew search functionality
   */
  async testHebrewSearch(searchTerm: string) {
    // This would test full-text search in real implementation
    const results = await this.mockClient
      .from('courses')
      .select()
      .eq('name', searchTerm); // Simplified for mock

    return results;
  }

  /**
   * Test RTL-aware sorting
   */
  async testRTLSorting() {
    const courses = await this.mockClient
      .from('courses')
      .select()
      .order('name', { ascending: true });

    // In real implementation, would verify Hebrew collation
    return courses;
  }

  /**
   * Test academic calendar queries with Hebrew dates
   */
  async testAcademicCalendar() {
    const fallSemester = hebrewData.calendar.academicYear2024.semesters.fall;
    
    // Test date range queries for Hebrew semester names
    const coursesInSemester = await this.mockClient
      .from('courses')
      .select()
      .eq('semester', fallSemester.code);

    return coursesInSemester;
  }

  /**
   * Reset all mocks and data
   */
  resetAll() {
    this.mockClient.resetMockData();
    vi.clearAllMocks();
  }

  get client() {
    return this.mockClient;
  }
}

// ================================================================================================
// 🔄 REAL-TIME TESTING UTILITIES
// ================================================================================================

export class RealtimeTestUtils {
  private mockClient = new SupabaseMockClient();

  /**
   * Test real-time updates with Hebrew data
   */
  async testHebrewRealtime() {
    let receivedUpdate: any = null;

    const channel = this.mockClient
      .channel('courses')
      .on('INSERT', { table: 'courses' }, (payload) => {
        receivedUpdate = payload;
      })
      .subscribe();

    // Simulate Hebrew course insertion
    const hebrewCourse = hebrewData.courses.mathematics;
    await this.mockClient
      .from('courses')
      .insert(hebrewCourse);

    // Wait for real-time update
    await new Promise(resolve => setTimeout(resolve, 150));

    return {
      received: receivedUpdate,
      hasHebrewContent: receivedUpdate && /[\u0590-\u05FF]/.test(receivedUpdate.new?.name || '')
    };
  }
}

// ================================================================================================
// 📊 PERFORMANCE TESTING
// ================================================================================================

export class DatabasePerformanceTests {
  private mockClient = new SupabaseMockClient();

  /**
   * Test Hebrew query performance
   */
  async testHebrewQueryPerformance() {
    const startTime = Date.now();
    
    // Simulate complex Hebrew query
    const results = await Promise.all([
      this.mockClient.from('courses').select().eq('name', 'מבוא למדעי המחשב'),
      this.mockClient.from('assignments').select().gte('dueDate', new Date().toISOString()),
      this.mockClient.from('users').select().eq('faculty', 'הפקולטה למדעי הטבע')
    ]);
    
    const endTime = Date.now();
    
    return {
      duration: endTime - startTime,
      results: results.map(r => r.data?.length || 0),
      performanceAcceptable: (endTime - startTime) < 1000 // Under 1 second
    };
  }
}

// ================================================================================================
// 🎯 EXPORTS
// ================================================================================================

export const supabaseTesting = {
  MockClient: SupabaseMockClient,
  DatabaseTestUtils,
  RealtimeTestUtils,
  DatabasePerformanceTests,
  
  // Pre-configured instances
  createMockClient: () => new SupabaseMockClient(),
  createTestUtils: () => new DatabaseTestUtils(),
  createRealtimeUtils: () => new RealtimeTestUtils(),
  createPerformanceTests: () => new DatabasePerformanceTests()
};

export default supabaseTesting;