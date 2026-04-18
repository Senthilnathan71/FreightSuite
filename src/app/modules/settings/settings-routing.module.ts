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
import { ReportScheduleListComponent } from "./report-schedule/report-schedule-list/report-schedule-list.component";
import { ReportScheduleEntryComponent } from "./report-schedule/report-schedule-entry/report-schedule-entry.component";
import { ExceptionCheckScriptListComponent } from "./exception-check-script/exception-check-script-list/exception-check-script-list.component";
import { ExceptionCheckScriptEntryComponent } from "./exception-check-script/exception-check-script-entry/exception-check-script-entry.component";
import { MenuUserConfigComponent } from "../crm-mobile/activity-allocation/menu-user-config/menu-user-config.component";
import { ActivityAllocationComponent } from "../crm-mobile/activity-allocation/activity-allocation.component";
import { ActivityAllocationEntryComponent } from "../crm-mobile/activity-allocation/activity-allocation-entry/activity-allocation-entry.component";


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
            {
                path: 'report-schedule/list',
                component: ReportScheduleListComponent,
                data: {
                    title: 'Report Schedule',
                    urls: [{ title: 'Settings', url: '/settings' }, { title: 'Report Schedule' }],
                },
            },
            {
                path: 'report-schedule/entry',
                component: ReportScheduleEntryComponent,
                data: {
                    title: 'Add Report Schedule',
                    urls: [{ title: 'Settings', url: '/settings' }, { title: 'Report Schedule', url: '/settings/report-schedule/list' }, { title: 'Add' }],
                },
            },
            {
                path: 'report-schedule/entry/:id',
                component: ReportScheduleEntryComponent,
                data: {
                    title: 'Edit Report Schedule',
                    urls: [{ title: 'Settings', url: '/settings' }, { title: 'Report Schedule', url: '/settings/report-schedule/list' }, { title: 'Edit' }],
                },
            },
            {
                path: 'exception-check-script/list',
                component: ExceptionCheckScriptListComponent,
                data: {
                    title: 'Exception Check',
                    urls: [{ title: 'Settings', url: '/settings' }, { title: 'Exception Check' }],
                },
            },
            {
                path: 'exception-check-script/entry',
                component: ExceptionCheckScriptEntryComponent,
                data: {
                    title: 'Add Exception Check',
                    urls: [
                        { title: 'Settings' },
                        { title: 'Exception Check', url: '/settings/exception-check-script/list' },
                        { title: 'Add' },
                    ],
                },
            },
            {
                path: 'exception-check-script/entry/:id',
                component: ExceptionCheckScriptEntryComponent,
                data: {
                    title: 'Edit Exception Check',
                    urls: [
                        { title: 'Settings' },
                        { title: 'Exception Check', url: '/settings/exception-check-script/list' },
                        { title: 'Edit' },
                    ],
                },
            },
            {
                path: 'activity-allocation',
                component: ActivityAllocationComponent,
                data: {
                    title: 'Activity Allocation',
                    urls: [{ title: 'Settings', url: '/settings' }, { title: 'Activity Allocation' }],
                },
            },
            {
                path: 'activity-allocation/entry',
                component: ActivityAllocationEntryComponent,
                data: {
                    title: 'Work Load Detail',
                    urls: [{ title: 'Settings', url: '/settings' }, { title: 'Activity Allocation', url: '/settings/activity-allocation' }, { title: 'Work Load Detail' }],
                },
            },
            {
                path: 'activity-allocation/config',
                component: MenuUserConfigComponent,
                data: {
                    title: 'Menu wise User Configuration',
                    urls: [{ title: 'Settings', url: '/settings' }, { title: 'Activity Allocation Config' }],
                },
            },
        ]
    }
]