import { addDecorator } from '@storybook/angular';
import { withTests } from '@storybook/addon-jest';

import results from '@/assets/jest-results.json';

addDecorator(withTests({ results }));
