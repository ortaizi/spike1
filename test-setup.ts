// ================================================================================================
// 🎓 SPIKE ACADEMIC PLATFORM - TEST SETUP
// ================================================================================================
// Global test setup for Vitest with Hebrew/RTL support and academic context

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ================================================================================================
// 🌍 GLOBAL TEST ENVIRONMENT
// ================================================================================================

// Set Hebrew locale for all tests
global.Intl = Intl;
Object.defineProperty(window, 'navigator', {
  value: {
    language: 'he-IL',
    languages: ['he-IL', 'he', 'en-US', 'en'],
  },
  writable: true,
});

// Set RTL direction
Object.defineProperty(document.documentElement, 'dir', {
  value: 'rtl',
  writable: true,
});

// Academic calendar context
global.ACADEMIC_CONTEXT = {
  year: 2024,
  semester: 'א',
  startDate: new Date('2024-10-01'),
  endDate: new Date('2025-01-31'),
};

// ================================================================================================
// 🎨 MOCKED COMPONENTS & LIBRARIES
// ================================================================================================

// Mock Next.js modules
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    reload: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    locale: 'he',
    locales: ['he', 'en'],
    defaultLocale: 'he',
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    searchParams: new URLSearchParams(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@bgu.ac.il',
        name: 'ישראל ישראלי',
        studentId: '123456789',
        universityId: 'bgu',
        universityName: 'אוניברסיטת בן גוריון',
      },
    },
    status: 'authenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
}));

// ================================================================================================
// 🗄️ DATABASE & API MOCKS
// ================================================================================================

// Mock Supabase client
vi.mock('@/lib/db', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
        gte: vi.fn(() => ({
          data: [],
          error: null,
        })),
        lte: vi.fn(() => ({
          data: [],
          error: null,
        })),
        order: vi.fn(() => ({
          data: [],
          error: null,
        })),
        limit: vi.fn(() => ({
          data: [],
          error: null,
        })),
        single: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'test-id' },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'test-id' },
              error: null,
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(() => ({
        data: { user: null },
        error: null,
      })),
      signInWithPassword: vi.fn(() => ({
        data: { user: null, session: null },
        error: null,
      })),
      signOut: vi.fn(() => ({
        error: null,
      })),
    },
  },
}));

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isLoading: false,
    isError: false,
    error: null,
    data: undefined,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ================================================================================================
// 🎯 ACADEMIC PLATFORM SPECIFIC MOCKS
# ================================================================================================

// Mock Hebrew date formatting
vi.mock('@/lib/utils/date', () => ({
  formatHebrewDate: vi.fn((date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }),
  getAcademicYear: vi.fn((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return month >= 10 ? year : year - 1;
  }),
  isHebrewText: vi.fn((text: string) => /[\u0590-\u05FF]/.test(text)),
}));

// Mock BGU course utilities
vi.mock('@/lib/utils/courses', () => ({
  validateBGUCourseCode: vi.fn((code: string) => /^\d{3}-\d-\d{4}$/.test(code)),
  formatCourseCode: vi.fn((code: string) => code),
  getSemesterName: vi.fn((semester: string) => {
    const semesters = { 'א': 'Fall', 'ב': 'Spring', 'קיץ': 'Summer' };
    return semesters[semester as keyof typeof semesters] || semester;
  }),
}));

// Mock assignment utilities
vi.mock('@/lib/utils/assignments', () => ({
  calculatePriority: vi.fn(() => 'MEDIUM'),
  getDaysUntilDue: vi.fn(() => 5),
  isOverdue: vi.fn(() => false),
  formatGrade: vi.fn((grade: number) => `${grade}/100`),
}));

// ================================================================================================
// 🎨 UI COMPONENT MOCKS
// ================================================================================================

// Mock Radix UI components
vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Trigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  Content: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div>,
  Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  Description: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  Close: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

vi.mock('@radix-ui/react-toast', () => ({
  Provider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Root: ({ children }: { children: React.ReactNode }) => <div role="alert">{children}</div>,
  Title: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Description: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Close: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  Viewport: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// ================================================================================================
// 🔧 BROWSER API MOCKS
// ================================================================================================

// Mock localStorage with Hebrew support
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    const hebrewData = {
      'user-preferences': JSON.stringify({
        language: 'he',
        theme: 'light',
        rtl: true,
      }),
      'academic-context': JSON.stringify(global.ACADEMIC_CONTEXT),
    };
    return hebrewData[key as keyof typeof hebrewData] || null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ================================================================================================
// 🧪 TESTING UTILITIES
// ================================================================================================

// Hebrew text testing utilities
global.testUtils = {
  // Check if text contains Hebrew characters
  hasHebrewText: (text: string): boolean => /[\u0590-\u05FF]/.test(text),
  
  // Check if element has RTL direction
  hasRTLDirection: (element: HTMLElement): boolean => {
    const computedStyle = window.getComputedStyle(element);
    return computedStyle.direction === 'rtl';
  },
  
  // Mock academic data generators
  generateMockAssignment: (overrides = {}) => ({
    id: 'test-assignment-id',
    title: 'מטלה במדעי המחשב',
    description: 'תיאור המטלה',
    courseId: 'test-course-id',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'MEDIUM',
    status: 'PENDING',
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),
  
  generateMockCourse: (overrides = {}) => ({
    id: 'test-course-id',
    code: '201-1-1234',
    name: 'מבוא למדעי המחשב',
    nameEn: 'Introduction to Computer Science',
    credits: 4,
    semester: 'א',
    academicYear: 2024,
    faculty: 'הפקולטה למדעי הטבע',
    department: 'מדעי המחשב',
    instructor: 'ד"ר ישראל ישראלי',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),
  
  generateMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@bgu.ac.il',
    name: 'ישראל ישראלי',
    studentId: '123456789',
    faculty: 'הפקולטה למדעי הטבע',
    department: 'מדעי המחשב',
    yearOfStudy: 3,
    avatar: null,
    preferences: {
      language: 'he',
      theme: 'light',
      notifications: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),
};

// ================================================================================================
// 🔧 TEST CONSOLE OVERRIDES
// ================================================================================================

// Suppress console warnings in tests (but keep errors)
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  // Suppress specific warnings that are expected in tests
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('React Router') ||
     message.includes('act()') ||
     message.includes('Warning: ReactDOM.render'))
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

// ================================================================================================
// 🎓 ACADEMIC TEST ENVIRONMENT SETUP
// ================================================================================================

// Set up academic year context for all tests
beforeEach(() => {
  // Reset academic context
  global.ACADEMIC_CONTEXT = {
    year: 2024,
    semester: 'א',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2025-01-31'),
  };
  
  // Reset RTL direction
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'he';
  
  // Clear all mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  vi.clearAllTimers();
  vi.useRealTimers();
});

// ================================================================================================
// 🌍 GLOBAL TYPE DECLARATIONS
# ================================================================================================

declare global {
  namespace globalThis {
    var ACADEMIC_CONTEXT: {
      year: number;
      semester: string;
      startDate: Date;
      endDate: Date;
    };
    
    var testUtils: {
      hasHebrewText: (text: string) => boolean;
      hasRTLDirection: (element: HTMLElement) => boolean;
      generateMockAssignment: (overrides?: any) => any;
      generateMockCourse: (overrides?: any) => any;
      generateMockUser: (overrides?: any) => any;
    };
  }
}

export {};
