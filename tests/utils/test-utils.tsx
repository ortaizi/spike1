import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import React, { ReactElement } from 'react';

/**
 * 🧪 TEST UTILITIES - Spike Academic Platform
 *
 * Custom testing utilities with Hebrew/RTL support and
 * academic platform specific test providers
 */

// ================================================================================================
// 🌍 HEBREW/RTL PROVIDER SETUP
// ================================================================================================

interface HebrewProviderProps {
  children: React.ReactNode;
  locale?: string;
  direction?: 'rtl' | 'ltr';
  academicYear?: number;
  semester?: string;
}

const HebrewProvider: React.FC<HebrewProviderProps> = ({
  children,
  locale = 'he-IL',
  direction = 'rtl',
  academicYear = 2024,
  semester = 'א',
}) => {
  React.useEffect(() => {
    // Set document direction for RTL testing
    document.dir = direction;
    document.documentElement.lang = locale;

    // Set academic context in DOM for testing
    document.body.dataset.academicYear = academicYear.toString();
    document.body.dataset.semester = semester;
    document.body.dataset.testEnvironment = 'true';

    return () => {
      // Cleanup
      delete document.body.dataset.academicYear;
      delete document.body.dataset.semester;
      delete document.body.dataset.testEnvironment;
    };
  }, [locale, direction, academicYear, semester]);

  return (
    <div
      dir={direction}
      lang={locale}
      data-testid='hebrew-provider'
      style={{
        direction,
        textAlign: direction === 'rtl' ? 'right' : 'left',
      }}
    >
      {children}
    </div>
  );
};

// ================================================================================================
// 🔐 AUTHENTICATION PROVIDER SETUP
// ================================================================================================

interface AuthProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children, session = null }) => {
  return (
    <SessionProvider session={session} refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
};

// ================================================================================================
// 🎓 ACADEMIC CONTEXT PROVIDER
// ================================================================================================

interface AcademicContextValue {
  academicYear: number;
  semester: string;
  university: string;
  locale: string;
  isRTL: boolean;
}

const AcademicContext = React.createContext<AcademicContextValue>({
  academicYear: 2024,
  semester: 'א',
  university: 'bgu',
  locale: 'he-IL',
  isRTL: true,
});

interface AcademicProviderProps {
  children: React.ReactNode;
  value?: Partial<AcademicContextValue>;
}

const AcademicProvider: React.FC<AcademicProviderProps> = ({ children, value = {} }) => {
  const contextValue: AcademicContextValue = {
    academicYear: 2024,
    semester: 'א',
    university: 'bgu',
    locale: 'he-IL',
    isRTL: true,
    ...value,
  };

  return <AcademicContext.Provider value={contextValue}>{children}</AcademicContext.Provider>;
};

export const useAcademicContext = () => {
  const context = React.useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademicContext must be used within an AcademicProvider');
  }
  return context;
};

// ================================================================================================
// 🛠️ ALL PROVIDERS WRAPPER
// ================================================================================================

interface AllProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
  locale?: string;
  direction?: 'rtl' | 'ltr';
  academicYear?: number;
  semester?: string;
  university?: string;
}

const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  session,
  locale = 'he-IL',
  direction = 'rtl',
  academicYear = 2024,
  semester = 'א',
  university = 'bgu',
}) => {
  return (
    <HebrewProvider
      locale={locale}
      direction={direction}
      academicYear={academicYear}
      semester={semester}
    >
      <AuthProvider session={session}>
        <AcademicProvider
          value={{
            academicYear,
            semester,
            university,
            locale,
            isRTL: direction === 'rtl',
          }}
        >
          {children}
        </AcademicProvider>
      </AuthProvider>
    </HebrewProvider>
  );
};

// ================================================================================================
// 🧪 CUSTOM RENDER FUNCTION
// ================================================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Hebrew/RTL options
  locale?: string;
  direction?: 'rtl' | 'ltr';

  // Academic options
  academicYear?: number;
  semester?: string;
  university?: string;

  // Authentication options
  session?: Session | null;

  // Provider options
  wrapper?: React.ComponentType<any>;
}

/**
 * Custom render function with Hebrew/RTL and academic platform support
 */
