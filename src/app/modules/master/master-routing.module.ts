import { Routes } from '@angular/router';
import { DepartmentListComponent } from './department/department-list/department-list.component';
import { DepartmentEntryComponent } from './department/department-entry/department-entry.component';
import { PostMasterViewComponent } from './port-master/post-master-view/post-master-view.component';
import { PostMasterListComponent } from './port-master/post-master-list/post-master-list.component';
import { UOMListComponent } from './UOM-Master/uom-list/uom-list.component';
import { UOMViewComponent } from './UOM-Master/uom-view/uom-view.component';
import { CountryListComponent } from './country/country-list/country-list.component';
import { CountryEntryComponent } from './country/country-entry/country-entry.component';
import { StateListComponent } from './state/state-list/state-list.component';
import { StateEntryComponent } from './state/state-entry/state-entry.component';
import { UnitListComponent } from './unit/unit-list/unit-list.component';
import { UnitEntryComponent } from './unit/unit-entry/unit-entry.component';
import { VesselListComponent } from './vessel/vessel-list/vessel-list.component';
import { VesselEntryComponent } from './vessel/vessel-entry/vessel-entry.component';
import { CurrencyEntryComponent } from './currency/currency-entry/currency-entry.component';
import { CurrencyListComponent } from './currency/currency-list/currency-list.component';
import { CityEntryComponent } from './city/city-entry/city-entry.component';
import { CityListComponent } from './city/city-list/city-list.component';
import { TarrifEntryComponent } from './tarrif/tarrif-entry/tarrif-entry.component';
import { TarrifListComponent } from './tarrif/tarrif-list/tarrif-list.component';
import { ZoneEntryComponent } from './zone/zone-entry/zone-entry.component';
import { ZoneListComponent } from './zone/zone-list/zone-list.component';
import { SectorEntryComponent } from './sector/sector-entry/sector-entry.component';
import { SectorListComponent } from './sector/sector-list/sector-list.component';
import { MenuListComponent } from './menu/menu-list/menu-list.component';
import { ReportListComponent } from './report/report-list/report-list.component';
import { ReportEntryComponent } from './report/report-entry/report-entry.component';
import { CompanyListComponent } from './company/company-list/company-list.component';
import { CompanyEntryComponent } from './company/company-entry/company-entry.component';
import { BranchListComponent } from './branch/branch-list/branch-list.component';
import { BranchEntryComponent } from './branch/branch-entry/branch-entry.component';
import { AirlineListComponent } from './airline/airline-list/airline-list.component';
import { AirlineEntryComponent } from './airline/airline-entry/airline-entry.component';
import { MilestoneListComponent } from './milestone/milestone-list/milestone-list.component';
import { MilestoneEntryComponent } from './milestone/milestone-entry/milestone-entry.component';
import { OrganizationListComponent } from './organization/organization-list/organization-list.component';
import { OrganizationEntryComponent } from './organization/organization-entry/organization-entry.component';
import { DivisionListComponent } from './division/division-list/division-list.component';
import { DivisionEntryComponent } from './division/division-entry/division-entry.component';
import { ContainerTypeListComponent } from './container-type/container-type-list/container-type-list.component';
import { ContainerTypeEntryComponent } from './container-type/container-type-entry/container-type-entry.component';
import { CommodityListComponent } from './commodity/commodity-list/commodity-list.component';
import { CommodityEntryComponent } from './commodity/commodity-entry/commodity-entry.component';
import { PackageTypeListComponent } from './package-type/package-type-list/package-type-list.component';
import { PackageTypeEntryComponent } from './package-type/package-type-entry/package-type-entry.component';
import { MenuEntryComponent } from './menu/menu-entry/menu-entry.component';
import { ServiceLevelListComponent } from './service-level/service-level-list/service-level-list.component';
import { ServiceLevelComponent } from './service-level/service-level.component';
import { TimeZoneComponent } from './time-zone/time-zone.component';
import { TimeZoneListComponent } from './time-zone/time-zone-list/time-zone-list.component';
import { IncoComponent } from './inco/inco.component';
import { IncoListComponent } from './inco/inco-list/inco-list.component';
import { ChargeListComponent } from './charge/charge-list/charge-list.component';
import { ChargeEntryComponent } from './charge/charge-entry/charge-entry.component';
import { TermsConditionListComponent } from './terms-condition/terms-condition-list/terms-condition-list.component';
import { TermsConditionEntryComponent } from './terms-condition/terms-condition-entry/terms-condition-entry.component';
import { HSSACComponent } from './HS-SAC/hs-sac/hs-sac.component';
import { ModuleComponent } from './module/module-list/module.component';
import { RoleComponent } from './role/role-list/role.component';
import { ChargegroupComponent } from './chargeGroup/chargegroup/chargegroup.component';
import { RolemenuComponent } from './rolemenu/rolemenu/rolemenu.component';
import { TdsSetListComponent } from './TDS-Set/tds-set-list/tds-set-list.component';
import { TdsSetEntryComponent } from './TDS-Set/tds-set-entry/tds-set-entry.component';
import { ModuleEntryComponent } from './module/module-entry/module-entry.component';
import { RoleEntryComponent } from './role/role-entry/role-entry.component';
import { ImcoListComponent } from './Imco/imco-list/imco-list.component';
import { ImcoEntryComponent } from './Imco/imco-entry/imco-entry.component';
import { BIclauseComponent } from './BIClause/biclause/biclause.component';
import { ProductListComponent } from './product/product-list/product-list.component';
import { ProductEntryComponent } from './product/product-entry/product-entry.component';
import { SailingScheduleLsitComponent } from './SailingSchedule/sailing-schedule-lsit/sailing-schedule-lsit.component';
import { SailingScheduleEntryComponent } from './SailingSchedule/sailing-schedule-entry/sailing-schedule-entry.component';

