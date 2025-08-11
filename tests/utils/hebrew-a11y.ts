/**
 * ♿ HEBREW ACCESSIBILITY TESTING UTILITIES
 * 
 * Comprehensive accessibility testing for Hebrew/RTL academic platform
 */

import { vi } from 'vitest';

// ================================================================================================
// ♿ HEBREW ACCESSIBILITY CHECKER
// ================================================================================================

export class HebrewA11yChecker {
  
  /**
   * Check ARIA labels in Hebrew
   */
  checkHebrewAriaLabels(element: HTMLElement) {
    const issues: string[] = [];
    const elements = element.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
    
    elements.forEach((el, index) => {
      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledBy = el.getAttribute('aria-labelledby');
      const ariaDescribedBy = el.getAttribute('aria-describedby');
      
      // Check if Hebrew content has appropriate ARIA labels
      const hasHebrewContent = /[\u0590-\u05FF]/.test(el.textContent || '');
      
      if (hasHebrewContent) {
        if (!ariaLabel && !ariaLabelledBy) {
          issues.push(`Element ${index + 1} with Hebrew content missing ARIA label`);
        }
        
        // Check if ARIA labels are in Hebrew too
        if (ariaLabel && !/[\u0590-\u05FF]/.test(ariaLabel)) {
          issues.push(`Element ${index + 1} has Hebrew content but English ARIA label`);
        }
      }
    });

    return {
      isAccessible: issues.length === 0,
      issues
    };
  }

  /**
   * Check RTL reading order and navigation
   */
  checkRTLNavigationOrder(container: HTMLElement) {
    const issues: string[] = [];
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Check if tab order makes sense in RTL
    const elementPositions = Array.from(focusableElements).map((el, index) => {
      const rect = el.getBoundingClientRect();
      return {
        element: el,
        index,
        x: rect.left,
        y: rect.top,
        tabIndex: el.getAttribute('tabindex')
      };
    });

    // In RTL, elements should generally go from right to left, top to bottom
    for (let i = 0; i < elementPositions.length - 1; i++) {
      const current = elementPositions[i];
      const next = elementPositions[i + 1];
      
      // If on same row, next element should be to the left in RTL
      if (Math.abs(current.y - next.y) < 10) { // Same row
        if (next.x > current.x) {
          issues.push(`Tab order appears to be LTR instead of RTL between elements ${i} and ${i + 1}`);
        }
      }
    }

    return {
      isAccessible: issues.length === 0,
      issues
    };
  }

  /**
   * Check Hebrew screen reader compatibility
   */
  checkHebrewScreenReader(element: HTMLElement) {
    const issues: string[] = [];
    
    // Check for proper language attributes
    const hebrewElements = Array.from(element.querySelectorAll('*')).filter(el => 
      /[\u0590-\u05FF]/.test(el.textContent || '')
    );

    hebrewElements.forEach((el, index) => {
      const lang = el.getAttribute('lang') || 
                  el.closest('[lang]')?.getAttribute('lang') ||
                  document.documentElement.lang;
      
      if (!lang || (!lang.startsWith('he') && !lang.startsWith('iw'))) {
        issues.push(`Hebrew element ${index + 1} missing Hebrew language attribute`);
      }

      // Check for proper direction attribute
      const dir = el.getAttribute('dir') || 
                 el.closest('[dir]')?.getAttribute('dir') ||
                 getComputedStyle(el).direction;
      
      if (dir !== 'rtl') {
        issues.push(`Hebrew element ${index + 1} missing RTL direction`);
      }
    });

    return {
      isAccessible: issues.length === 0,
      issues
    };
  }

  /**
   * Check form accessibility in Hebrew
   */
  checkHebrewFormA11y(form: HTMLElement) {
    const issues: string[] = [];
    
    // Check Hebrew form labels
    const labels = form.querySelectorAll('label');
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach((input, index) => {
      const hasHebrewPlaceholder = /[\u0590-\u05FF]/.test(input.getAttribute('placeholder') || '');
      const associatedLabel = form.querySelector(`label[for="${input.id}"]`) as HTMLElement;
      
      if (hasHebrewPlaceholder || (associatedLabel && /[\u0590-\u05FF]/.test(associatedLabel.textContent || ''))) {
        // Check if input has proper RTL direction
        const computedStyle = getComputedStyle(input);
        if (computedStyle.direction !== 'rtl') {
          issues.push(`Hebrew form input ${index + 1} should have RTL direction`);
        }
        
        // Check text alignment
        if (computedStyle.textAlign !== 'right' && computedStyle.textAlign !== 'start') {
          issues.push(`Hebrew form input ${index + 1} should be right-aligned`);
        }
      }
    });

    // Check error messages accessibility
    const errorElements = form.querySelectorAll('[role="alert"], .error, [aria-invalid="true"]');
    errorElements.forEach((error, index) => {
      if (/[\u0590-\u05FF]/.test(error.textContent || '')) {
        if (!error.getAttribute('aria-live')) {
          issues.push(`Hebrew error message ${index + 1} missing aria-live attribute`);
        }
      }
    });

    return {
      isAccessible: issues.length === 0,
      issues
    };
  }

