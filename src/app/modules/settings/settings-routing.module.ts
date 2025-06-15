import { Routes } from "@angular/router";
import { ModuleComponent } from "./module/module-list/module.component";
import { RoleComponent } from "./role/role-list/role.component";
import { RolemenuComponent } from "./rolemenu/rolemenu/rolemenu.component";
import { MenuListComponent } from "./menu/menu-list/menu-list.component";

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
        ]
    }
]