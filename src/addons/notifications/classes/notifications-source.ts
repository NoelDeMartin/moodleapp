// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
    AddonNotifications,
    AddonNotificationsGetReadType,
    AddonNotificationsNotificationMessageFormatted,
    AddonNotificationsProvider,
} from '@addons/notifications/services/notifications';
import { CoreRoutedItemsManagerSource } from '@classes/items-management/routed-items-manager-source';
import { CoreSites } from '@services/sites';

export class AddonNotificationsNotificationsSource
    extends CoreRoutedItemsManagerSource<AddonNotificationsNotificationMessageFormatted> {

    protected totals: Record<string, number> = {};

    /**
     * @inheritdoc
     */
    getItemPath(notification: AddonNotificationsNotificationMessageFormatted): string {
        return notification.id.toString();
    }

    /**
     * @inheritdoc
     */
    protected async loadPageItems(page: number): Promise<{
        items: AddonNotificationsNotificationMessageFormatted[];
        hasMoreItems: boolean;
    }> {
        const site = await CoreSites.getSite();
        const results = await Promise.all(
            site.isVersionGreaterEqualThan('4.0')
                ? [this.loadNotificationsPage(page, AddonNotificationsGetReadType.BOTH)]
                : [
                    this.loadNotificationsPage(page, AddonNotificationsGetReadType.UNREAD),
                    this.loadNotificationsPage(page, AddonNotificationsGetReadType.READ),
                ],
        );

        return {
            items: results.reduce(
                (items, { notifications }) => items.concat(notifications),
                [] as AddonNotificationsNotificationMessageFormatted[],
            ),
            hasMoreItems: results.some(({ hasMoreNotifications }) => hasMoreNotifications),
        };
    }

    /**
     * Load a page notifications of the given type.
     *
     * @param page Page.
     * @param type Notification type.
     * @returns Page notifications and whether there are any more.
     */
    protected async loadNotificationsPage(page: number, type: AddonNotificationsGetReadType): Promise<{
        notifications: AddonNotificationsNotificationMessageFormatted[];
        hasMoreNotifications: boolean;
    }> {
        const limit = this.getPageLength();
        const offset = page * limit;

        if (type in this.totals && this.totals[type] <= offset) {
            return {
                notifications: [],
                hasMoreNotifications: false,
            };
        }

        const notifications = await AddonNotifications.getNotificationsWithStatus(type, { offset, limit });

        if (notifications.length < limit) {
            this.totals[type] = offset + notifications.length;
        }

        return {
            notifications,
            hasMoreNotifications: type in this.totals && this.totals[type] > offset + limit,
        };
    }

    /**
     * @inheritdoc
     */
    protected setItems(notifications: AddonNotificationsNotificationMessageFormatted[], hasMoreItems: boolean): void {
        const sortedNotifications = notifications.slice(0);

        sortedNotifications.sort((a, b) => a.timecreated > b.timecreated ? 1 : -1);

        super.setItems(sortedNotifications, hasMoreItems);
    }

    /**
     * @inheritdoc
     */
    protected getPageLength(): number {
        return AddonNotificationsProvider.LIST_LIMIT;
    }

}