  /**
   * Check table accessibility with Hebrew content
   */
  checkHebrewTableA11y(table: HTMLElement) {
    const issues: string[] = [];
    
    // Check table headers
    const headers = table.querySelectorAll('th');
    headers.forEach((header, index) => {
      if (/[\u0590-\u05FF]/.test(header.textContent || '')) {
        if (!header.getAttribute('scope')) {
          issues.push(`Hebrew table header ${index + 1} missing scope attribute`);
        }
        
        // Check header alignment
        const computedStyle = getComputedStyle(header);
        if (computedStyle.textAlign !== 'right' && computedStyle.textAlign !== 'start') {
          issues.push(`Hebrew table header ${index + 1} should be right-aligned`);
        }
      }
    });

    // Check caption
    const caption = table.querySelector('caption');
    if (caption && /[\u0590-\u05FF]/.test(caption.textContent || '')) {
      const computedStyle = getComputedStyle(caption);
      if (computedStyle.textAlign !== 'right' && computedStyle.textAlign !== 'start') {
        issues.push('Hebrew table caption should be right-aligned');
      }
    }

    return {
      isAccessible: issues.length === 0,
      issues
    };
  }
}

// ================================================================================================
// 🎭 SCREEN READER SIMULATION
// ================================================================================================

export class HebrewScreenReaderSimulator {
  private announcements: string[] = [];

  /**
   * Simulate screen reader announcing Hebrew content
   */
  simulateAnnouncement(element: HTMLElement) {
    const text = this.extractAccessibleText(element);
    this.announcements.push(text);
    return text;
  }

  /**
   * Extract text as screen reader would
   */
  private extractAccessibleText(element: HTMLElement): string {
    // Check for ARIA label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check for aria-labelledby
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) return labelElement.textContent || '';
    }

    // Check for title
    const title = element.getAttribute('title');
    if (title) return title;

    // Get visible text
    let text = '';
    if (element.textContent) {
      text = element.textContent.trim();
    }

    // Add context for Hebrew academic content
    if (/[\u0590-\u05FF]/.test(text)) {
      // Add role information in Hebrew
      const role = element.getAttribute('role') || element.tagName.toLowerCase();
      const hebrewRoles: Record<string, string> = {
        'button': 'כפתור',
        'link': 'קישור', 
        'heading': 'כותרת',
        'textbox': 'תיבת טקסט',
        'list': 'רשימה',
        'listitem': 'פריט רשימה'
      };
      
      if (hebrewRoles[role]) {
        text = `${hebrewRoles[role]}, ${text}`;
      }
    }

    return text;
  }

  /**
   * Get all announcements
   */
  getAnnouncements() {
    return [...this.announcements];
  }

  /**
   * Clear announcements
   */
  clearAnnouncements() {
    this.announcements = [];
  }
}

// ================================================================================================
// ⌨️ KEYBOARD NAVIGATION TESTING
// ================================================================================================

export class HebrewKeyboardTester {
  
  /**
   * Test RTL keyboard navigation
   */
  async testRTLKeyboardNav(container: HTMLElement) {
    const focusableElements = Array.from(container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[];

    const results: any[] = [];

    // Test Tab navigation
    for (let i = 0; i < focusableElements.length - 1; i++) {
      const current = focusableElements[i];
      const next = focusableElements[i + 1];
      
      current.focus();
      
      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      current.dispatchEvent(tabEvent);
      
      // Check if next element gets focus
      setTimeout(() => {
        const focused = document.activeElement;
        results.push({
          from: current,
          to: next,
          actualFocus: focused,
          correctOrder: focused === next
        });
      }, 0);
    }

    return results;
  }

  /**
   * Test arrow key navigation in RTL context
   */
  testRTLArrowKeys(element: HTMLElement) {
    const results = {
      leftArrow: false,
      rightArrow: false,
      upArrow: false,
      downArrow: false
    };

    // In RTL, left arrow should go to "next" item, right arrow to "previous"
    const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });

    element.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          results.leftArrow = true;
          break;
        case 'ArrowRight':
          results.rightArrow = true;
          break;
        case 'ArrowUp':
          results.upArrow = true;
          break;
        case 'ArrowDown':
          results.downArrow = true;
          break;
      }
    });

    element.dispatchEvent(leftEvent);
    element.dispatchEvent(rightEvent);
    element.dispatchEvent(upEvent);
    element.dispatchEvent(downEvent);

    return results;
  }
}

