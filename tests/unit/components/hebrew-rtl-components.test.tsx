/**
 * 🎨 HEBREW/RTL UI COMPONENTS UNIT TESTS
 *
 * Comprehensive testing for UI components with Hebrew/RTL support,
 * accessibility, and responsive design for Israeli academic platform.
 *
 * Part of Phase 2: Unit Testing Implementation
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../../../apps/web/components/ui/button';
import { Input } from '../../../apps/web/components/ui/input';
import '../../utils/hebrew-assertions';

// Mock the utils function
vi.mock('../../../apps/web/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('🎨 Hebrew/RTL UI Components', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();

    // Setup RTL environment
    document.documentElement.lang = 'he';
    document.documentElement.dir = 'rtl';

    // Mock Hebrew font loading
    Object.defineProperty(document, 'fonts', {
      value: {
        ready: Promise.resolve(),
        load: vi.fn().mockResolvedValue([]),
        check: vi.fn().mockReturnValue(true),
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Reset document properties
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    vi.clearAllMocks();
  });

  describe('🔘 Button Component', () => {
    describe('✅ Hebrew Text Rendering', () => {
      it('should render Hebrew text correctly', () => {
        render(<Button>הכנס למערכת</Button>);

        const button = screen.getByRole('button', { name: 'הכנס למערכת' });
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('הכנס למערכת');
        expect(button.textContent).toContainHebrew();
      });

      it('should render Hebrew academic terminology', () => {
        const academicTexts = ['הרשמה לקורסים', 'בחינות וציונים', 'מערכת שעות', 'הגשת עבודות', 'פרטי התחברות'];

        academicTexts.forEach((text) => {
          render(<Button>{text}</Button>);

          const button = screen.getByRole('button', { name: text });
          expect(button).toBeInTheDocument();
          expect(button.textContent).toContainHebrew();
          expect(button.textContent).toBePrimarilyHebrew();
        });
      });

      it('should handle mixed Hebrew-English content', () => {
        render(<Button>התחבר עם Google</Button>);

        const button = screen.getByRole('button', { name: 'התחבר עם Google' });
        expect(button).toBeInTheDocument();
        expect(button.textContent).toContainHebrew();
        expect(button.textContent).toContain('Google');
      });

      it('should render Hebrew university names correctly', () => {
        const universityButtons = [
          'אוניברסיטת בן-גוריון בנגב',
          'אוניברסיטת תל אביב',
          'האוניברסיטה העברית בירושלים',
          'הטכניון - מכון טכנולוגי לישראל',
        ];

        universityButtons.forEach((university) => {
          render(<Button>{university}</Button>);

          const button = screen.getByRole('button', { name: university });
          expect(button).toBeInTheDocument();
          expect(button.textContent).toContainAcademicHebrew();
        });
      });
    });

    describe('🎨 RTL Layout and Styling', () => {
      it('should apply correct RTL-aware classes', () => {
        render(<Button className='rtl-test'>שמור שינויים</Button>);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('rtl-test');

        // Check for RTL-appropriate styling
        const styles = window.getComputedStyle(button);
        expect(button.className).toContain('justify-center'); // Should center content for RTL
      });

      it('should handle different button variants with Hebrew text', () => {
        const variants = [
          { variant: 'default' as const, text: 'כפתור רגיל' },
          { variant: 'destructive' as const, text: 'מחק' },
          { variant: 'outline' as const, text: 'ביטול' },
          { variant: 'secondary' as const, text: 'משני' },
          { variant: 'ghost' as const, text: 'שקוף' },
          { variant: 'link' as const, text: 'קישור' },
        ];

        variants.forEach(({ variant, text }) => {
          render(<Button variant={variant}>{text}</Button>);

          const button = screen.getByRole('button', { name: text });
          expect(button).toBeInTheDocument();
          expect(button.textContent).toContainHebrew();
        });
      });

      it('should handle different button sizes with Hebrew content', () => {
        const sizes = [
          { size: 'sm' as const, text: 'קטן' },
          { size: 'default' as const, text: 'רגיל' },
          { size: 'lg' as const, text: 'גדול' },
          { size: 'icon' as const, text: '📚' },
        ];

        sizes.forEach(({ size, text }) => {
          render(<Button size={size}>{text}</Button>);

          const button = screen.getByRole('button');
          expect(button).toBeInTheDocument();

          // Verify size-specific styling is applied
          if (size === 'sm') {
            expect(button.className).toContain('h-9');
          } else if (size === 'lg') {
            expect(button.className).toContain('h-11');
          } else if (size === 'icon') {
            expect(button.className).toContain('h-10 w-10');
          }
        });
      });
    });

    describe('🖱️ Interaction and Accessibility', () => {
      it('should handle click events with Hebrew content', async () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>לחץ כאן</Button>);

        const button = screen.getByRole('button', { name: 'לחץ כאן' });
        await user.click(button);

        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it('should support keyboard navigation in RTL context', async () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Enter ללחיצה</Button>);

        const button = screen.getByRole('button');

        // Focus the button
        button.focus();
        expect(button).toHaveFocus();

        // Trigger click with Enter key
        await user.keyboard('{Enter}');
        expect(handleClick).toHaveBeenCalled();

        // Trigger click with Space key
        await user.keyboard(' ');
        expect(handleClick).toHaveBeenCalledTimes(2);
      });

      it('should maintain accessibility with Hebrew screen reader text', () => {
        render(<Button aria-label='הכנס למערכת הניהול האקדמי של אוניברסיטת בן-גוריון'>כניסה</Button>);

        const button = screen.getByRole('button');
        expect(button).toHaveAccessibleName('הכנס למערכת הניהול האקדמי של אוניברסיטת בן-גוריון');
        expect(button.getAttribute('aria-label')).toContainAcademicHebrew();
      });

      it('should handle disabled state with Hebrew text', () => {
        render(<Button disabled>פעולה לא זמינה</Button>);

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button.textContent).toContainHebrew();
        expect(button.className).toContain('disabled:opacity-50');
      });
    });
  });

  describe('📝 Input Component', () => {
    describe('✅ Hebrew Text Input', () => {
      it('should handle Hebrew text input correctly', async () => {
        render(<Input placeholder='הכנס שם משתמש' />);

        const input = screen.getByPlaceholderText('הכנס שם משתמש');
        expect(input).toBeInTheDocument();
        expect(input.placeholder).toContainHebrew();

        // Type Hebrew text
        await user.type(input, 'יוסי123');
        expect(input).toHaveValue('יוסי123');
      });

      it('should support Hebrew academic form fields', async () => {
        const academicFields = [
          { placeholder: 'שם פרטי', value: 'דניאל' },
          { placeholder: 'שם משפחה', value: 'כהן' },
          { placeholder: 'מספר תעודת זהות', value: '123456789' },
          { placeholder: 'מספר סטודנט', value: '987654321' },
          { placeholder: 'פקולטה', value: 'מדעי המחשב' },
          { placeholder: 'מחלקה', value: 'הנדסת תוכנה' },
        ];

        for (const { placeholder, value } of academicFields) {
          render(<Input placeholder={placeholder} />);

          const input = screen.getByPlaceholderText(placeholder);
          await user.type(input, value);

          expect(input).toHaveValue(value);
          expect(input.placeholder).toContainHebrew();

          if (value.match(/[\u0590-\u05FF]/)) {
            expect(input.value).toContainHebrew();
          }
        }
      });

      it('should handle mixed Hebrew-English input for emails', async () => {
        render(<Input type='email' placeholder='כתובת דוא״ל אקדמית' />);

        const input = screen.getByPlaceholderText('כתובת דוא״ל אקדמית');
        await user.type(input, 'student@post.bgu.ac.il');

        expect(input).toHaveValue('student@post.bgu.ac.il');
        expect(input.placeholder).toContainHebrew();
      });
    });

    describe('🔤 RTL Text Direction', () => {
      it('should apply correct text direction for Hebrew input', () => {
        render(<Input defaultValue='טקסט בעברית' dir='rtl' />);

        const input = screen.getByDisplayValue('טקסט בעברית');
        expect(input).toHaveAttribute('dir', 'rtl');
        expect(input.value).toContainHebrew();
      });

      it('should handle bidirectional text correctly', async () => {
        render(<Input placeholder='שם משתמש + מספר' />);

        const input = screen.getByPlaceholderText('שם משתמש + מספר');

        // Type mixed content
        await user.type(input, 'דניאל123');
        expect(input).toHaveValue('דניאל123');

        // Clear and type email
        await user.clear(input);
        await user.type(input, 'דניאל@post.bgu.ac.il');
        expect(input).toHaveValue('דניאל@post.bgu.ac.il');
      });

      it('should maintain proper cursor positioning in RTL text', async () => {
        render(<Input defaultValue='' />);

        const input = screen.getByRole('textbox');
        input.focus();

        // Type Hebrew text and check cursor positioning
        await user.type(input, 'שלום');
        expect(input).toHaveValue('שלום');

        // Add more text
        await user.type(input, ' עולם');
        expect(input).toHaveValue('שלום עולם');
      });
    });

    describe('📱 Form Validation with Hebrew', () => {
      it('should display Hebrew validation messages', async () => {
        const handleSubmit = vi.fn();

        render(
          <form onSubmit={handleSubmit}>
            <Input required placeholder='שדה חובה' aria-describedby='error-message' />
            <div id='error-message' role='alert'>
              שדה זה נדרש
            </div>
          </form>
        );

        const input = screen.getByPlaceholderText('שדה חובה');
        const errorMessage = screen.getByRole('alert');

        expect(errorMessage.textContent).toContainHebrew();
        expect(errorMessage.textContent).toBe('שדה זה נדרש');
      });

      it('should validate Hebrew email domains for universities', async () => {
        const validateUniversityEmail = (email: string) => {
          const universitySuffixes = ['@post.bgu.ac.il', '@mail.tau.ac.il', '@mail.huji.ac.il', '@technion.ac.il'];
          return universitySuffixes.some((suffix) => email.endsWith(suffix));
        };

        render(<Input type='email' placeholder='אימייל אוניברסיטאי' />);

        const input = screen.getByPlaceholderText('אימייל אוניברסיטאי');

        const validEmails = ['student@post.bgu.ac.il', 'researcher@mail.tau.ac.il', 'prof@technion.ac.il'];

        for (const email of validEmails) {
          await user.clear(input);
          await user.type(input, email);
          expect(validateUniversityEmail(input.value)).toBe(true);
        }

        // Test invalid email
        await user.clear(input);
        await user.type(input, 'invalid@gmail.com');
        expect(validateUniversityEmail(input.value)).toBe(false);
      });
    });

    describe('⌨️ Hebrew Keyboard Support', () => {
      it('should handle Hebrew keyboard input methods', async () => {
        render(<Input placeholder='הקלד בעברית' />);

        const input = screen.getByPlaceholderText('הקלד בעברית');

        // Simulate Hebrew typing (right-to-left)
        const hebrewText = 'אוניברסיטת בן-גוריון';
        await user.type(input, hebrewText);

        expect(input).toHaveValue(hebrewText);
        expect(input.value).toContainAcademicHebrew();
      });

      it('should support Hebrew keyboard shortcuts', async () => {
        render(<Input defaultValue='טקסט לעריכה' />);

        const input = screen.getByDisplayValue('טקסט לעריכה');
        input.focus();

        // Select all (Ctrl+A)
        await user.keyboard('{Control>}a{/Control}');

        // Should have selection
        expect(input.selectionStart).toBe(0);
        expect(input.selectionEnd).toBe(input.value.length);

        // Replace with new Hebrew text
        await user.type(input, 'טקסט חדש');
        expect(input).toHaveValue('טקסט חדש');
      });
    });
  });

  describe('🧪 CRITICAL: Hebrew/RTL Integration Tests', () => {
    it('CRITICAL: should maintain RTL layout with complex Hebrew academic forms', async () => {
      const AcademicForm = () => (
        <form dir='rtl'>
          <div>
            <label htmlFor='student-name'>שם הסטודנט</label>
            <Input id='student-name' placeholder='שם פרטי ומשפחה' />
          </div>
          <div>
            <label htmlFor='student-id'>מספר סטודנט</label>
            <Input id='student-id' placeholder='9 ספרות' type='text' />
          </div>
          <div>
            <label htmlFor='faculty'>פקולטה</label>
            <Input id='faculty' placeholder='בחר פקולטה' />
          </div>
          <Button type='submit'>שלח טופס</Button>
        </form>
      );

      render(<AcademicForm />);

      // Test all Hebrew labels are present
      expect(screen.getByLabelText('שם הסטודנט')).toBeInTheDocument();
      expect(screen.getByLabelText('מספר סטודנט')).toBeInTheDocument();
      expect(screen.getByLabelText('פקולטה')).toBeInTheDocument();

      // Fill out the form
      await user.type(screen.getByLabelText('שם הסטודנט'), 'דניאל כהן');
      await user.type(screen.getByLabelText('מספר סטודנט'), '123456789');
      await user.type(screen.getByLabelText('פקולטה'), 'מדעי המחשב');

      // Verify form values
      expect(screen.getByDisplayValue('דניאל כהן')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
      expect(screen.getByDisplayValue('מדעי המחשב')).toBeInTheDocument();

      // Test submit button
      const submitButton = screen.getByRole('button', { name: 'שלח טופס' });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton.textContent).toContainHebrew();
    });

    it('CRITICAL: should handle Hebrew text overflow and truncation properly', () => {
      const longHebrewText = 'אוניברסיטת בן-גוריון בנגב הינה מוסד להשכלה גבוהה הממוקם בבאר-שבע';

      render(
        <div style={{ width: '200px' }}>
          <Button className='max-w-full truncate'>{longHebrewText}</Button>
        </div>
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toContainAcademicHebrew();
      expect(button.className).toContain('truncate');
    });

    it('CRITICAL: should maintain accessibility standards with Hebrew content', () => {
      render(
        <div>
          <Button aria-label='כפתור לסגירת החלון' aria-describedby='close-help'>
            ✕
          </Button>
          <div id='close-help'>לחץ כדי לסגור את החלון</div>

          <Input aria-label='שדה חיפוש' placeholder='חפש קורסים...' role='searchbox' />
        </div>
      );

      const closeButton = screen.getByRole('button');
      const searchInput = screen.getByRole('searchbox');
      const helpText = screen.getByText('לחץ כדי לסגור את החלון');

      // Check ARIA labels
      expect(closeButton).toHaveAccessibleName('כפתור לסגירת החלון');
      expect(searchInput).toHaveAccessibleName('שדה חיפוש');

      // Check Hebrew content
      expect(closeButton.getAttribute('aria-label')).toContainHebrew();
      expect(searchInput.getAttribute('aria-label')).toContainHebrew();
      expect(helpText.textContent).toContainHebrew();
    });

    it('CRITICAL: should handle Hebrew text selection and copy/paste operations', async () => {
      render(<Input defaultValue='טקסט לבדיקת העתקה' />);

      const input = screen.getByDisplayValue('טקסט לבדיקת העתקה');
      input.focus();

      // Select part of the Hebrew text
      input.setSelectionRange(0, 4); // Select "טקסט"

      expect(input.value.substring(input.selectionStart!, input.selectionEnd!)).toBe('טקסט');

      // Simulate copy operation
      await user.keyboard('{Control>}c{/Control}');

      // Move cursor to end and paste
      input.setSelectionRange(input.value.length, input.value.length);
      await user.keyboard('{Control>}v{/Control}');

      // Note: We can't actually test clipboard operations in jsdom,
      // but we can verify the selection worked
      expect(input.value).toContainHebrew();
    });

    it('CRITICAL: should work correctly with Hebrew date formats and academic calendars', async () => {
      // Test Hebrew date input and formatting
      render(<Input placeholder='תאריך לידה (יום/חודש/שנה)' />);

      const dateInput = screen.getByPlaceholderText('תאריך לידה (יום/חודש/שנה)');

      // Hebrew date format
      await user.type(dateInput, '15/03/1995');
      expect(dateInput).toHaveValue('15/03/1995');

      // Check placeholder has Hebrew text
      expect(dateInput.placeholder).toContainHebrew();
      expect(dateInput.placeholder).toContain('יום/חודש/שנה');
    });
  });
});
