import React, { useCallback } from 'react';
import { useGlobals } from '@storybook/api';
import { addons, types } from '@storybook/addons';
import { IconButton } from '@storybook/components';

const ADDON_ID = 'storybook/ionic';
const TOOL_ID = `${ADDON_ID}/tool`
const Tool = function Tool() {
    const [{ ionicMode }, updateGlobals] = useGlobals();
    const onClick = useCallback(() => updateGlobals({ ionicMode: ionicMode === 'ios' ? 'md' : 'ios' }));
    const url = new URL(location.href);

    if (url.searchParams.has('ionicMode')) {
        updateGlobals({ ionicMode: url.searchParams.get('ionicMode') });
    }

    return React.createElement(
        IconButton,
        {
            key: TOOL_ID,
            title: `Activate ${ionicMode === 'ios' ? 'Android' : 'iOS'} mode`,
            onClick,
        },
        React.createElement(
            'svg',
            {
                xmlns: 'http://www.w3.org/2000/svg',
                viewBox: '0 0 512 512',
                fill: 'currentColor'
            },
            ionicMode === 'ios'
                ? [
                    React.createElement('path', {
                        key: 'ios-path-1',
                        d: 'M349.13 136.86c-40.32 0-57.36 19.24-85.44 19.24-28.79 0-50.75-19.1-85.69-19.1-34.2 0-70.67 20.88-93.83 56.45-32.52 50.16-27 144.63 25.67 225.11 18.84 28.81 44 61.12 77 61.47h.6c28.68 0 37.2-18.78 76.67-19h.6c38.88 0 46.68 18.89 75.24 18.89h.6c33-.35 59.51-36.15 78.35-64.85 13.56-20.64 18.6-31 29-54.35-76.19-28.92-88.43-136.93-13.08-178.34-23-28.8-55.32-45.48-85.79-45.48z'
                    }),
                    React.createElement('path', {
                        key: 'ios-path-2',
                        d: 'M340.25 32c-24 1.63-52 16.91-68.4 36.86-14.88 18.08-27.12 44.9-22.32 70.91h1.92c25.56 0 51.72-15.39 67-35.11 14.72-18.77 25.88-45.37 21.8-72.66z'
                    }),
                ]
                : React.createElement('path', {
                    d: 'M380.91 199l42.47-73.57a8.63 8.63 0 00-3.12-11.76 8.52 8.52 0 00-11.71 3.12l-43 74.52c-32.83-15-69.78-23.35-109.52-23.35s-76.69 8.36-109.52 23.35l-43-74.52a8.6 8.6 0 10-14.88 8.64L131 199C57.8 238.64 8.19 312.77 0 399.55h512c-8.19-86.78-57.8-160.91-131.09-200.55zM138.45 327.65a21.46 21.46 0 1121.46-21.46 21.47 21.47 0 01-21.46 21.46zm235 0A21.46 21.46 0 11395 306.19a21.47 21.47 0 01-21.51 21.46z',
                }),
        )
    );
};

addons.register(ADDON_ID, () => {
    addons.add(TOOL_ID, {
        type: types.TOOL,
        title: 'Ionic Mode',
        render: Tool,
    });
});
