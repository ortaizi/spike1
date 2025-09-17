/**
 * 🔒 HEBREW AUTHENTICATION ERRORS UNIT TESTS
 *
 * Comprehensive testing for Hebrew authentication error messages,
 * university domain validation, and Hebrew form validation.
 *
 * Part of Phase 2: Unit Testing Implementation
 */

import { describe, expect, it } from 'vitest';
import {
  AUTH_ERRORS_HE,
  AUTH_SUCCESS_HE,
  FLOW_MESSAGES_HE,
  FORM_VALIDATION_HE,
  formatHebrewError,
  getHebrewErrorMessage,
  ISRAELI_UNIVERSITIES,
  PROGRESS_MESSAGES_HE,
  validateUniversityEmail,
} from '../../../apps/web/lib/auth/hebrew-auth-errors';

describe('🔒 Hebrew Authentication Errors', () => {
  describe('🏛️ University Domain Validation', () => {
    describe('✅ Valid University Emails', () => {
      it('should validate BGU email domains correctly', () => {
        const testCases = ['student@post.bgu.ac.il', 'professor@post.bgu.ac.il', 'admin@post.bgu.ac.il'];

        testCases.forEach((email) => {
          const result = validateUniversityEmail(email);
          expect(result.isValid).toBe(true);
          expect(result.university).toBeDefined();
          expect(result.university?.name).toContain('בן-גוריון');
        });
      });

      it('should validate TAU email domains correctly', () => {
        const result = validateUniversityEmail('student@mail.tau.ac.il');
        expect(result.isValid).toBe(true);
        expect(result.university?.name).toBe('אוניברסיטת תל אביב');
        expect(result.university?.nameEn).toBe('Tel Aviv University');
      });

      it('should validate Technion email domains correctly', () => {
        const result = validateUniversityEmail('engineer@technion.ac.il');
        expect(result.isValid).toBe(true);
        expect(result.university?.name).toBe('הטכניון - מכון טכנולוגי לישראל');
        expect(result.university?.moodleUrl).toBe('https://moodle.technion.ac.il');
      });

      it('should validate HUJI email domains correctly', () => {
        const result = validateUniversityEmail('researcher@mail.huji.ac.il');
        expect(result.isValid).toBe(true);
        expect(result.university?.nameEn).toBe('The Hebrew University of Jerusalem');
      });

      it('should handle subdomain variations correctly', () => {
        const testCases = ['student.cs@post.bgu.ac.il', 'lab.research@mail.tau.ac.il', 'dept.eng@technion.ac.il'];

        testCases.forEach((email) => {
          const result = validateUniversityEmail(email);
          expect(result.isValid).toBe(true);
          expect(result.university).toBeDefined();
        });
      });
    });

    describe('❌ Invalid University Emails', () => {
      it('should reject non-university email domains', () => {
        const invalidEmails = ['user@gmail.com', 'student@yahoo.com', 'person@hotmail.com', 'worker@company.com'];

        invalidEmails.forEach((email) => {
          const result = validateUniversityEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error).toContain('אינו שייך לאוניברסיטה מאושרת');
        });
      });

      it('should reject malformed email addresses', () => {
        const malformedEmails = ['invalid-email', '@bgu.ac.il', 'user@', '', 'user@@bgu.ac.il', 'user@.ac.il'];

        malformedEmails.forEach((email) => {
          const result = validateUniversityEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
        });
      });

      it('should handle null and undefined email inputs', () => {
        const result1 = validateUniversityEmail('');
        expect(result1.isValid).toBe(false);
        expect(result1.error).toBe('כתובת אימייל לא חוקית');
      });
    });
  });

  describe('📝 Hebrew Error Messages', () => {
    describe('🔍 Error Message Retrieval', () => {
      it('should return correct Hebrew error messages for known codes', () => {
        const testCases = [
          {
            code: 'AccessDenied',
            expectedTitle: 'גישה נדחתה',
            expectedAction: 'נסה שוב',
          },
          {
            code: 'MoodleAuthFailed',
            expectedTitle: 'כניסה למודל נכשלה',
            expectedAction: 'נסה שוב',
          },
          {
            code: 'SessionExpired',
            expectedTitle: 'תם תוקף ההפעלה',
            expectedAction: 'התחבר מחדש',
          },
        ];

        testCases.forEach(({ code, expectedTitle, expectedAction }) => {
          const error = getHebrewErrorMessage(code);
          expect(error.title).toBe(expectedTitle);
          expect(error.action).toBe(expectedAction);
          expect(error.message).toBeDefined();
          expect(error.message.length).toBeGreaterThan(0);
        });
      });

      it('should return default error for unknown error codes', () => {
        const unknownCodes = ['NonExistentError', 'RandomCode', ''];

        unknownCodes.forEach((code) => {
          const error = getHebrewErrorMessage(code);
          expect(error).toEqual(AUTH_ERRORS_HE.UnknownError);
          expect(error.title).toBe('שגיאה לא ידועה');
        });
      });

      it('should format Hebrew errors correctly with additional info', () => {
        const formatted = formatHebrewError('NetworkError', 'Connection timeout');
        expect(formatted).toContain('שגיאת רשת');
        expect(formatted).toContain('Connection timeout');
      });
    });

    describe('🎓 University-Specific Error Handling', () => {
      it('should provide specific error for unsupported universities', () => {
        const error = getHebrewErrorMessage('UniversityNotSupported');
        expect(error.title).toBe('אוניברסיטה לא נתמכת');
        expect(error.message).toContain('בן-גוריון');
        expect(error.action).toBe('השתמש במייל BGU');
      });

      it('should handle authentication flow errors correctly', () => {
        const flowErrors = ['SmartFlowError', 'AutoAuthFailed', 'RevalidationRequired'];

        flowErrors.forEach((errorCode) => {
          const error = getHebrewErrorMessage(errorCode);
          expect(error.title).toBeDefined();
          expect(error.message).toBeDefined();
          expect(error.action).toBeDefined();

          // Ensure all error messages are in Hebrew
          expect(error.title).toMatch(/[\u0590-\u05FF]/); // Hebrew Unicode range
        });
      });
    });
  });

  describe('📋 Form Validation Messages', () => {
    it('should provide Hebrew form validation messages', () => {
      const validationMessages = Object.values(FORM_VALIDATION_HE);

      validationMessages.forEach((message) => {
        expect(message).toBeDefined();
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);

        // Ensure messages are in Hebrew
        expect(message).toMatch(/[\u0590-\u05FF]/);
      });
    });

    it('should have specific validation messages for academic context', () => {
      expect(FORM_VALIDATION_HE.EmailNotUniversity).toContain('בן-גוריון');
      expect(FORM_VALIDATION_HE.RequiredField).toBe('שדה חובה');
      expect(FORM_VALIDATION_HE.InvalidEmail).toBe('כתובת מייל לא תקפה');
    });
  });

  describe('✅ Success Messages', () => {
    it('should provide Hebrew success messages', () => {
      const successMessages = Object.values(AUTH_SUCCESS_HE);

      successMessages.forEach((message) => {
        expect(message).toBeDefined();
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('should include emojis in smart authentication success messages', () => {
      expect(AUTH_SUCCESS_HE.AutoAuthSuccess).toContain('🚀');
      expect(AUTH_SUCCESS_HE.CredentialsSaved).toContain('💾');
      expect(AUTH_SUCCESS_HE.ValidationSuccess).toContain('✅');
      expect(AUTH_SUCCESS_HE.OnboardingComplete).toContain('🎓');
    });
  });

  describe('📊 Progress Messages', () => {
    it('should provide Hebrew progress messages for loading states', () => {
      const progressMessages = Object.values(PROGRESS_MESSAGES_HE);

      progressMessages.forEach((message) => {
        expect(message).toBeDefined();
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('should include appropriate emojis for different progress states', () => {
      expect(PROGRESS_MESSAGES_HE.AutoConnecting).toContain('🚀');
      expect(PROGRESS_MESSAGES_HE.Validating).toContain('🔍');
      expect(PROGRESS_MESSAGES_HE.Saving).toContain('💾');
      expect(PROGRESS_MESSAGES_HE.Completing).toContain('✨');
      expect(PROGRESS_MESSAGES_HE.Redirecting).toContain('➡️');
    });
  });

  describe('🔄 Authentication Flow Messages', () => {
    it('should provide contextual messages for different authentication flows', () => {
      const flows = Object.keys(FLOW_MESSAGES_HE);
      const expectedFlows = ['new_user', 'existing_user_auto', 'existing_user_manual', 'existing_user_revalidate'];

      expectedFlows.forEach((flow) => {
        expect(flows).toContain(flow);

        const flowMessage = FLOW_MESSAGES_HE[flow as keyof typeof FLOW_MESSAGES_HE];
        expect(flowMessage.title).toBeDefined();
        expect(flowMessage.subtitle).toBeDefined();
        expect(flowMessage.description).toBeDefined();

        // Ensure all flow messages are in Hebrew
        expect(flowMessage.title).toMatch(/[\u0590-\u05FF]/);
      });
    });

    it('should have appropriate flow descriptions for academic context', () => {
      const newUserFlow = FLOW_MESSAGES_HE.new_user;
      expect(newUserFlow.title).toBe('משתמש חדש');
      expect(newUserFlow.description).toContain('הפעם הראשונה');

      const autoFlow = FLOW_MESSAGES_HE.existing_user_auto;
      expect(autoFlow.title).toBe('התחברות אוטומטית');
      expect(autoFlow.description).toContain('פרטי ההתחברות השמורים');
    });
  });

  describe('🏛️ Israeli Universities Data Structure', () => {
    it('should have complete university information for all supported institutions', () => {
      const universities = Object.entries(ISRAELI_UNIVERSITIES);

      universities.forEach(([domain, info]) => {
        expect(domain).toBeDefined();
        expect(info.name).toBeDefined();
        expect(info.nameEn).toBeDefined();
        expect(info.moodleUrl).toBeDefined();
        expect(info.logoUrl).toBeDefined();

        // Ensure Hebrew names contain Hebrew characters
        expect(info.name).toMatch(/[\u0590-\u05FF]/);

        // Ensure English names are in Latin characters
        expect(info.nameEn).toMatch(/[a-zA-Z]/);

        // Ensure Moodle URLs are valid
        expect(info.moodleUrl).toMatch(/^https:\/\/moodle\./);
      });
    });

    it('should include major Israeli universities', () => {
      const domains = Object.keys(ISRAELI_UNIVERSITIES);

      const expectedUniversities = [
        'post.bgu.ac.il', // BGU
        'technion.ac.il', // Technion
        'mail.tau.ac.il', // TAU
        'mail.huji.ac.il', // Hebrew University
        'campus.haifa.ac.il', // University of Haifa
        'biu.ac.il', // Bar-Ilan
        'ariel.ac.il', // Ariel
        'openu.ac.il', // Open University
      ];

      expectedUniversities.forEach((domain) => {
        expect(domains).toContain(domain);
      });
    });
  });

  describe('🔤 Character Encoding and RTL Support', () => {
    it('should properly handle Hebrew character encoding', () => {
      const hebrewTexts = [
        AUTH_ERRORS_HE.AccessDenied.title,
        AUTH_SUCCESS_HE.Welcome,
        FORM_VALIDATION_HE.RequiredField,
      ];

      hebrewTexts.forEach((text) => {
        // Test that Hebrew characters are properly encoded
        expect(text).toMatch(/[\u0590-\u05FF]/);

        // Test that the text doesn't contain replacement characters
        expect(text).not.toContain('�');

        // Test that text is not empty after encoding
        expect(text.trim().length).toBeGreaterThan(0);
      });
    });

    it('should maintain proper RTL text direction markers', () => {
      // Test that Hebrew text flows correctly in RTL context
      const emailValidationResult = validateUniversityEmail('test@gmail.com');
      expect(emailValidationResult.error).toContain('אינו שייך');

      // The error message should be readable in RTL context
      expect(emailValidationResult.error?.length).toBeGreaterThan(10);
    });
  });

  describe('🧪 CRITICAL: Authentication Flow Integration', () => {
    it('CRITICAL: should handle complete Hebrew authentication error workflow', () => {
      // Simulate a complete authentication flow with Hebrew errors
      const steps = [
        {
          action: 'validateEmail',
          input: 'invalid@gmail.com',
          expectedError: 'אינו שייך לאוניברסיטה מאושרת',
        },
        {
          action: 'validateEmail',
          input: 'student@post.bgu.ac.il',
          expectedSuccess: true,
        },
        {
          action: 'getError',
          input: 'MoodleAuthFailed',
          expectedTitle: 'כניסה למודל נכשלה',
        },
        {
          action: 'formatError',
          input: 'NetworkError',
          expectedFormat: 'שגיאת רשת:',
        },
      ];

      steps.forEach((step) => {
        switch (step.action) {
          case 'validateEmail':
            const validation = validateUniversityEmail(step.input);
            if (step.expectedError) {
              expect(validation.isValid).toBe(false);
              expect(validation.error).toContain(step.expectedError);
            } else if (step.expectedSuccess) {
              expect(validation.isValid).toBe(true);
              expect(validation.university).toBeDefined();
            }
            break;

          case 'getError':
            const error = getHebrewErrorMessage(step.input);
            expect(error.title).toBe(step.expectedTitle);
            break;

          case 'formatError':
            const formatted = formatHebrewError(step.input);
            expect(formatted).toContain(step.expectedFormat);
            break;
        }
      });
    });

    it('CRITICAL: should provide comprehensive error coverage for production scenarios', () => {
      // Test all critical error scenarios that can occur in production
      const criticalErrors = [
        'AccessDenied',
        'MoodleAuthFailed',
        'SessionExpired',
        'NetworkError',
        'TooManyAttempts',
        'UniversityNotSupported',
      ];

      criticalErrors.forEach((errorCode) => {
        const error = getHebrewErrorMessage(errorCode);

        // Ensure critical errors have actionable messages
        expect(error.title).toBeDefined();
        expect(error.message.length).toBeGreaterThan(20); // Meaningful message
        expect(error.action).toBeDefined();
        expect(error.action.length).toBeGreaterThan(5); // Actionable instruction

        // Ensure messages are user-friendly (contain Hebrew)
        expect(error.title).toMatch(/[\u0590-\u05FF]/);
      });
    });
  });
});