export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const {
    locale = 'he-IL',
    direction = 'rtl',
    academicYear = 2024,
    semester = 'א',
    university = 'bgu',
    session = null,
    wrapper,
    ...renderOptions
  } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const content = (
      <AllProviders
        session={session}
        locale={locale}
        direction={direction}
        academicYear={academicYear}
        semester={semester}
        university={university}
      >
        {children}
      </AllProviders>
    );

    if (wrapper) {
      const CustomWrapper = wrapper;
      return <CustomWrapper>{content}</CustomWrapper>;
    }

    return content;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// ================================================================================================
// 🎯 SPECIALIZED RENDER FUNCTIONS
// ================================================================================================

/**
 * Render with authenticated session
 */
export const renderWithAuth = (
  ui: ReactElement,
  options: Omit<CustomRenderOptions, 'session'> & {
    user?: {
      id: string;
      email: string;
      name: string;
      university: string;
    };
  } = {}
) => {
  const { user, ...renderOptions } = options;

  const mockSession: Session = {
    user: {
      id: user?.id || 'test-user-id',
      email: user?.email || 'test@bgu.ac.il',
      name: user?.name || 'בדיקה תלמיד', // Hebrew: Test Student
      university: user?.university || 'bgu',
    },
    expires: new Date(Date.now() + 86400000).toISOString(), // 24 hours
  };

  return renderWithProviders(ui, {
    session: mockSession,
    ...renderOptions,
  });
};

/**
 * Render with RTL/Hebrew specific setup
 */
export const renderWithHebrew = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  return renderWithProviders(ui, {
    locale: 'he-IL',
    direction: 'rtl',
    ...options,
  });
};

/**
 * Render with specific university context
 */
export const renderWithUniversity = (
  ui: ReactElement,
  university: 'bgu' | 'tau' | 'huji' = 'bgu',
  options: CustomRenderOptions = {}
) => {
  return renderWithProviders(ui, {
    university,
    ...options,
  });
};

/**
 * Render with specific academic context
 */
export const renderWithAcademicContext = (
  ui: ReactElement,
  academic: {
    year?: number;
    semester?: string;
    university?: string;
  } = {},
  options: CustomRenderOptions = {}
) => {
  return renderWithProviders(ui, {
    academicYear: academic.year || 2024,
    semester: academic.semester || 'א',
    university: academic.university || 'bgu',
    ...options,
  });
};

// ================================================================================================
// 📱 RESPONSIVE TESTING UTILITIES
// ================================================================================================

/**
 * Simulate mobile Hebrew layout
 */
export const renderMobileHebrew = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  // Mock mobile viewport
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 667,
  });

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));

  return renderWithHebrew(ui, options);
};

/**
 * Simulate desktop Hebrew layout
 */
export const renderDesktopHebrew = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  // Mock desktop viewport
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1440,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 900,
  });

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));

  return renderWithHebrew(ui, options);
};

// ================================================================================================
// 🔄 RE-EXPORT TESTING LIBRARY UTILITIES
// ================================================================================================

// Re-export everything from testing library
export * from '@testing-library/jest-dom';
export * from '@testing-library/react';

// Override the default render with our custom render
export { renderWithProviders as render };

// ================================================================================================
// 🎓 ACADEMIC PLATFORM SPECIFIC EXPORTS
// ================================================================================================

export { AcademicContext, AcademicProvider, AllProviders, AuthProvider, HebrewProvider };

// ================================================================================================
// 📝 USAGE EXAMPLES
// ================================================================================================

/*
// Basic Hebrew/RTL component testing
import { render, screen } from '@/tests/utils/test-utils';

test('renders Hebrew text correctly', () => {
  render(<HebrewComponent />);
  expect(screen.getByText('שלום עולם')).toBeInTheDocument();
});

// Authentication testing
import { renderWithAuth } from '@/tests/utils/test-utils';

test('renders for authenticated user', () => {
  renderWithAuth(<ProtectedComponent />, {
    user: {
      id: 'user-1',
      email: 'student@bgu.ac.il',
      name: 'דוד כהן',
      university: 'bgu',
    },
  });
});

// University-specific testing
import { renderWithUniversity } from '@/tests/utils/test-utils';

test('renders BGU specific content', () => {
  renderWithUniversity(<UniversitySpecificComponent />, 'bgu');
  expect(screen.getByText('אוניברסיטת בן גוריון')).toBeInTheDocument();
});

// Mobile Hebrew testing
import { renderMobileHebrew } from '@/tests/utils/test-utils';

test('mobile Hebrew layout', () => {
  renderMobileHebrew(<ResponsiveComponent />);
  // Test mobile-specific Hebrew layout
});
*/