// ================================================================================================
// 🎨 COLOR CONTRAST TESTING
// ================================================================================================

export class HebrewColorContrastTester {
  
  /**
   * Test color contrast for Hebrew text
   */
  checkHebrewTextContrast(element: HTMLElement) {
    const issues: string[] = [];
    const textElements = element.querySelectorAll('*');
    
    textElements.forEach((el, index) => {
      const hasHebrew = /[\u0590-\u05FF]/.test(el.textContent || '');
      
      if (hasHebrew && el.textContent?.trim()) {
        const computedStyle = getComputedStyle(el);
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        
        // Basic contrast check (simplified)
        if (this.isLowContrast(color, backgroundColor)) {
          issues.push(`Hebrew text element ${index + 1} has low color contrast`);
        }
      }
    });

    return {
      hasGoodContrast: issues.length === 0,
      issues
    };
  }

  private isLowContrast(color: string, backgroundColor: string): boolean {
    // Simplified contrast check - in real implementation would use WCAG formula
    return color === backgroundColor || 
           (color === 'rgb(0, 0, 0)' && backgroundColor === 'rgb(0, 0, 0)');
  }
}

// ================================================================================================
// 🧪 COMPREHENSIVE A11Y TEST SUITE
// ================================================================================================

export class HebrewA11yTestSuite {
  private checker = new HebrewA11yChecker();
  private screenReader = new HebrewScreenReaderSimulator();
  private keyboard = new HebrewKeyboardTester();
  private contrast = new HebrewColorContrastTester();

  /**
   * Run comprehensive Hebrew accessibility tests
   */
  async runFullA11yTest(element: HTMLElement) {
    const results = {
      ariaLabels: this.checker.checkHebrewAriaLabels(element),
      navigationOrder: this.checker.checkRTLNavigationOrder(element),
      screenReader: this.checker.checkHebrewScreenReader(element),
      colorContrast: this.contrast.checkHebrewTextContrast(element),
      keyboardNav: await this.keyboard.testRTLKeyboardNav(element),
      overall: { isAccessible: true, totalIssues: 0 }
    };

    // Calculate overall accessibility score
    const allIssues = [
      ...results.ariaLabels.issues,
      ...results.navigationOrder.issues,
      ...results.screenReader.issues,
      ...results.colorContrast.issues
    ];

    results.overall.totalIssues = allIssues.length;
    results.overall.isAccessible = allIssues.length === 0;

    return results;
  }

  /**
   * Generate accessibility report
   */
  generateA11yReport(testResults: any) {
    const report = {
      summary: {
        total: testResults.overall.totalIssues,
        accessible: testResults.overall.isAccessible,
        score: Math.max(0, 100 - (testResults.overall.totalIssues * 10))
      },
      categories: {
        ariaLabels: testResults.ariaLabels.issues.length,
        navigationOrder: testResults.navigationOrder.issues.length,
        screenReader: testResults.screenReader.issues.length,
        colorContrast: testResults.colorContrast.issues.length
      },
      recommendations: this.getRecommendations(testResults)
    };

    return report;
  }

  private getRecommendations(testResults: any): string[] {
    const recommendations: string[] = [];
    
    if (testResults.ariaLabels.issues.length > 0) {
      recommendations.push('הוסף תוויות ARIA בעברית לכל האלמנטים האינטראקטיביים');
    }
    
    if (testResults.navigationOrder.issues.length > 0) {
      recommendations.push('בדוק את סדר הניווט בעזרת המקלדת כדי שיתאים לכיוון RTL');
    }
    
    if (testResults.screenReader.issues.length > 0) {
      recommendations.push('הוסף מאפיין lang="he" לכל התוכן בעברית');
    }
    
    if (testResults.colorContrast.issues.length > 0) {
      recommendations.push('שפר את הניגודיות בין הטקסט העברי לרקע');
    }

    return recommendations;
  }
}

// ================================================================================================
// 🎯 EXPORTS
// ================================================================================================

export const hebrewA11y = {
  checker: new HebrewA11yChecker(),
  screenReader: new HebrewScreenReaderSimulator(),
  keyboard: new HebrewKeyboardTester(),
  contrast: new HebrewColorContrastTester(),
  testSuite: new HebrewA11yTestSuite(),
  
  // Utility functions
  runQuickCheck: (element: HTMLElement) => new HebrewA11yChecker().checkHebrewAriaLabels(element),
  runFullTest: (element: HTMLElement) => new HebrewA11yTestSuite().runFullA11yTest(element)
};

export default hebrewA11y;