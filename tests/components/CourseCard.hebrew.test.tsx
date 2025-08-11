/**
 * 🎓 COURSE CARD HEBREW COMPONENT TESTS
 * 
 * Comprehensive tests for CourseCard component with Hebrew content and RTL layout
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rtlTesting } from '../utils/rtl-testing';
import { hebrewA11y } from '../utils/hebrew-a11y';
import hebrewData from '../fixtures/hebrew-data';

// Mock CourseCard component (would import from actual component)
const CourseCard = ({ course, onEnroll, isEnrolled }: any) => (
  <div 
    data-testid="course-card"
    dir="rtl"
    lang="he"
    className="course-card border rounded-lg p-4 ms-4"
    role="article"
    aria-label={`קורס ${course.name}, מרצה ${course.instructor}`}
  >
    <div className="course-header mb-3">
      <h3 className="text-xl font-bold text-right mb-1">
        {course.name}
      </h3>
      <p className="text-sm text-gray-600 text-right">
        קוד קורס: {course.code}
      </p>
    </div>
    
    <div className="course-details space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">מרצה:</span>
        <span className="text-sm">{course.instructor}</span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">פקולטה:</span>
        <span className="text-sm">{course.faculty}</span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">נקודות זכות:</span>
        <span className="text-sm">{course.credits}</span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">סמסטר:</span>
        <span className="text-sm">{course.semester}</span>
      </div>
    </div>
    
    <div className="course-actions mt-4 flex justify-start gap-2">
      <button
        data-testid="enroll-button"
        onClick={() => onEnroll?.(course.id)}
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isEnrolled 
            ? 'bg-green-100 text-green-800 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        disabled={isEnrolled}
        aria-label={isEnrolled ? `נרשמת לקורס ${course.name}` : `הירשם לקורס ${course.name}`}
      >
        {isEnrolled ? 'רשום ✓' : 'הירשם לקורס'}
      </button>
      
      <button
        data-testid="details-button"
        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        aria-label={`פרטי קורס ${course.name}`}
      >
        פרטים נוספים
      </button>
    </div>
  </div>
);

describe('CourseCard Hebrew Component', () => {
  const testCourse = hebrewData.courses.computerScience;
  const mockOnEnroll = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ================================================================================================
  // 🌍 HEBREW CONTENT RENDERING TESTS
  // ================================================================================================

  describe('Hebrew Content Rendering', () => {
    it('renders Hebrew course name correctly', () => {
      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      const courseName = screen.getByText(testCourse.name);
      expect(courseName).toBeInTheDocument();
      expect(courseName).toHaveClass('text-right');
    });

    it('displays Hebrew instructor name with proper formatting', () => {
      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      const instructorName = screen.getByText(testCourse.instructor);
      expect(instructorName).toBeInTheDocument();
      
      // Check that Hebrew text is preserved
      expect(instructorName.textContent).toBe(testCourse.instructor);
      expect(rtlTesting.generator.generateUserData().utils.hasHebrew(testCourse.instructor)).toBe(true);
    });

    it('shows Hebrew faculty name correctly', () => {
      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      expect(screen.getByText(testCourse.faculty)).toBeInTheDocument();
      expect(screen.getByText('פקולטה:')).toBeInTheDocument();
    });

    it('displays Hebrew semester notation', () => {
      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      expect(screen.getByText(testCourse.semester)).toBeInTheDocument();
      expect(screen.getByText('סמסטר:')).toBeInTheDocument();
    });
  });

  // ================================================================================================
  # 🎨 RTL LAYOUT TESTS
  // ================================================================================================

  describe('RTL Layout', () => {
    it('has RTL direction attribute', () => {
      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      const courseCard = screen.getByTestId('course-card');
      expect(courseCard).toHaveAttribute('dir', 'rtl');
      expect(courseCard).toHaveAttribute('lang', 'he');
    });

    it('uses logical CSS properties for spacing', () => {
      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      const courseCard = screen.getByTestId('course-card');
      
      # Check for logical margin (ms-4 should translate to margin-inline-start)
      expect(courseCard).toHaveClass('ms-4');
      
      # Verify no hardcoded directional classes
      expect(courseCard.className).not.toMatch(/\b(ml|mr)-/);
    });

    it('aligns Hebrew text to the right', () => {
      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      const courseName = screen.getByRole('heading', { level: 3 });
      expect(courseName).toHaveClass('text-right');
      
      const courseCode = screen.getByText(/קוד קורס:/);
      expect(courseCode).toHaveClass('text-right');
    });

    it('positions buttons correctly in RTL layout', () => {
      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      const buttonContainer = screen.getByTestId('course-card').querySelector('.course-actions');
      expect(buttonContainer).toHaveClass('justify-start');
      
      # In RTL, justify-start means buttons align to the right
      expect(buttonContainer).toHaveClass('flex');
    });
  });

  # ================================================================================================
  # 🧪 INTERACTION TESTS
  # ================================================================================================

  describe('Hebrew Component Interactions', () => {
    it('handles enrollment with Hebrew feedback', async () => {
      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      const enrollButton = screen.getByTestId('enroll-button');
      expect(enrollButton).toHaveTextContent('הירשם לקורס');
      
      await user.click(enrollButton);
      expect(mockOnEnroll).toHaveBeenCalledWith(testCourse.id);
    });

    it('shows enrolled state in Hebrew', () => {
      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} isEnrolled={true} />
      );

      const enrollButton = screen.getByTestId('enroll-button');
      expect(enrollButton).toHaveTextContent('רשום ✓');
      expect(enrollButton).toBeDisabled();
    });

    it('handles keyboard navigation in RTL context', async () => {
      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      const enrollButton = screen.getByTestId('enroll-button');
      const detailsButton = screen.getByTestId('details-button');

      # Tab to first button
      enrollButton.focus();
      expect(enrollButton).toHaveFocus();

      # Tab to next button
      await user.tab();
      expect(detailsButton).toHaveFocus();
    });
  });

  # ================================================================================================
  # ♿ ACCESSIBILITY TESTS
  # ================================================================================================

  describe('Hebrew Accessibility', () => {
    it('has proper ARIA labels in Hebrew', async () => {
      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      const courseCard = screen.getByTestId('course-card');
      
      # Test Hebrew ARIA accessibility
      const a11yResult = hebrewA11y.checker.checkHebrewAriaLabels(courseCard);
      expect(a11yResult.isAccessible).toBe(true);

      # Check specific ARIA label
      const expectedAriaLabel = `קורס ${testCourse.name}, מרצה ${testCourse.instructor}`;
      expect(courseCard).toHaveAttribute('aria-label', expectedAriaLabel);
    });

    it('supports screen readers with Hebrew content', () => {
      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      const courseCard = screen.getByTestId('course-card');
      
      # Test screen reader compatibility
      const screenReaderResult = hebrewA11y.checker.checkHebrewScreenReader(courseCard);
      expect(screenReaderResult.isAccessible).toBe(true);

      # Verify language and direction attributes
      expect(courseCard).toHaveAttribute('lang', 'he');
      expect(courseCard).toHaveAttribute('dir', 'rtl');
    });

    it('has proper role and semantic structure', () => {
      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      const courseCard = screen.getByRole('article');
      expect(courseCard).toBeInTheDocument();

      # Check heading hierarchy
      const courseHeading = screen.getByRole('heading', { level: 3 });
      expect(courseHeading).toHaveTextContent(testCourse.name);
    });
  });

  # ================================================================================================
  # 📱 RESPONSIVE HEBREW TESTS
  # ================================================================================================

  describe('Responsive Hebrew Layout', () => {
    it('maintains RTL layout on mobile', () => {
      # Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      const courseCard = screen.getByTestId('course-card');
      expect(courseCard).toHaveAttribute('dir', 'rtl');
      
      # Hebrew text should still be right-aligned on mobile
      const courseName = screen.getByRole('heading', { level: 3 });
      expect(courseName).toHaveClass('text-right');
    });

    it('adjusts button layout for mobile Hebrew interface', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      # Buttons should maintain proper RTL spacing
      const buttonContainer = screen.getByTestId('course-card').querySelector('.course-actions');
      expect(buttonContainer).toHaveClass('gap-2');
      expect(buttonContainer).toHaveClass('justify-start');
    });
  });

  # ================================================================================================
  # 🌙 THEME TESTS
  # ================================================================================================

  describe('Hebrew Content with Different Themes', () => {
    it('maintains Hebrew readability in dark mode', () => {
      # Mock dark theme
      document.documentElement.setAttribute('data-theme', 'dark');

      rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      const courseCard = screen.getByTestId('course-card');
      
      # Hebrew content should be visible in dark mode
      const courseName = screen.getByText(testCourse.name);
      expect(courseName).toBeVisible();
      
      # RTL direction should be preserved
      expect(courseCard).toHaveAttribute('dir', 'rtl');
    });
  });

  # ================================================================================================
  # 🔄 REAL-TIME UPDATES TESTS
  # ================================================================================================

  describe('Hebrew Content Updates', () => {
    it('updates Hebrew course information reactively', async () => {
      const { rerender } = rtlTesting.render(
        <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
      );

      # Initial Hebrew content
      expect(screen.getByText(testCourse.name)).toBeInTheDocument();

      # Updated Hebrew course data
      const updatedCourse = {
        ...testCourse,
        name: 'מבני נתונים מתקדמים',
        instructor: 'פרופ\' משה כהן'
      };

      rerender(
        <CourseCard course={updatedCourse} onEnroll={mockOnEnroll} />
      );

      # Check updated Hebrew content
      await waitFor(() => {
        expect(screen.getByText(updatedCourse.name)).toBeInTheDocument();
        expect(screen.getByText(updatedCourse.instructor)).toBeInTheDocument();
      });
    });
  });

  # ================================================================================================
  # 🧩 INTEGRATION TESTS
  # ================================================================================================

  describe('Hebrew Component Integration', () => {
    it('integrates properly with Hebrew parent components', () => {
      const HebrewParent = () => (
        <div dir="rtl" lang="he">
          <h2>הקורסים שלי</h2>
          <CourseCard course={testCourse} onEnroll={mockOnEnroll} />
        </div>
      );

      rtlTesting.render(<HebrewParent />);

      # Both parent and child should have RTL
      expect(screen.getByText('הקורסים שלי')).toBeInTheDocument();
      expect(screen.getByTestId('course-card')).toHaveAttribute('dir', 'rtl');
    });

    it('handles Hebrew prop validation', () => {
      # Test with missing Hebrew properties
      const incompleteCourse = {
        ...testCourse,
        name: '', # Empty Hebrew name
        instructor: 'English Instructor Name'
      };

      rtlTesting.render(
        <CourseCard course={incompleteCourse} onEnroll={mockOnEnroll} />
      );

      # Component should handle missing Hebrew gracefully
      const courseCard = screen.getByTestId('course-card');
      expect(courseCard).toBeInTheDocument();
    });
  });
});

# ================================================================================================
# 🎯 CUSTOM HEBREW MATCHERS
# ================================================================================================

# Extend expect with Hebrew-specific matchers
expect.extend({
  toHaveHebrewContent(received) {
    const hasHebrew = /[\u0590-\u05FF]/.test(received.textContent || '');
    return {
      message: () => `Expected element to contain Hebrew characters`,
      pass: hasHebrew,
    };
  },
  
  toBeRTLAligned(received) {
    const style = window.getComputedStyle(received);
    const isRTL = style.direction === 'rtl' && 
                 (style.textAlign === 'right' || style.textAlign === 'start');
    return {
      message: () => `Expected element to be RTL aligned`,
      pass: isRTL,
    };
  }
});

# TypeScript declaration for custom matchers
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toHaveHebrewContent(): any;
      toBeRTLAligned(): any;
    }
  }
}