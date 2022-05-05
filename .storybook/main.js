module.exports = {
    framework: '@storybook/angular',
    addons: [
        {
            name: '@storybook/addon-essentials',
            options: { actions: false },
        },
        '@storybook/addon-jest',
    ],
    stories: ['../src/**/*.stories.ts'],
}