export const MasterRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: OrganizationListComponent,
        data: {
          title: 'Organization',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Organization' },
          ],
        },
      },
      {
        path: 'city/list',
        component: CityListComponent,
        data: {
          title: 'City',
          urls: [{ title: 'Master', url: '/master' }, { title: 'City' }],
        },
      },
      {
        path: 'city/entry',
        component: CityEntryComponent,
        data: {
          title: 'Add City',
          urls: [{ title: 'Master', url: '/master' }, { title: 'City' }],
        },
      },
      {
        path: 'city/entry/:id',
        component: CityEntryComponent,
        data: {
          title: 'Edit City',
          urls: [{ title: 'Master', url: '/master' }, { title: 'City' }],
        },
      },
      {
        path: 'department/list',
        component: DepartmentListComponent,
        data: {
          title: 'Department',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Department' }],
        },
      },
      {
        path: 'department/entry',
        component: DepartmentEntryComponent,
        data: {
          title: 'Add Department',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Department' }],
        },
      },
      {
        path: 'department/entry/:id',
        component: DepartmentEntryComponent,
        data: {
          title: 'Edit Department',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Department' }],
        },
      },
      {
        path: 'currency/list',
        component: CurrencyListComponent,
        data: {
          title: 'Currency- List',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Currency' }],
        },
      },
      {
        path: 'currency/entry',
        component: CurrencyEntryComponent,
        data: {
          title: 'Currency - Add',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Add Currency' },
          ],
        },
      },
      {
        path: 'currency/entry/:id',
        component: CurrencyEntryComponent,
        data: {
          title: 'Currency - Edit',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Edit Currency' },
          ],
        },
      },
      {
        path: 'port-master/view',
        component: PostMasterViewComponent,
        data: {
          title: 'Port Master',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Port Master' }],
        },
      },
      {
        path: 'port-master/view/:id',
        component: PostMasterViewComponent,
        data: {
          title: 'Port Master',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Port Master' }],
        },
      },
      {
        path: 'port-master/list',
        component: PostMasterListComponent,
        data: {
          title: 'Port Master',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Port Master List' },
          ],
        },
      },
      {
        path: 'uom-master/list',
        component: UOMListComponent,
        data: {
          title: 'UOM Master',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'UOM Master List' },
          ],
        },
      },
      {
        path: 'uom-master/view',
        component: UOMViewComponent,
        data: {
          title: 'UOM Master Entry',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'UOM Master View' },
          ],
        },
      },
      {
        path: 'uom-master/view/:id',
        component: UOMViewComponent,
        data: {
          title: 'UOM Master Edit',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'UOM Master View' },
          ],
        },
      },
      {
        path: 'country/list',
        component: CountryListComponent,
        data: {
          title: 'Country',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Country List' },
          ],
        },
      },
      {
        path: 'country/entry',
        component: CountryEntryComponent,
        data: {
          title: 'Country',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Country Add' }],
        },
      },
      {
        path: 'country/entry/:id',
        component: CountryEntryComponent,
        data: {
          title: 'Country',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Country update' },
          ],
        },
      },
      {
        path: 'state',
        children: [
          {
            path: 'list',
            component: StateListComponent,
            data: {
              title: 'State',
              urls: [
                { title: 'Master', url: '/master' },
                { title: 'State List' },
              ],
            },
          },
          {
            path: 'entry',
            component: StateEntryComponent,
            data: {
              title: 'State',
              urls: [
                { title: 'Master', url: '/master' },
                { title: 'State Add' },
              ],
            },
          },
          {
            path: 'entry/:id',
            component: StateEntryComponent,
            data: {
              title: 'State',
              urls: [
                { title: 'Master', url: '/master' },
                { title: 'State Edit' },
              ],
            },
          },
        ],
      },
      {
        path: 'unit/list',
        component: UnitListComponent,
        data: {
          title: 'Unit',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Unit List' }],
        },
      },
      {
        path: 'unit/entry',
        component: UnitEntryComponent,
        data: {
          title: 'Unit',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Unit Add' }],
        },
      },
      {
        path: 'unit/entry/:id',
        component: UnitEntryComponent,
        data: {
          title: 'Unit',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Unit Edit' }],
        },
      },
      {
        path: 'vessel/list',
        component: VesselListComponent,
        data: {
          title: 'Vessel',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Vessel List' }],
        },
      },
      {
        path: 'vessel/entry',
        component: VesselEntryComponent,
        data: {
          title: 'Add Vessel',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Vessel Add' }],
        },
      },
      {
        path: 'vessel/entry/:id',
        component: VesselEntryComponent,
        data: {
          title: 'Edit Vessel',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Vessel Add' }],
        },
      },
      {
        path: 'zone/list',
        component: ZoneListComponent,
        data: {
          title: 'Zone',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Zone List' }],
        },
      },
      {
        path: 'zone/entry',
        component: ZoneEntryComponent,
        data: {
          title: 'Zone',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Zone Add' }],
        },
      },
      {
        path: 'zone/entry/:id',
        component: ZoneEntryComponent,
        data: {
          title: 'Zone',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Zone Add' }],
        },
      },
      {
        path: 'tarrif/list',
        component: TarrifListComponent,
        data: {
          title: 'Tarrif',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Tarrif' }],
        },
      },
      {
        path: 'tarrif/entry',
        component: TarrifEntryComponent,
        data: {
          title: 'Add Tarrif',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Tarrif' }],
        },
      },
      {
        path: 'tarrif/entry/:id',
        component: TarrifEntryComponent,
        data: {
          title: 'Edit Tarrif',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Edit Tarrif' }],
        },
      },
      {
        path: 'sector/list',
        component: SectorListComponent,
        data: {
          title: 'Sector List',
          urls: [{ title: 'Master', url: '/master' }, { title: 'sector' }],
        },
      },
      {
        path: 'sector/entry',
        component: SectorEntryComponent,
        data: {
          title: 'Sector Entry',
          urls: [{ title: 'Master', url: '/master' }, { title: 'sector' }],
        },
      },
      {
        path: 'sector/entry/:id',
        component: SectorEntryComponent,
        data: {
          title: 'Sector edit',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Sector Edit' }],
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
        path: 'report/list',
        component: ReportListComponent,
        data: {
          title: 'Report',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Report' }],
        },
      },
      {
        path: 'report/entry',
        component: ReportEntryComponent,
        data: {
          title: 'Report',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Report' }],
        },
      },
      {
        path: 'company/list',
        component: CompanyListComponent,
        data: {
          title: 'Company',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Company' }],
        },
      },
      {
        path: 'company/entry',
        component: CompanyEntryComponent,
        data: {
          title: 'Company',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Company' }],
        },
      },
      {
        path: 'company/entry/:id',
        component: CompanyEntryComponent,
        data: {
          title: 'Edit Company',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Company' }],
        },
      },
      {
        path: 'branch/list',
        component: BranchListComponent,
        data: {
          title: 'Branch',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Branch' }],
        },
      },
      {
        path: 'branch/entry',
        component: BranchEntryComponent,
        data: {
          title: 'Create Branch',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Branch' }],
        },
      },
      {
        path: 'branch/entry/:id',
        component: BranchEntryComponent,
        data: {
          title: 'Edit Branch',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Branch' }],
        },
      },
      {
        path: 'airline/list',
        component: AirlineListComponent,
        data: {
          title: 'Airline',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Airline' }],
        },
      },
      {
        path: 'airline/entry',
        component: AirlineEntryComponent,
        data: {
          title: 'Airline',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Airline' }],
        },
      },
      {
        path: 'division/list',
        component: DivisionListComponent,
        data: {
          title: 'Division',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Division' }],
        },
      },
      {
        path: 'division/entry',
        component: DivisionEntryComponent,
        data: {
          title: 'Division',
          urls: [{ title: 'Master', url: '/master' }, { title: 'division' }],
        },
      },
      {
        path: "division/entry/:id",
        component: DivisionEntryComponent,
        data: {
          title: "Edit Division",
          urls: [
            { title: "Master", url: "/master" },
            { title: "division" },
          ],
        },
      },
      {
        path: 'container-type/list',
        component: ContainerTypeListComponent,
        data: {
          title: 'Container Type',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Container Type' }],
        },
      },
      {
        path: 'container-type/entry',
        component: ContainerTypeEntryComponent,
        data: {
          title: 'Container Type',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Container Type' }],
        },
      },
      {
        path: "container-type/entry/:id",
        component: ContainerTypeEntryComponent,
        data: {
          title: "Edit Conatiner Type",
          urls: [
            { title: "Master", url: "/master" },{ title: "Conatiner Type" },
          ],
        },
      },
      {
        path: 'milestone/list',
        component: MilestoneListComponent,
        data: {
          title: 'Milestone',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Milestone' }],
        },
      },
      {
        path: 'milestone/entry',
        component: MilestoneEntryComponent,
        data: {
          title: 'Container Type',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Milestone' }],
        },
      },
      {
        path: 'organization/list',
        component: OrganizationListComponent,
        data: {
          title: 'Organization',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Organization' }],
        },
      },
      {
        path: 'organization/entry',
        component: OrganizationEntryComponent,
        data: {
          title: 'Organization',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Organization' }],
        },
      },
      {
        path: 'organization/entry/:id',
        component: OrganizationEntryComponent,
        data: {
          title: 'Organization',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Organization' }],
        },
      },
      {
        path: 'commodity/list',
        component: CommodityListComponent,
        data: {
          title: 'Commodity',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Commodity' }],
        },
      },
      {
        path: 'commodity/entry',
        component: CommodityEntryComponent,
        data: {
          title: 'Commodity',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Commodity' }],
        },
      },
      {
        path: 'commodity/entry/:id',
        component: CommodityEntryComponent,
        data: {
          title: 'Edit City',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Commodity' }],
        },
      },
      {
        path: 'package-type/list',
        component: PackageTypeListComponent,
        data: {
          title: 'Package Type',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Package Type' }],
        },
      },
      {
        path: 'package-type/entry',
        component: PackageTypeEntryComponent,
        data: {
          title: 'Package Type',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Package Type' }],
        },
      },
      {
        path: 'package-type/entry/:id',
        component: PackageTypeEntryComponent,
        data: {
          title: 'Package Type',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Package Type' }],
        },
      },

      {
        path: 'service-level/list',
        component: ServiceLevelListComponent,
        data: {
          title: 'Service Level',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Service Level' }],
        },
      },
      {
        path: 'service-level/entry',
        component: ServiceLevelComponent,
        data: {
          title: 'Service Level',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Service Level' }],
        },
      },
      {
        path: 'inco/list',
        component: IncoListComponent,
        data: {
          title: 'Inco',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Inco' }],
        },
      },
      {
        path: 'inco/entry',
        component: IncoComponent,
        data: {
          title: 'Inco',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Inco' }],
        },
      },
      {
        path: 'time-zone/list',
        component: TimeZoneListComponent,
        data: {
          title: 'Time Zone',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Time Zone' }],
        },
      },
      {
        path: 'time-zone/entry',
        component: TimeZoneComponent,
        data: {
          title: 'Time Zone',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Time Zone' }],
        },
      },
      {
        path: 'charge/list',
        component: ChargeListComponent,
        data: {
          title: 'Charge',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Charge' }],
        },
      },
      {
        path: 'charge/entry',
        component: ChargeEntryComponent,
        data: {
          title: 'Charge',
          urls: [{ title: 'Master', url: '/master' },
          { title: 'Charge' }],
        },
      },
      {
        path: "charge/entry/:id",
        component: ChargeEntryComponent,
        data: {
          title: "Edit Charge",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Charge" },
          ],
        },
      },
      {
        path: 'terms-condition/list',
        component: TermsConditionListComponent,
        data: {
          title: 'Terms and Condition',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Terms and Condition' },
          ],
        },
      },
      {
        path: 'terms-condition/entry',
        component: TermsConditionEntryComponent,
        data: {
          title: 'Terms and Condition',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Terms and Condition' },
          ],
        },
      },
      {
        path: 'hs-sac',
        component: HSSACComponent,
        data: {
          title: 'HS-SAC',
          urls: [{ title: 'Master', url: '/master' }, { title: 'HS-SAC' }],
        },
      },
      {
        path: "hs-sac",
        component: HSSACComponent,
        data: {
          title: "HS-SAC",
          urls: [
            { title: "Master", url: "/master" },
            { title: "HS-SAC" },
          ],
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
        path: 'module/entry',
        component: ModuleEntryComponent,
        data: {
          title: 'Add Module Module',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Module' }],
        },
      },
      {
        path: 'module/entry/:id',
        component: ModuleEntryComponent,
        data: {
          title: 'Edit Module Module',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Module' }],
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
        path: 'role/entry',
        component: RoleEntryComponent,
        data: {
          title: 'Role',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Role' }],
        },
      },
      {
        path: 'role/entry/:id',
        component: RoleEntryComponent,
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
        path: 'chargegroup',
        component: ChargegroupComponent,
        data: {
          title: 'Charge Group',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Charge Group' }],
        },
      },
      {
        path: 'tds-set/list',
        component: TdsSetListComponent,
        data: {
          title: 'TDS Set',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'TDS Set' },
          ],
        },
      },
      {
        path: 'tds-set/entry',
        component: TdsSetEntryComponent,
        data: {
          title: 'TDS Set',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'TDS Set' },
          ],
        },
      },
        {
        path: 'Imco/list',
        component: ImcoListComponent,
        data: {
          title: 'Imco',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Imco' },
          ],
        },
      },
      {
        path: 'Imco/entry',
        component: ImcoEntryComponent,
        data: {
          title: 'Imco',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Imco' },
          ],
        },
      },
      {
        path: 'Imco/entry/:id',
        component: ImcoEntryComponent,
        data: {
          title: 'Imco',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Imco' },
          ],
        },
      },
       {
        path: 'BIClause',
        component: BIclauseComponent,
        data: {
          title: 'BIClause',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'BIClause' },
          ],
        },
      },
       {
  path: 'biclause',
  component: BIclauseComponent,
  data: {
    title: 'BI Clause',
    urls: [
      { title: 'Master', url: '/master' },
      { title: 'BI Clause' },
    ],
  },
},
      {
        path: 'product/entry',
        component: ProductEntryComponent,
        data: {
          title: 'Product',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Product' },
          ],
        },
      },
       {
        path: 'sailing-schedule/list',
        component: SailingScheduleLsitComponent,
        data: {
          title: 'Sailing Schedule',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Sailing Schedule' },
          ],
        },
      },
      {
        path: 'sailing-schedule/entry',
        component: SailingScheduleEntryComponent,
        data: {
          title: 'Sailing Schedule',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Sailing Schedule' },
          ],
        },
      },
    ],
  },

];
