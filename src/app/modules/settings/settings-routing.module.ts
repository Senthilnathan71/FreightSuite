import { Routes } from "@angular/router";
import { ModuleComponent } from "./module/module-list/module.component";
import { RoleComponent } from "./role/role-list/role.component";
import { RolemenuComponent } from "./rolemenu/rolemenu/rolemenu.component";
import { MenuListComponent } from "./menu/menu-list/menu-list.component";
import { EdocComponent } from "./edoc/edoc/edoc.component";
import { EmailEntryComponent } from "./email/email-entry/email-entry.component";

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
                    urls: [{ title: 'Master', url: '/master' }, { title: 'Role Menu' }],
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
        ]
    }
]