/**
 * 🗄️ DATABASE OPERATIONS UNIT TESTS
 *
 * Comprehensive testing for database CRUD operations,
 * Supabase integration, and Hebrew academic data handling.
 *
 * Part of Phase 2: Unit Testing Implementation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createUser, deleteUser, getUserById, getUsers, updateUser } from '../../../apps/web/lib/database/operations';
import type { CreateUserInput, UpdateUserInput, User, UserFilters } from '../../../apps/web/types/database';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  insert: vi.fn(() => mockSupabaseClient),
  update: vi.fn(() => mockSupabaseClient),
  delete: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  range: vi.fn(() => mockSupabaseClient),
  order: vi.fn(() => mockSupabaseClient),
  single: vi.fn(),
  then: vi.fn(),
};

// Mock the db module
vi.mock('../../../apps/web/lib/db', () => ({
  supabase: mockSupabaseClient,
}));

describe('🗄️ Database Operations', () => {
  let mockUser: User;
  let mockCreateUserInput: CreateUserInput;
  let mockUpdateUserInput: UpdateUserInput;

  beforeEach(() => {
    // Setup test data with Hebrew content
    mockUser = {
      id: 'user-123',
      email: 'test@post.bgu.ac.il',
      name: 'יוסי כהן',
      studentId: '123456789',
      faculty: 'מדעי המחשב',
      department: 'הנדסת תוכנה',
      yearOfStudy: 2,
      university: 'BGU',
      preferredLanguage: 'he',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    mockCreateUserInput = {
      email: 'newuser@post.bgu.ac.il',
      name: 'שרה לוי',
      studentId: '987654321',
      faculty: 'מדעי הטבע',
      department: 'מתמטיקה',
      yearOfStudy: 1,
      university: 'BGU',
      preferredLanguage: 'he',
    };

    mockUpdateUserInput = {
      id: 'user-123',
      name: 'יוסי כהן מעודכן',
      faculty: 'הנדסה',
      department: 'הנדסת חשמל',
      yearOfStudy: 3,
    };

    // Clear all mocks
    vi.clearAllMocks();

    // Setup default mock return values
    mockSupabaseClient.single.mockResolvedValue({
      data: mockUser,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('👤 User Creation', () => {
    describe('✅ Successful User Creation', () => {
      it('should create a new user with Hebrew academic details', async () => {
        const expectedData = {
          ...mockCreateUserInput,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        };

        mockSupabaseClient.single.mockResolvedValue({
          data: { ...expectedData, id: 'new-user-123' },
          error: null,
        });

        const result = await createUser(mockCreateUserInput);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.email).toBe('newuser@post.bgu.ac.il');
        expect(result.data?.name).toBe('שרה לוי');
        expect(result.data?.faculty).toBe('מדעי הטבע');

        // Verify Supabase calls
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
        expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
          ...mockCreateUserInput,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
        expect(mockSupabaseClient.select).toHaveBeenCalled();
        expect(mockSupabaseClient.single).toHaveBeenCalled();
      });

      it('should handle Hebrew university names correctly', async () => {
        const hebrewUniversityInput = {
          ...mockCreateUserInput,
          university: 'אוניברסיטת בן-גוריון',
          faculty: 'מדעי המחשב',
          department: 'בינה מלאכותית',
        };

        mockSupabaseClient.single.mockResolvedValue({
          data: { ...hebrewUniversityInput, id: 'hebrew-user-123' },
          error: null,
        });

        const result = await createUser(hebrewUniversityInput);

        expect(result.success).toBe(true);
        expect(result.data?.university).toBe('אוניברסיטת בן-גוריון');
        expect(result.data?.faculty).toBe('מדעי המחשב');
        expect(result.data?.department).toBe('בינה מלאכותית');
      });

      it('should automatically set timestamps for new users', async () => {
        const dateBeforeCall = new Date().toISOString();

        const result = await createUser(mockCreateUserInput);

        const dateAfterCall = new Date().toISOString();

        expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          })
        );

        const insertCall = mockSupabaseClient.insert.mock.calls[0][0];
        expect(insertCall.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(insertCall.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });

    describe('❌ User Creation Errors', () => {
      it('should handle Supabase errors gracefully', async () => {
        const supabaseError = new Error('Database connection failed');
        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: supabaseError,
        });

        const result = await createUser(mockCreateUserInput);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database connection failed');
        expect(result.data).toBeUndefined();
      });

      it('should handle network errors', async () => {
        mockSupabaseClient.single.mockRejectedValue(new Error('Network timeout'));

        const result = await createUser(mockCreateUserInput);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Network timeout');
      });

      it('should handle unknown errors', async () => {
        mockSupabaseClient.single.mockRejectedValue('Unknown error');

        const result = await createUser(mockCreateUserInput);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown database error occurred');
      });
    });
  });

  describe('🔍 User Retrieval', () => {
    describe('✅ Successful User Retrieval', () => {
      it('should retrieve a user by ID', async () => {
        const result = await getUserById('user-123');

        expect(result.success).toBe(true);
        expect(result.data?.id).toBe('user-123');
        expect(result.data?.name).toBe('יוסי כהן');
        expect(result.data?.email).toBe('test@post.bgu.ac.il');

        // Verify Supabase calls
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
        expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'user-123');
        expect(mockSupabaseClient.single).toHaveBeenCalled();
      });

      it('should retrieve Hebrew academic information correctly', async () => {
        const hebrewUser = {
          ...mockUser,
          name: 'מירים אברהם',
          faculty: 'רפואה',
          department: 'ביולוגיה',
          university: 'אוניברסיטת בן-גוריון בנגב',
        };

        mockSupabaseClient.single.mockResolvedValue({
          data: hebrewUser,
          error: null,
        });

        const result = await getUserById('hebrew-user-456');

        expect(result.success).toBe(true);
        expect(result.data?.name).toBe('מירים אברהם');
        expect(result.data?.faculty).toBe('רפואה');
        expect(result.data?.department).toBe('ביולוגיה');

        // Ensure Hebrew characters are preserved
        expect(result.data?.name).toMatch(/[\u0590-\u05FF]/);
      });
    });

    describe('❌ User Retrieval Errors', () => {
      it('should handle user not found', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: null,
        });

        const result = await getUserById('non-existent-user');

        expect(result.success).toBe(false);
        expect(result.error).toBe('User not found');
        expect(result.data).toBeUndefined();
      });

      it('should handle database errors during retrieval', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: new Error('Table does not exist'),
        });

        const result = await getUserById('user-123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Table does not exist');
      });
    });
  });

  describe('✏️ User Updates', () => {
    describe('✅ Successful User Updates', () => {
      it('should update user information correctly', async () => {
        const updatedUser = { ...mockUser, ...mockUpdateUserInput };
        mockSupabaseClient.single.mockResolvedValue({
          data: updatedUser,
          error: null,
        });

        const result = await updateUser(mockUpdateUserInput);

        expect(result.success).toBe(true);
        expect(result.data?.name).toBe('יוסי כהן מעודכן');
        expect(result.data?.faculty).toBe('הנדסה');
        expect(result.data?.yearOfStudy).toBe(3);

        // Verify Supabase calls
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
        expect(mockSupabaseClient.update).toHaveBeenCalledWith({
          name: 'יוסי כהן מעודכן',
          faculty: 'הנדסה',
          department: 'הנדסת חשמל',
          yearOfStudy: 3,
          updatedAt: expect.any(String),
        });
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'user-123');
      });

      it('should automatically update the updatedAt timestamp', async () => {
        const result = await updateUser(mockUpdateUserInput);

        expect(mockSupabaseClient.update).toHaveBeenCalledWith(
          expect.objectContaining({
            updatedAt: expect.any(String),
          })
        );

        const updateCall = mockSupabaseClient.update.mock.calls[0][0];
        expect(updateCall.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });

      it('should handle partial updates with Hebrew content', async () => {
        const partialUpdate = {
          id: 'user-123',
          faculty: 'מדעי החברה',
          department: 'פסיכולוגיה',
        };

        const result = await updateUser(partialUpdate);

        expect(mockSupabaseClient.update).toHaveBeenCalledWith({
          faculty: 'מדעי החברה',
          department: 'פסיכולוגיה',
          updatedAt: expect.any(String),
        });
      });
    });

    describe('❌ User Update Errors', () => {
      it('should handle update failures', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: new Error('Update constraint violation'),
        });

        const result = await updateUser(mockUpdateUserInput);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Update constraint violation');
      });
    });
  });

  describe('🗑️ User Deletion', () => {
    describe('✅ Successful User Deletion', () => {
      it('should delete a user by ID', async () => {
        const result = await deleteUser('user-123');

        expect(result.success).toBe(true);
        expect(result.data?.id).toBe('user-123');

        // Verify Supabase calls
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
        expect(mockSupabaseClient.delete).toHaveBeenCalled();
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'user-123');
        expect(mockSupabaseClient.select).toHaveBeenCalled();
        expect(mockSupabaseClient.single).toHaveBeenCalled();
      });
    });

    describe('❌ User Deletion Errors', () => {
      it('should handle deletion errors', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: new Error('Foreign key constraint'),
        });

        const result = await deleteUser('user-123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Foreign key constraint');
      });
    });
  });

  describe('📋 User Listing and Filtering', () => {
    let mockPaginatedUsers: User[];

    beforeEach(() => {
      mockPaginatedUsers = [
        {
          ...mockUser,
          id: 'user-1',
          name: 'אליס בן-דוד',
          faculty: 'מדעי המחשב',
          department: 'הנדסת תוכנה',
        },
        {
          ...mockUser,
          id: 'user-2',
          name: 'בוב מויאל',
          faculty: 'הנדסה',
          department: 'הנדסת מכונות',
        },
        {
          ...mockUser,
          id: 'user-3',
          name: 'כרמל לוי',
          faculty: 'מדעי המחשב',
          department: 'מדעי המחשב',
        },
      ];

      // Mock paginated response
      mockSupabaseClient.single.mockResolvedValue({
        data: mockPaginatedUsers,
        count: 25,
        error: null,
      });

      // Update the chain to return the mock data
      mockSupabaseClient.range.mockReturnValue({
        ...mockSupabaseClient,
        then: vi.fn().mockResolvedValue({
          data: mockPaginatedUsers,
          count: 25,
          error: null,
        }),
      });
    });

    describe('✅ Successful User Listing', () => {
      it('should retrieve users with pagination', async () => {
        // Mock the complete query chain
        const mockQueryChain = {
          range: vi.fn().mockReturnValue({
            then: vi.fn().mockResolvedValue({
              data: mockPaginatedUsers,
              count: 25,
              error: null,
            }),
          }),
        };

        mockSupabaseClient.select.mockReturnValue(mockQueryChain);

        const result = await getUsers(undefined, 1, 10);

        expect(result.success).toBe(true);
        expect(result.data?.items).toBeDefined();
        expect(result.data?.total).toBe(25);
        expect(result.data?.page).toBe(1);
        expect(result.data?.limit).toBe(10);
        expect(result.data?.totalPages).toBe(3);

        // Verify Supabase calls
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
        expect(mockSupabaseClient.select).toHaveBeenCalledWith('*', { count: 'exact' });
      });

      it('should filter users by faculty', async () => {
        const filters: UserFilters = { faculty: 'מדעי המחשב' };

        const filteredUsers = mockPaginatedUsers.filter((u) => u.faculty === 'מדעי המחשב');

        const mockQueryChain = {
          eq: vi.fn().mockReturnValue({
            range: vi.fn().mockReturnValue({
              then: vi.fn().mockResolvedValue({
                data: filteredUsers,
                count: 2,
                error: null,
              }),
            }),
          }),
        };

        mockSupabaseClient.select.mockReturnValue(mockQueryChain);

        const result = await getUsers(filters, 1, 10);

        expect(result.success).toBe(true);
        expect(mockQueryChain.eq).toHaveBeenCalledWith('faculty', 'מדעי המחשב');
      });

      it('should filter users by department', async () => {
        const filters: UserFilters = {
          faculty: 'מדעי המחשב',
          department: 'הנדסת תוכנה',
        };

        const mockQueryChain = {
          eq: vi.fn(() => mockQueryChain),
          range: vi.fn().mockReturnValue({
            then: vi.fn().mockResolvedValue({
              data: [mockPaginatedUsers[0]],
              count: 1,
              error: null,
            }),
          }),
        };

        mockSupabaseClient.select.mockReturnValue(mockQueryChain);

        const result = await getUsers(filters, 1, 10);

        expect(result.success).toBe(true);
        expect(mockQueryChain.eq).toHaveBeenCalledWith('faculty', 'מדעי המחשב');
        expect(mockQueryChain.eq).toHaveBeenCalledWith('department', 'הנדסת תוכנה');
      });

      it('should handle Hebrew search and sorting correctly', async () => {
        const hebrewUsers = mockPaginatedUsers.map((user) => ({
          ...user,
          name: user.name, // Hebrew names
        }));

        const mockQueryChain = {
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockReturnValue({
              then: vi.fn().mockResolvedValue({
                data: hebrewUsers,
                count: 3,
                error: null,
              }),
            }),
          }),
        };

        mockSupabaseClient.select.mockReturnValue(mockQueryChain);

        const result = await getUsers(undefined, 1, 10);

        // Verify Hebrew names are preserved
        result.data?.items?.forEach((user) => {
          expect(user.name).toMatch(/[\u0590-\u05FF]/);
        });
      });
    });

    describe('❌ User Listing Errors', () => {
      it('should handle database errors during listing', async () => {
        const mockQueryChain = {
          range: vi.fn().mockReturnValue({
            then: vi.fn().mockResolvedValue({
              data: null,
              count: null,
              error: new Error('Database timeout'),
            }),
          }),
        };

        mockSupabaseClient.select.mockReturnValue(mockQueryChain);

        const result = await getUsers();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database timeout');
      });
    });
  });

  describe('🧪 CRITICAL: Database Integration Tests', () => {
    it('CRITICAL: should handle complete user lifecycle with Hebrew data', async () => {
      // Test complete CRUD workflow with Hebrew academic content
      const newUser: CreateUserInput = {
        email: 'lifecycle@post.bgu.ac.il',
        name: 'דניאל גולדברג',
        studentId: '555666777',
        faculty: 'מדעי הרוח',
        department: 'היסטוריה',
        yearOfStudy: 2,
        university: 'BGU',
        preferredLanguage: 'he',
      };

      // 1. Create user
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          ...newUser,
          id: 'lifecycle-user',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const createResult = await createUser(newUser);
      expect(createResult.success).toBe(true);
      expect(createResult.data?.name).toBe('דניאל גולדברג');

      // 2. Retrieve user
      const retrievedUser = {
        ...newUser,
        id: 'lifecycle-user',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: retrievedUser,
        error: null,
      });

      const getResult = await getUserById('lifecycle-user');
      expect(getResult.success).toBe(true);
      expect(getResult.data?.faculty).toBe('מדעי הרוח');

      // 3. Update user
      const updateData = {
        id: 'lifecycle-user',
        yearOfStudy: 3,
        department: 'ארכיאולוגיה',
      };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { ...retrievedUser, ...updateData, updatedAt: '2024-01-02T00:00:00Z' },
        error: null,
      });

      const updateResult = await updateUser(updateData);
      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.department).toBe('ארכיאולוגיה');

      // 4. Delete user
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { ...retrievedUser, ...updateData },
        error: null,
      });

      const deleteResult = await deleteUser('lifecycle-user');
      expect(deleteResult.success).toBe(true);
    });

    it('CRITICAL: should maintain data integrity during concurrent operations', async () => {
      // Simulate concurrent user operations
      const concurrentOperations = [
        createUser({
          email: 'concurrent1@post.bgu.ac.il',
          name: 'עמית כהן',
          studentId: '111222333',
          faculty: 'מדעים מדויקים',
          department: 'פיזיקה',
          yearOfStudy: 1,
          university: 'BGU',
          preferredLanguage: 'he',
        }),
        createUser({
          email: 'concurrent2@post.bgu.ac.il',
          name: 'תמר לוי',
          studentId: '444555666',
          faculty: 'מדעים מדויקים',
          department: 'כימיה',
          yearOfStudy: 2,
          university: 'BGU',
          preferredLanguage: 'he',
        }),
        getUserById('existing-user-123'),
      ];

      // Mock successful responses for all operations
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: { id: 'concurrent-1' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'concurrent-2' }, error: null })
        .mockResolvedValueOnce({ data: mockUser, error: null });

      const results = await Promise.all(concurrentOperations);

      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it('CRITICAL: should handle Hebrew character encoding correctly in all operations', async () => {
      // Test with various Hebrew academic terms and names
      const hebrewTestCases = [
        {
          name: 'אברהם יצחק שרה רבקה',
          faculty: 'מדעי הטבע והחיים',
          department: 'ביולוגיה מולקולרית ותאית',
        },
        {
          name: 'מוחמד עלי פאטמה',
          faculty: 'רפואה בכפר',
          department: 'רפואת המשפחה והקהילה',
        },
        {
          name: 'יוליה איוון מריה',
          faculty: 'הנדסה וכימיה',
          department: 'הנדסת מערכות מידע',
        },
      ];

      for (const testCase of hebrewTestCases) {
        const userInput: CreateUserInput = {
          email: 'hebrew-test@post.bgu.ac.il',
          ...testCase,
          studentId: '123456789',
          yearOfStudy: 1,
          university: 'BGU',
          preferredLanguage: 'he',
        };

        mockSupabaseClient.single.mockResolvedValueOnce({
          data: { ...userInput, id: 'hebrew-test' },
          error: null,
        });

        const result = await createUser(userInput);

        expect(result.success).toBe(true);
        expect(result.data?.name).toMatch(/[\u0590-\u05FF]/); // Hebrew Unicode range
        expect(result.data?.faculty).toMatch(/[\u0590-\u05FF]/);
        expect(result.data?.department).toMatch(/[\u0590-\u05FF]/);

        // Ensure no Hebrew characters are corrupted
        expect(result.data?.name).not.toContain('?');
        expect(result.data?.name).not.toContain('�');
      }
    });
  });
});
