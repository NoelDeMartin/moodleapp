module.exports = {
    framework: '@storybook/angular',
    addons: [
        '@storybook/addon-controls',
        'storybook-dark-mode',
        'storybook-addon-rtl-direction',
    ],
    stories: ['../src/**/*.stories.ts'],
}
