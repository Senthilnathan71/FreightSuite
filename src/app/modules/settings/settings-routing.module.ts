import { Routes } from "@angular/router";
import { ModuleComponent } from "./module/module-list/module.component";
import { RoleComponent } from "./role/role-list/role.component";
import { RolemenuComponent } from "./rolemenu/rolemenu/rolemenu.component";
import { MenuListComponent } from "./menu/menu-list/menu-list.component";
import { EdocComponent } from "./edoc/edoc/edoc.component";
import { EmailEntryComponent } from "./email/email-entry/email-entry.component";
import { MenuEntryComponent } from "./menu/menu-entry/menu-entry.component";
import { FollowUpComponent } from "./follow-up/follow-up/follow-up.component";
import { RolemenuEntryComponent } from "./rolemenu/rolemenu-entry/rolemenu-entry.component";
import { NumberSeriesListComponent } from "./number-series/number-series-list/number-series-list.component";
import { NumberSeriesEntryComponent } from "./number-series/number-series-entry/number-series-entry.component";


export const SettingsRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'module/list',
                component: ModuleComponent,
                data: {
                    title: 'Module',
                    urls: [{ title: 'Master', url: '/master' }, { title: 'Module' }],
                },
            },
            {
                path: 'module/list',
                component: ModuleComponent,
                data: {
                    title: 'Module',
                    urls: [{ title: 'Master', url: '/master' }, { title: 'Module' }],
                },
            },
            {
                path: 'menu/list',
                component: MenuListComponent,
                data: {
                    title: 'Menu List',
                    urls: [{ title: 'Master', url: '/master' }, { title: 'Menu' }],
                },
            },
            {
                path: 'menu/entry',
                component: MenuEntryComponent,
                data: {
                    title: 'Menu Entry',
                    urls: [{ title: 'Master', url: '/master' }, { title: 'Menu' }],
                },
            },
            {
                path: 'menu/entry/:id',
                component: MenuEntryComponent,
                data: {
                    title: 'Menu Entry',
                    urls: [{ title: 'Master', url: '/master' }, { title: 'Menu' }],
                },
            },

            {
                path: 'role/list',
                component: RoleComponent,
                data: {
                    title: 'Role',
                    urls: [{ title: 'Master', url: '/master' }, { title: 'Role' }],
                },
            },

            {
                path: 'rolemenu',
                component: RolemenuComponent,
                data: {
                    title: 'Role Menu',
                    urls: [{ title: 'Settings', url: '/settings' }, { title: 'Role Menu' }],
                },
            },
             {
                path: 'rolemenu/entry',
                component: RolemenuEntryComponent,
                data: {
                    title: 'Role Menu',
                    urls: [{ title: 'Settings', url: '/settings' }, { title: 'Role Menu' }],
                },
            },
            {
                path: 'rolemenu/entry/:id',
                component: RolemenuEntryComponent,
                data: {
                    title: 'Role Menu',
                    urls: [{ title: 'Settings', url: '/settings' }, { title: 'Role Menu' }],
                },
            },
             {
                path: 'edoc',
                component: EdocComponent,
                data: {
                    title: 'Edoc',
                    urls: [{ title: 'Master', url: '/master' }, { title: 'Edoc' }],
                },
            },
             {
                path: 'email',
                component: EmailEntryComponent,
                data: {
                    title: 'Email',
                    urls: [{ title: 'Master', url: '/master' }, { title: 'Email' }],
                },
            },
            {
                path: 'follow-up',
                component: FollowUpComponent,
                data: {
                    title: 'Follow-Up',
                    urls: [{ title: 'Master', url: '/master' }, { title: 'Follow-up' }],
                },
            },
            {
                path: 'number-series/list',
                component: NumberSeriesListComponent,
                data: {
                    title: 'Number Series',
                    urls: [{ title: 'Settings', url: '/settings' }, { title: 'Number Series' }],
                },
            },
            {
                path: 'number-series/entry/:menuId',
                component: NumberSeriesEntryComponent,
                data: {
                    title: 'Number Series Entry',
                    urls: [{ title: 'Settings', url: '/settings' }, { title: 'Number Series' }],
                },
            },
        ]
    }
]