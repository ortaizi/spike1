/**
 * 🌍 RTL TESTING UTILITIES
 * 
 * Comprehensive utilities for testing Hebrew/RTL components in Spike platform
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import hebrewData from '../fixtures/hebrew-data';

// ================================================================================================
// 🌍 RTL RENDER WRAPPER
// ================================================================================================

interface RTLRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: 'he' | 'en';
  direction?: 'rtl' | 'ltr';
  theme?: 'light' | 'dark';
  initialProps?: Record<string, any>;
}

/**
 * Custom render function that sets up RTL context for components
 */
export const renderRTL = (
  ui: ReactElement,
  options: RTLRenderOptions = {}
): RenderResult => {
  const {
    locale = 'he',
    direction = 'rtl',
    theme = 'light',
    initialProps = {},
    ...renderOptions
  } = options;

  // RTL Wrapper component
  const RTLWrapper = ({ children }: { children?: ReactNode }) => (
    <div 
      dir={direction}
      lang={locale}
      data-theme={theme}
      className={direction === 'rtl' ? 'rtl' : 'ltr'}
      style={{
        direction,
        textAlign: direction === 'rtl' ? 'right' : 'left'
      }}
    >
      {children}
    </div>
  );

  // Set up environment
  document.documentElement.dir = direction;
  document.documentElement.lang = locale;
  
  const result = render(ui, {
    wrapper: RTLWrapper,
    ...renderOptions
  });

  return result;
};

// ================================================================================================
// 🔍 RTL TESTING MATCHERS
// ================================================================================================

export const rtlMatchers = {
  /**
   * Check if element has RTL direction
   */
  toBeRTL: (element: HTMLElement) => {
    const computedStyle = window.getComputedStyle(element);
    const elementDir = element.getAttribute('dir') || 
                     element.closest('[dir]')?.getAttribute('dir') || 
                     computedStyle.direction;
    
    return {
      pass: elementDir === 'rtl',
      message: () => `Expected element to have RTL direction, but got: ${elementDir}`
    };
  },

  /**
   * Check if element uses logical CSS properties
   */
  toUseLogicalProperties: (element: HTMLElement) => {
    const computedStyle = window.getComputedStyle(element);
    const hasLogicalProps = [
      'marginInlineStart', 'marginInlineEnd',
      'paddingInlineStart', 'paddingInlineEnd',
      'insetInlineStart', 'insetInlineEnd'
    ].some(prop => computedStyle.getPropertyValue(prop) !== '');
    
    const hasDirectionalProps = [
      'marginLeft', 'marginRight',
      'paddingLeft', 'paddingRight',
      'left', 'right'
    ].some(prop => computedStyle.getPropertyValue(prop) !== '');

    return {
      pass: hasLogicalProps && !hasDirectionalProps,
      message: () => hasDirectionalProps 
        ? 'Element uses directional properties instead of logical ones'
        : 'Element should use logical CSS properties for RTL support'
    };
  },

  /**
   * Check if Hebrew text is displayed correctly
   */
  toDisplayHebrewCorrectly: (element: HTMLElement) => {
    const text = element.textContent || '';
    const hasHebrew = /[\u0590-\u05FF]/.test(text);
    
    if (!hasHebrew) {
      return {
        pass: false,
        message: () => 'Element does not contain Hebrew text'
      };
    }

    const computedStyle = window.getComputedStyle(element);
    const direction = computedStyle.direction;
    const textAlign = computedStyle.textAlign;

    const isCorrect = direction === 'rtl' && 
                     (textAlign === 'right' || textAlign === 'start');

    return {
      pass: isCorrect,
      message: () => `Hebrew text should be RTL aligned, but got direction: ${direction}, textAlign: ${textAlign}`
    };
  }
};

// ================================================================================================
// 🎭 RTL INTERACTION HELPERS
// ================================================================================================

export class RTLInteractions {
  private user = userEvent.setup();

  /**
   * Navigate using RTL-aware keyboard shortcuts
   */
  async navigateRTL(element: HTMLElement, direction: 'next' | 'previous') {
    // In RTL, logical direction is reversed
    const key = direction === 'next' ? 'ArrowLeft' : 'ArrowRight';
    await this.user.keyboard(`{${key}}`);
  }

  /**
   * Type Hebrew text with proper direction
   */
  async typeHebrew(element: HTMLElement, text: string) {
    await this.user.click(element);
    await this.user.clear(element);
    
    // Add RTL mark before Hebrew text
    const rtlText = '\u202D' + text + '\u202C';
    await this.user.type(element, rtlText);
  }

  /**
   * Test tab navigation in RTL layout
   */
  async testRTLTabNavigation(startElement: HTMLElement) {
    const results: HTMLElement[] = [];
    let currentElement = startElement;
    
    // Tab through elements and record focus order
    for (let i = 0; i < 10; i++) {
      await this.user.tab();
      const focusedElement = document.activeElement as HTMLElement;
      if (!focusedElement || focusedElement === currentElement) break;
      
      results.push(focusedElement);
      currentElement = focusedElement;
    }
    
    return results;
  }
}

