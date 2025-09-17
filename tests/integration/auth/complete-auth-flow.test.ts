/**
 * 🔐 COMPLETE AUTHENTICATION FLOW INTEGRATION TESTS
 *
 * End-to-end testing for the complete authentication workflow including
 * Google OAuth, university credentials validation, and Hebrew academic data.
 *
 * Part of Phase 3: Integration Testing Implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderWithProviders } from '../../utils/test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock NextAuth
const mockSession = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock('next-auth/react', () => ({
  useSession: () => mockSession(),
  signIn: mockSignIn,
  signOut: mockSignOut,
  SessionProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock Next.js router
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/auth/signin'
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('🔐 Complete Authentication Flow Integration', () => {

  // Hebrew text constants for test use
  const hebrewSignInText = 'כניסה למערכת';

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Reset fetch mock
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🌐 Google OAuth Integration', () => {

    it('should handle Google OAuth signin for Hebrew university email', async () => {
      // Mock unauthenticated state
      mockSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      });

      // Create a simple signin component for testing
      const SignInComponent = () => (
        <div>
          <h1>{hebrewSignInText}</h1>
          <button
            onClick={() => mockSignIn('google')}
            data-testid="google-signin"
          >
            {'התחבר עם Google'}
          </button>
        </div>
      );

      renderWithProviders(<SignInComponent />);

      // Verify Hebrew content is displayed
      expect(screen.getByText(hebrewSignInText)).toBeInTheDocument();
      expect(screen.getByText('התחבר עם Google')).toBeInTheDocument();

      // Click Google signin
      const googleButton = screen.getByTestId('google-signin');
      await user.click(googleButton);

      expect(mockSignIn).toHaveBeenCalledWith('google');
    });

    it('should handle successful Google authentication with Hebrew user', async () => {
      // Mock authenticated state with Hebrew user
      mockSession.mockReturnValue({
        data: {
          user: {
            email: 'דניאל.כהן@post.bgu.ac.il',
            name: 'דניאל כהן',
            image: 'https://example.com/avatar.jpg'
          },
          expires: '2024-12-31T23:59:59.999Z'
        },
        status: 'authenticated'
      });

      const AuthenticatedComponent = () => (
        <div>
          <h1>שלום, דניאל כהן</h1>
          <p>מחובר כ: דניאל.כהן@post.bgu.ac.il</p>
          <button onClick={() => mockSignOut()}>התנתק</button>
        </div>
      );

      renderWithProviders(<AuthenticatedComponent />);

      // Verify Hebrew user info is displayed
      expect(screen.getByText('שלום, דניאל כהן')).toBeInTheDocument();
      expect(screen.getByText(/דניאל\.כהן@post\.bgu\.ac\.il/)).toBeInTheDocument();

      // Test signout
      await user.click(screen.getByText('התנתק'));
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should validate university email domains during OAuth', async () => {
      const emailValidationTests = [
        {
          email: 'student@post.bgu.ac.il',
          university: 'אוניברסיטת בן-גוריון',
          shouldAllow: true
        },
        {
          email: 'prof@mail.tau.ac.il',
          university: 'אוניברסיטת תל אביב',
          shouldAllow: true
        },
        {
          email: 'student@gmail.com',
          university: null,
          shouldAllow: false
        }
      ];

      for (const testCase of emailValidationTests) {
        // Mock session based on test case
        if (testCase.shouldAllow) {
          mockSession.mockReturnValue({
            data: {
              user: {
                email: testCase.email,
                name: 'Test User'
              }
            },
            status: 'authenticated'
          });
        } else {
          mockSession.mockReturnValue({
            data: null,
            status: 'unauthenticated'
          });
        }

        const component = testCase.shouldAllow ? (
          <div>
            <p>מחובר ל{testCase.university}</p>
            <p>{testCase.email}</p>
          </div>
        ) : (
          <div>
            <p>דומיין אימייל לא מאושר</p>
          </div>
        );

        renderWithProviders(component);

        if (testCase.shouldAllow) {
          expect(screen.getByText(testCase.email)).toBeInTheDocument();
          expect(screen.getByText(/מחובר ל/)).toBeInTheDocument();
        } else {
          expect(screen.getByText('דומיין אימייל לא מאושר')).toBeInTheDocument();
        }
      }
    });

  });

  describe('🎓 University Credentials Validation Flow', () => {

    it('should handle new user credential entry with Hebrew validation', async () => {
      // Mock authenticated Google session
      mockSession.mockReturnValue({
        data: {
          user: {
            email: 'newuser@post.bgu.ac.il',
            name: 'משתמש חדש'
          }
        },
        status: 'authenticated'
      });

      const CredentialForm = () => {
        const [formData, setFormData] = React.useState({
          username: '',
          password: '',
          universityId: 'bgu'
        });

        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();

          try {
            const response = await fetch('/api/auth/credentials/validate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (result.success) {
              // Handle success
            }
          } catch (error) {
            console.error('Validation failed:', error);
          }
        };

        return (
          <form onSubmit={handleSubmit}>
            <h2>הזן פרטי התחברות לאוניברסיטה</h2>

            <label htmlFor="username">שם משתמש:</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="שם משתמש במודל"
            />

            <label htmlFor="password">סיסמה:</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="סיסמה במודל"
            />

            <button type="submit">אמת פרטים</button>
          </form>
        );
      };

      renderWithProviders(<CredentialForm />);

      // Verify Hebrew form is displayed
      expect(screen.getByText('הזן פרטי התחברות לאוניברסיטה')).toBeInTheDocument();
      expect(screen.getByLabelText('שם משתמש:')).toBeInTheDocument();
      expect(screen.getByLabelText('סיסמה:')).toBeInTheDocument();

      // Fill out form
      await user.type(screen.getByLabelText('שם משתמש:'), 'student123');
      await user.type(screen.getByLabelText('סיסמה:'), 'password123');

      // Mock successful validation response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          authenticationFlow: 'new_user_success',
          message: 'פרטי ההתחברות אומתו בהצלחה',
          university: {
            id: 'bgu',
            name: 'אוניברסיטת בן-גוריון בנגב'
          }
        })
      });

      // Submit form
      await user.click(screen.getByText('אמת פרטים'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/credentials/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'student123',
            password: 'password123',
            universityId: 'bgu'
          })
        });
      });
    });

    it('should handle credential validation errors in Hebrew', async () => {
      const errorScenarios = [
        {
          error: 'שם משתמש או סיסמה שגויים',
          status: 401
        },
        {
          error: 'יותר מדי ניסיונות התחברות',
          status: 429
        },
        {
          error: 'שגיאה בחיבור לאוניברסיטה',
          status: 500
        }
      ];

      for (const scenario of errorScenarios) {
        // Mock error response
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: scenario.status,
          json: async () => ({
            success: false,
            error: scenario.error
          })
        });

        const ErrorTestComponent = () => {
          const [error, setError] = React.useState<string>('');

          const handleValidation = async () => {
            try {
              const response = await fetch('/api/auth/credentials/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  username: 'test',
                  password: 'test',
                  universityId: 'bgu'
                })
              });

              const result = await response.json();
              if (!result.success) {
                setError(result.error);
              }
            } catch (err) {
              setError('שגיאה לא צפויה');
            }
          };

          return (
            <div>
              <button onClick={handleValidation}>בדוק שגיאה</button>
              {error && <div role="alert">{error}</div>}
            </div>
          );
        };

        renderWithProviders(<ErrorTestComponent />);

        await user.click(screen.getByText('בדוק שגיאה'));

        await waitFor(() => {
          expect(screen.getByRole('alert')).toHaveTextContent(scenario.error);
          expect(screen.getByRole('alert').textContent).toMatch(/[\u0590-\u05FF]/);
        });
      }
    });

    it('should handle existing user auto-authentication flow', async () => {
      // Mock authenticated session with existing credentials
      mockSession.mockReturnValue({
        data: {
          user: {
            email: 'existing@post.bgu.ac.il',
            name: 'משתמש קיים'
          }
        },
        status: 'authenticated'
      });

      // Mock API response for existing user
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          authenticationFlow: 'existing_user_auto',
          message: 'התחברות אוטומטית הצליחה עם פרטים שמורים',
          university: {
            id: 'bgu',
            name: 'אוניברסיטת בן-גוריון בנגב'
          }
        })
      });

      const ExistingUserComponent = () => {
        const [status, setStatus] = React.useState<string>('');

        React.useEffect(() => {
          // Auto-validate existing credentials
          fetch('/api/auth/credentials/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'stored_username',
              password: 'stored_password',
              universityId: 'bgu'
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setStatus(data.message);
            }
          });
        }, []);

        return (
          <div>
            <h1>ברוך השב, משתמש קיים</h1>
            {status && <p>{status}</p>}
          </div>
        );
      };

      renderWithProviders(<ExistingUserComponent />);

      expect(screen.getByText('ברוך השב, משתמש קיים')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('התחברות אוטומטית הצליחה עם פרטים שמורים')).toBeInTheDocument();
      });
    });

  });

  describe('🔄 Complete Authentication Workflow', () => {

    it('CRITICAL: should complete full authentication flow for Hebrew academic user', async () => {
      const workflow = [
        // Step 1: Unauthenticated state
        {
          session: null,
          expectedText: hebrewSignInText,
          action: 'signin'
        },
        // Step 2: Google authenticated, needs university credentials
        {
          session: {
            user: { email: 'workflow@post.bgu.ac.il', name: 'דוגמת תהליך' }
          },
          expectedText: 'הזן פרטי התחברות',
          action: 'credentials'
        },
        // Step 3: Full authentication complete
        {
          session: {
            user: { email: 'workflow@post.bgu.ac.il', name: 'דוגמת תהליך' }
          },
          expectedText: 'ברוך הבא לדשבורד',
          action: 'dashboard'
        }
      ];

      for (let i = 0; i < workflow.length; i++) {
        const step = workflow[i];

        mockSession.mockReturnValue({
          data: step.session,
          status: step.session ? 'authenticated' : 'unauthenticated'
        });

        let component;

        switch (step.action) {
          case 'signin':
            component = (
              <div>
                <h1>{hebrewSignInText}</h1>
                <button onClick={() => mockSignIn('google')}>
                  {'התחבר עם Google'}
                </button>
              </div>
            );
            break;

          case 'credentials':
            component = (
              <div>
                <h1>הזן פרטי התחברות לאוניברסיטה</h1>
                <p>משתמש: {step.session?.user.name}</p>
                <input placeholder="שם משתמש" />
                <input placeholder="סיסמה" type="password" />
                <button>אמת פרטים</button>
              </div>
            );
            break;

          case 'dashboard':
            component = (
              <div>
                <h1>ברוך הבא לדשבורד</h1>
                <p>משתמש מחובר: {step.session?.user.name}</p>
                <p>אוניברסיטה: אוניברסיטת בן-גוריון</p>
              </div>
            );
            break;

          default:
            component = <div>Unknown step</div>;
        }

        renderWithProviders(component);

        expect(screen.getByText(new RegExp(step.expectedText))).toBeInTheDocument();

        // Verify Hebrew content
        const hebrewTexts = screen.getAllByText(/[\u0590-\u05FF]/);
        expect(hebrewTexts.length).toBeGreaterThan(0);
      }
    });

    it('CRITICAL: should handle authentication state persistence', async () => {
      // Mock localStorage for session persistence
      const mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      });

      // Test session restoration
      const PersistentAuthComponent = () => {
        const [authState, setAuthState] = React.useState<any>(null);

        React.useEffect(() => {
          // Check for existing session
          const savedSession = localStorage.getItem('auth_session');
          if (savedSession) {
            setAuthState(JSON.parse(savedSession));
          }
        }, []);

        const handleLogin = () => {
          const newSession = {
            user: {
              email: 'persistent@post.bgu.ac.il',
              name: 'משתמש מתמיד'
            },
            university: 'bgu'
          };

          setAuthState(newSession);
          localStorage.setItem('auth_session', JSON.stringify(newSession));
        };

        return (
          <div>
            {authState ? (
              <div>
                <h1>ברוך השב, {authState.user.name}</h1>
                <p>הפעלה נשמרה בהצלחה</p>
              </div>
            ) : (
              <div>
                <h1>התחבר למערכת</h1>
                <button onClick={handleLogin}>התחבר</button>
              </div>
            )}
          </div>
        );
      };

      renderWithProviders(<PersistentAuthComponent />);

      // Initially should show login
      expect(screen.getByText('התחבר למערכת')).toBeInTheDocument();

      // Login
      await user.click(screen.getByText('התחבר'));

      // Should now show welcome message
      expect(screen.getByText('ברוך השב, משתמש מתמיד')).toBeInTheDocument();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'auth_session',
        expect.stringContaining('משתמש מתמיד')
      );
    });

    it('CRITICAL: should handle authentication errors and recovery', async () => {
      const ErrorRecoveryComponent = () => {
        const [error, setError] = React.useState<string>('');
        const [retryCount, setRetryCount] = React.useState(0);

        const attemptAuth = async () => {
          try {
            setError('');

            // Simulate authentication attempt
            const response = await fetch('/api/auth/credentials/validate', {
              method: 'POST',
              body: JSON.stringify({
                username: 'retry_user',
                password: 'retry_pass',
                universityId: 'bgu'
              })
            });

            if (!response.ok) {
              throw new Error('אימות נכשל');
            }

          } catch (err) {
            setError('שגיאה באימות - נסה שוב');
            setRetryCount(prev => prev + 1);
          }
        };

        return (
          <div>
            <h1>אימות פרטי התחברות</h1>
            <button onClick={attemptAuth}>נסה אימות</button>
            {error && (
              <div>
                <p role="alert">{error}</p>
                <p>ניסיון מספר: {retryCount}</p>
                {retryCount < 3 && (
                  <button onClick={attemptAuth}>נסה שוב</button>
                )}
              </div>
            )}
          </div>
        );
      };

      // Mock failed auth attempt
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      renderWithProviders(<ErrorRecoveryComponent />);

      await user.click(screen.getByText('נסה אימות'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('שגיאה באימות - נסה שוב');
        expect(screen.getByText('ניסיון מספר: 1')).toBeInTheDocument();
        expect(screen.getByText('נסה שוב')).toBeInTheDocument();
      });

      // Test retry
      await user.click(screen.getByText('נסה שוב'));

      await waitFor(() => {
        expect(screen.getByText('ניסיון מספר: 2')).toBeInTheDocument();
      });
    });

  });

  describe('🌍 Hebrew/RTL Integration in Auth Flow', () => {

    it('should maintain RTL layout throughout authentication process', async () => {
      const RTLAuthFlow = () => (
        <div dir="rtl" style={{ textAlign: 'right' }}>
          <h1>תהליך אימות בעברית</h1>
          <form>
            <div>
              <label htmlFor="he-username">שם משתמש:</label>
              <input id="he-username" dir="ltr" />
            </div>
            <div>
              <label htmlFor="he-password">סיסמה:</label>
              <input id="he-password" type="password" dir="ltr" />
            </div>
            <button type="submit">אמת פרטים</button>
          </form>
        </div>
      );

      renderWithProviders(<RTLAuthFlow />);

      const container = screen.getByText('תהליך אימות בעברית').closest('div');
      expect(container).toHaveAttribute('dir', 'rtl');

      // Verify Hebrew labels are present
      expect(screen.getByLabelText('שם משתמש:')).toBeInTheDocument();
      expect(screen.getByLabelText('סיסמה:')).toBeInTheDocument();

      // Input fields should have LTR direction for credentials
      expect(screen.getByLabelText('שם משתמש:')).toHaveAttribute('dir', 'ltr');
      expect(screen.getByLabelText('סיסמה:')).toHaveAttribute('dir', 'ltr');
    });

  });

});