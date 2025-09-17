module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  rules: {
    // Relax rules for development
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],

    // Hebrew/RTL support - prevent directional CSS properties
    'no-restricted-syntax': [
      'warn',
      {
        selector:
          'CallExpression[callee.property.name=/^(marginLeft|marginRight|paddingLeft|paddingRight)$/]',
        message:
          'Use logical properties (marginInlineStart/End, paddingInlineStart/End) instead of directional properties for RTL support.',
      },
    ],
  },
};
