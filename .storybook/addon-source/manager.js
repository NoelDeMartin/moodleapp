import React from 'react';

import { AddonPanel } from '@storybook/components';
import { addons, types } from '@storybook/addons';
import { useParameter } from '@storybook/api';

const ADDON_ID = 'storybook/source';
const PANEL_ID = `${ADDON_ID}/panel`

addons.register(ADDON_ID, () => {
    addons.add(PANEL_ID, {
        title: 'Source',
        type: types.PANEL,
        render: ({ active, key }) => {
            const source = useParameter('source');

            return (
                <AddonPanel key={key} active={active}>
                    <div style={{ padding: '16px' }}>
                        {
                            source
                                ? <a href={source} target="_blank">View source</a>
                                : 'Source not configured (add "source" parameter to story)'
                        }
                    </div>
                </AddonPanel>
            );
        }
    });
});
