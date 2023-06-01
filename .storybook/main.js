module.exports = {
    framework: '@storybook/angular',
    addons: [
        '@storybook/addon-controls',
        'storybook-addon-designs',
        'storybook-addon-rtl-direction',
        'storybook-dark-mode',
        './addon-ionic/preset.js',
    ],
    stories: ['../src/**/*.stories.ts'],
}