// ================================================================================================
// 📊 RTL LAYOUT VALIDATORS
// ================================================================================================

export class RTLLayoutValidator {
  /**
   * Validate RTL layout for form elements
   */
  validateFormRTL(form: HTMLElement) {
    const issues: string[] = [];
    
    // Check form direction
    if (form.dir !== 'rtl') {
      issues.push('Form should have dir="rtl" attribute');
    }

    // Check label positioning
    const labels = form.querySelectorAll('label');
    labels.forEach((label, index) => {
      const computedStyle = window.getComputedStyle(label);
      if (computedStyle.textAlign !== 'right' && computedStyle.textAlign !== 'start') {
        issues.push(`Label ${index + 1} should be right-aligned in RTL`);
      }
    });

    // Check input alignment
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      const computedStyle = window.getComputedStyle(input);
      if (computedStyle.direction !== 'rtl') {
        issues.push(`Input ${index + 1} should have RTL direction for Hebrew input`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Validate RTL layout for navigation menus
   */
  validateNavRTL(nav: HTMLElement) {
    const issues: string[] = [];
    
    const navItems = nav.querySelectorAll('a, button');
    navItems.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const nextItem = navItems[index + 1] as HTMLElement;
      
      if (nextItem) {
        const nextRect = nextItem.getBoundingClientRect();
        // In RTL, next item should be to the left
        if (nextRect.left > rect.left) {
          issues.push(`Navigation item ${index + 1} appears to be in LTR order`);
        }
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Validate RTL layout for card/list components
   */
  validateCardListRTL(container: HTMLElement) {
    const issues: string[] = [];
    
    // Check if text content is right-aligned
    const textElements = container.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6');
    textElements.forEach((element, index) => {
      const hasHebrew = /[\u0590-\u05FF]/.test(element.textContent || '');
      if (hasHebrew) {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.textAlign !== 'right' && computedStyle.textAlign !== 'start') {
          issues.push(`Text element ${index + 1} with Hebrew content should be right-aligned`);
        }
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// ================================================================================================
// 🧪 HEBREW CONTENT GENERATORS
// ================================================================================================

export class HebrewTestGenerator {
  /**
   * Generate Hebrew course data for testing
   */
  generateCourseData(overrides: Partial<any> = {}) {
    return {
      ...hebrewData.courses.computerScience,
      ...overrides,
      id: `test-course-${Date.now()}`
    };
  }

  /**
   * Generate Hebrew assignment data
   */
  generateAssignmentData(overrides: Partial<any> = {}) {
    return {
      ...hebrewData.assignments.programmingHomework,
      ...overrides,
      id: `test-assignment-${Date.now()}`
    };
  }

  /**
   * Generate Hebrew user data
   */
  generateUserData(overrides: Partial<any> = {}) {
    return {
      ...hebrewData.users.student1,
      ...overrides,
      id: `test-user-${Date.now()}`
    };
  }

  /**
   * Generate mixed Hebrew-English text for edge case testing
   */
  generateMixedText() {
    const patterns = [
      'מבוא ל Computer Science',
      'תרגיל בית ב Python',
      'Machine Learning מתקדם',
      'בסיסי נתונים - SQL Course',
      'Web Development עם React'
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)];
  }
}

// ================================================================================================
// 📸 VISUAL RTL TESTING
// ================================================================================================

export class VisualRTLTester {
  /**
   * Setup for visual regression testing in RTL
   */
  async setupVisualTest(page: any) {
    // Set Hebrew locale
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'language', {
        get: () => 'he-IL'
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['he-IL', 'he', 'en-US', 'en']
      });
    });

    // Set RTL direction
    await page.addStyleTag({
      content: `
        html { direction: rtl; }
        body { direction: rtl; text-align: right; }
        * { box-sizing: border-box; }
      `
    });

    // Add Hebrew fonts
    await page.addStyleTag({
      content: `
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap');
        body { font-family: 'Heebo', 'Arial', sans-serif; }
      `
    });
  }

  /**
   * Take RTL-specific screenshots
   */
  async screenshotRTL(page: any, selector: string, name: string) {
    const element = await page.locator(selector);
    
    // Take screenshot with Hebrew content visible
    return await element.screenshot({
      path: `tests/screenshots/rtl-${name}.png`,
      fullPage: false
    });
  }
}

// ================================================================================================
// 🎯 EXPORTS
// ================================================================================================

export const rtlTesting = {
  render: renderRTL,
  matchers: rtlMatchers,
  interactions: new RTLInteractions(),
  validator: new RTLLayoutValidator(),
  generator: new HebrewTestGenerator(),
  visual: new VisualRTLTester()
};

export default rtlTesting;