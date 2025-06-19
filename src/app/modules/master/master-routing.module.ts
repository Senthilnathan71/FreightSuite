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
import { TarrifEntryComponent } from './tarrif/tarrif-entry/tarrif-entry.component';
import { TarrifListComponent } from './tarrif/tarrif-list/tarrif-list.component';
import { ReportListComponent } from './report/report-list/report-list.component';
import { ReportEntryComponent } from './report/report-entry/report-entry.component';
import { CompanyListComponent } from './company/company-list/company-list.component';
import { CompanyEntryComponent } from './company/company-entry/company-entry.component';
import { AirlineListComponent } from './airline/airline-list/airline-list.component';
import { AirlineEntryComponent } from './airline/airline-entry/airline-entry.component';
import { MilestoneListComponent } from './milestone/milestone-list/milestone-list.component';
import { MilestoneEntryComponent } from './milestone/milestone-entry/milestone-entry.component';
import { OrganizationListComponent } from './organization/organization-list/organization-list.component';
import { OrganizationEntryComponent } from './organization/organization-entry/organization-entry.component';
import { ContainerTypeListComponent } from './container-type/container-type-list/container-type-list.component';
import { ContainerTypeEntryComponent } from './container-type/container-type-entry/container-type-entry.component';
import { CommodityListComponent } from './commodity/commodity-list/commodity-list.component';
import { CommodityEntryComponent } from './commodity/commodity-entry/commodity-entry.component';
import { PackageTypeListComponent } from './package-type/package-type-list/package-type-list.component';
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
import { ZoneComponent } from './zone/zone/zone.component';
import { CityComponent } from './city/city/city.component';
import { ChargegroupComponent } from './chargeGroup/chargegroup/chargegroup.component';
import { TdsSetListComponent } from './TDS-Set/tds-set-list/tds-set-list.component';
import { TdsSetEntryComponent } from './TDS-Set/tds-set-entry/tds-set-entry.component';
import { ImcoListComponent } from './Imco/imco-list/imco-list.component';
import { ImcoEntryComponent } from './Imco/imco-entry/imco-entry.component';
import { BIclauseComponent } from './BIClause/biclause/biclause.component';
import { ProductListComponent } from './product/product-list/product-list.component';
import { ProductEntryComponent } from './product/product-entry/product-entry.component';
import { DivisionComponent } from './division/division/division.component';
import { SailingScheduleLsitComponent } from './SailingSchedule/sailing-schedule-lsit/sailing-schedule-lsit.component';
import { SailingScheduleEntryComponent } from './SailingSchedule/sailing-schedule-entry/sailing-schedule-entry.component';
import { SectorComponent } from './sector/sector-list/sector-list.component';
import { UserListComponent } from './user/user-list/user-list.component';
import { UserEntryComponent } from './user/user-entry/user-entry.component';
import { ChargeTaxComponent } from './charge-tax/charge-tax/charge-tax.component';
import { AuthorityListComponent } from './authority/authority-list/authority-list.component';
import { AuthorityEntryComponent } from './authority/authority-entry/authority-entry.component';

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
        component: SectorComponent,
        data: {
          title: 'Sector List',
          urls: [{ title: 'Master', url: '/master' }, { title: 'sector' }],
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
          title: 'Milestone',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Milestone' }],
        },
      },
      {
        path: 'milestone/entry/:id',
        component: MilestoneEntryComponent,
        data: {
          title: 'Milestone',
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
        path: 'terms-condition/entry/:id',
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
        path: 'division',
        component: DivisionComponent,
        data: {
          title: 'Division',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Division' }],
        },
      },
      {
        path: "division/:DivisionMasterSid",
        component: DivisionComponent,
        data: {
          title: "Division",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Division" },
          ],
        },
      },
      {
        path: 'zone',
        component: ZoneComponent,
        data: {
          title: 'Zone',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Zone' }],
        },
      },
      {
        path: "zone/:id",
        component: ZoneComponent,
        data: {
          title: "Zone",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Zone" },
          ],
        },
      },
      {
        path: 'city',
        component: CityComponent,
        data: {
          title: 'City',
          urls: [{ title: 'Master', url: '/master' }, { title: 'City' }],
        },
      },
      {
        path: "city/:id",
        component: CityComponent,
        data: {
          title: "City",
          urls: [
            { title: "Master", url: "/master" },
            { title: "City" },
          ],
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
        path: 'product/list',
        component: ProductListComponent,
        data: {
          title: 'Product',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Product' },
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
        path: 'product/entry/:id',
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
      {
      path: 'sailing-schedule/entry/:id',
        component: SailingScheduleEntryComponent,
        data: {
          title: 'Sailing Schedule',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Sailing Schedule' },
          ],
        },
      },
      {
        path: 'user/list',
        component: UserListComponent,
        data: {
          title: 'User',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'User' },
          ],
        },
      },
      {
        path: 'user/entry',
        component: UserEntryComponent,
        data: {
          title: 'User',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'User' },
          ]
        }
      },
      {
        path: 'user/entry/:id',
        component: UserEntryComponent,
        data: {
          title: 'User',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'User' },
          ]
        }
      },
    ],
  },
  {
        path: 'Charge-tax',
        component: ChargeTaxComponent,
        data: {
          title: 'Charge-tax',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Charge-tax' },
          ],
        },
      },
      {
        path: 'authority/list',
        component: AuthorityListComponent,
        data: {
          title: 'Authority',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Authority' },
          ],
        },
      },
      {
        path: 'authority/entry',
        component: AuthorityEntryComponent,
        data: {
          title: 'Authority',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Authority' },
          ],
        },
      },

];
