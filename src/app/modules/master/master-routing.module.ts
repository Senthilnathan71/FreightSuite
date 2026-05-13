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
import { MilestoneListComponent } from './milestone/milestone-list/milestone-list.component';
import { MilestoneEntryComponent } from './milestone/milestone-entry/milestone-entry.component';
import { OrganizationListComponent } from './organization/organization-list/organization-list.component';
import { OrganizationEntryComponent } from './organization/organization-entry/organization-entry.component';
import { ContainerTypeListComponent } from './container-type/container-type-list/container-type-list.component';
import { ContainerTypeEntryComponent } from './container-type/container-type-entry/container-type-entry.component';
import { PackageTypeListComponent } from './package-type/package-type-list/package-type-list.component';
import { ServiceLevelListComponent } from './service-level/service-level-list/service-level-list.component';
import { ServiceLevelComponent } from './service-level/service-level.component';
import { TimeZoneComponent } from './time-zone/time-zone.component';
import { TimeZoneListComponent } from './time-zone/time-zone-list/time-zone-list.component';
import { ChargeListComponent } from './charge/charge-list/charge-list.component';
import { ChargeEntryComponent } from './charge/charge-entry/charge-entry.component';
import { TermsConditionListComponent } from './terms-condition/terms-condition-list/terms-condition-list.component';
import { TermsConditionEntryComponent } from './terms-condition/terms-condition-entry/terms-condition-entry.component';
import { HSSACComponent } from './HS-SAC/hs-sac/hs-sac.component';
import { IncoComponent } from './inco/inco/inco.component';
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

import { SailingScheduleEntryComponent } from './SailingSchedule/sailing-schedule-entry/sailing-schedule-entry.component';
import { SectorComponent } from './sector/sector-list/sector-list.component';
import { UserListComponent } from './user/user-list/user-list.component';
import { UserEntryComponent } from './user/user-entry/user-entry.component';

import { AuthorityListComponent } from './authority/authority-list/authority-list.component';
import { AuthorityEntryComponent } from './authority/authority-entry/authority-entry.component';
import { YearListComponent } from './year/year-list/year-list.component';
import { YearEntryComponent } from './year/year-entry/year-entry.component';
import { DoctypeComponent } from './document-type/doctype-entry/doctype.component';
import { DoctypeListComponent } from './document-type/doctype-list/doctype-list.component';
import { CostCenterComponent } from './cost-center/cost-center/cost-center.component';
import { ProfitCenterComponent } from './profit-center/profit-center/profit-center.component';
import { HawbStockListComponent } from './Hawb-Stock/hawb-stock-list/hawb-stock-list.component';
import { HawbStockEntryComponent } from './Hawb-Stock/hawb-stock-entry/hawb-stock-entry.component';
import { ConfigComponent } from './company/config/config.component';
import { ConfigNewComponent } from './company/config-new/config-new.component';
import { DocumentAuthorizationComponent } from './document-authorization/document-authorization.component';
import { DocumnetGenerationListComponent } from './document-number-generation/documnet-generation-list/documnet-generation-list.component';
import { DocumnetGenerationEntryComponent } from './document-number-generation/documnet-generation-entry/documnet-generation-entry.component';
import { ContainerActivityListComponent } from './container-activity/container-activity-list/container-activity-list.component';
import { ContainerActivityEntryComponent } from './container-activity/container-activity-entry/container-activity-entry.component';
import { UserActivityConfigurationComponent } from './user-activity-configuration/user-activity-configuration.component';
import { ReportMasterEntryComponent } from '../../master/components/report-master-entry/report-master-entry.component';
import { ReportMasterListComponent } from '../../master/components/report-master-list/report-master-list.component';
import { ReportParameterConfigComponent } from '../../master/components/report-parameter-config/report-parameter-config.component';
import { SailingScheduleListComponent } from './SailingSchedule/sailing-schedule-lsit/sailing-schedule-lsit.component';
import { MawbStockListComponent } from './Mawb-stock/mawb-stock-list/mawb-stock-list.component';
import { MawbStockComponent } from './Mawb-stock/mawb-stock/mawb-stock.component';
import { NetworkEntryComponent } from './network/network-entry/network-entry.component';
import { TaxGroupComponent } from './tax-group/tax-group/tax-group.component';
import { TaxMasterComponent } from './tax-master/tax-master.component';
import { CompanyConfigComponent } from './company/company-config/company-config.component';
import { VoucherPeriodEntryComponent } from './voucher-period/voucher-period-entry/voucher-period-entry.component';
import { StandardChargeListComponent } from './standard-charge/standard-charge-list/standard-charge-list.component';
import { StandardChargeEntryComponent } from './standard-charge/standard-charge-entry/standard-charge-entry.component';
import { PrintMasterListComponent } from './print-master/print-master-list/print-master-list.component';
import { PreCustomerEventListComponent } from './pre-customer-event/pre-customer-event-list/pre-customer-event-list.component';
import { PreCustomerEventEntryComponent } from './pre-customer-event/pre-customer-event-entry/pre-customer-event-entry.component';
import { UnsavedChangesGuard } from 'src/app/core/guards/unsaved-changes.guard';

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
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Add Department',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Department' }],
        },
      },
      {
        path: 'department/entry/:id',
        component: DepartmentEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Edit Department',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Department' }],
        },
      },
      {
        path: 'pre-customer-event/list',
        component: PreCustomerEventListComponent,
        data: {
          title: 'Events',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Events' }],
        },
      },
      {
        path: 'pre-customer-event/entry',
        component: PreCustomerEventEntryComponent,
        data: {
          title: 'Add Event',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Events' }],
        },
      },
      {
        path: 'pre-customer-event/entry/:id',
        component: PreCustomerEventEntryComponent,
        data: {
          title: 'Edit Event',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Events' }],
        },
      },
      {
        path: 'currency/list',
        component: CurrencyListComponent,
        data: {
          title: 'Currency',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Currency' }],
        },
      },
      {
        path: 'currency/entry',
        component: CurrencyEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Port Master',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Port Master' }],
        },
      },
      {
        path: 'port-master/view/:id',
        component: PostMasterViewComponent,
        canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Country',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Country Add' }],
        },
      },
      {
        path: 'country/entry/:id',
        component: CountryEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
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
            canDeactivate: [UnsavedChangesGuard],
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
            canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Unit',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Unit Add' }],
        },
      },
      {
        path: 'unit/entry/:id',
        component: UnitEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Add Vessel',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Vessel Add' }],
        },
      },
      {
        path: 'vessel/entry/:id',
        component: VesselEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Add Tarrif',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Tarrif' }],
        },
      },
      {
        path: 'tarrif/entry/:id',
        component: TarrifEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Edit Tarrif',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Edit Tarrif' }],
        },
      },
      {
        path: 'sector/list',
        component: SectorComponent,
        data: {
          title: 'Sector ',
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
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Company',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Company' }],
        },
      },
      {
        path: 'company/entry/:id',
        component: CompanyEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Edit Company',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Company' }],
        },
      },

{
  path: 'company/:id/config',
  component: ConfigNewComponent,
  data: {
    title: 'Company Configuration',
    urls: [
      { title: 'Master', url: '/master' },
      { title: 'Company', url: '/master/company/list' },
      { title: 'Company Configuration' }
    ],
  },
},
{
  path: 'company/config-new',
  component: CompanyConfigComponent,
  data: {
    title: 'Create Company Configuration',
    urls: [
      { title: 'Master', url: '/master' },
      { title: 'Company', url: '/master/company/list' },
      { title: 'Create Configuration' }
    ],
  },
},
{
  path: 'company/:id/config-new',
  component: CompanyConfigComponent ,
  data: {
    title: 'Company Configuration',
    urls: [
      { title: 'Master', url: '/master' },
      { title: 'Company', url: '/master/company/list' },
      { title: 'Company Configuration' }
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
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Container Type',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Container Type' }],
        },
      },
      {
        path: "container-type/entry/:id",
        component: ContainerTypeEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: "Edit Conatiner Type",
          urls: [
            { title: "Master", url: "/master" }, { title: "Conatiner Type" },
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
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Milestone',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Milestone' }],
        },
      },
      {
        path: 'milestone/entry/:id',
        component: MilestoneEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Organization',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Organization' }],
        },
      },
      {
        path: 'organization/entry/:id',
        component: OrganizationEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Organization',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Organization' }],
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
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Charge',
          urls: [{ title: 'Master', url: '/master' },
          { title: 'Charge' }],
        },
      },
      {
        path: "charge/entry/:id",
        component: ChargeEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
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
        path: 'inco',
        component: IncoComponent,
        data: {
          title: 'Inco',
          urls: [{ title: 'Master', url: '/master' }, { title: 'Inco' }],
        },
      },
      {
        path: "inco/:id",
        component: IncoComponent,
        data: {
          title: "Inco",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Inco" },
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
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'TDS Set',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'TDS Set' },
          ],
        },
      },
      {
        path: 'tds-set/entry/:id',
        component: TdsSetEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'TDS Set',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'TDS Set' },
          ],
        },
      },
      {
        path: 'imco/list',
        component: ImcoListComponent,
        data: {
          title: 'IMCO',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Imco' },
          ],
        },
      },
      {
        path: 'imco/entry',
        component: ImcoEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'IMCO',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Imco' },
          ],
        },
      },
      {
        path: 'imco/entry/:id',
        component: ImcoEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'IMCO',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Imco' },
          ],
        },
      },
      {
        path: 'blclause',
        component: BIclauseComponent,
        data: {
          title: 'BL Clause',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'BL Clause' },
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
        canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
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
        component: SailingScheduleListComponent,
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
        canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
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
        canDeactivate: [UnsavedChangesGuard],
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
    path: 'tax-master',
    component: TaxMasterComponent,
    data: {
      title: 'TaxMaster',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'tax-master' },
      ],
    },
  },
  {
    path: 'authorization/list',
    component: AuthorityListComponent,
    data: {
      title: 'Authorization',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Authorization' },
      ],
    },
  },
  {
    path: 'authorization/entry',
    component: AuthorityEntryComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Authorization',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Authorization' },
      ],
    },
  },
  {
    path: 'authorization/entry/:id',
    component: AuthorityEntryComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Authorization',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Authorization' },
      ]
    }
  },
  {
    path: 'year/list',
    component: YearListComponent,
    data: {
      title: 'Year',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Year' },
      ],
    },
  },
  {
    path: 'year/entry',
    component: YearEntryComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Year',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Year' },
      ]
    }
  },
  {
    path: 'year/entry/:YearMasterSid',
    component: YearEntryComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Year',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Year' },
      ]
    }
  },
  {
    path: 'doctype/entry',
    component: DoctypeComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Document Type',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Docunment Type' },
      ]
    }
  },
  {
    path: 'doctype/entry/:id',
    component: DoctypeComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Document Type',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Docunment Type' },
      ]
    }
  },
  {
    path: 'doctype/list',
    component: DoctypeListComponent,
    data: {
      title: 'Document Type',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Document Type' },
      ]
    }
  },
  {
    path: 'hawbstock/list',
    component: HawbStockListComponent,
    data: {
      title: 'Hawbs tock',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Hawb stock' },
      ],
    },
  },
  {
    path: 'hawbstock/entry',
    component: HawbStockEntryComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Hawb stock',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Hawb stock' },
      ]
    }
  },
  {
    path: 'hawbstock/entry/:id',
    component: HawbStockEntryComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Hawb stock',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Hawb stock ' },
      ]
    }
  },
  {
    path: 'cost-center',
    component: CostCenterComponent,
    data: {
      title: 'Cost Center',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Cost Center' },
      ]
    }
  },
  {
    path: "cost-center/:id",
    component: CostCenterComponent,
    data: {
      title: "Cost Center",
      urls: [
        { title: "Master", url: "/master" },
        { title: "Cost Center" },
      ],
    },
  },
  {
    path: 'profit-center',
    component: ProfitCenterComponent,
    data: {
      title: 'Profit Center',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Profit Center' },
      ]
    }
  },
  {
    path: "profit-center/:id",
    component: ProfitCenterComponent,
    data: {
      title: "Profit Center",
      urls: [
        { title: "Master", url: "/master" },
        { title: "Profit Center" },
      ],
    },
  },
  
   {
    path: 'document-authorization',
    component: DocumentAuthorizationComponent,
    data: {
      title: 'Document Authorization',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Document Authorization' },
      ],
    },
  },{
    path: 'document-number-generation/list',
    component: DocumnetGenerationListComponent,
    data: {
      title: 'Document Number Generation',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Document Number Generation' },
      ],
    },
  },{
    path: 'document-number-generation/entry',
    component: DocumnetGenerationEntryComponent,
    data: {
      title: 'Document Number Generation',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Document Number Generation' },
      ],
    },
  },
       {
          path: 'container-activity/list',
          component: ContainerActivityListComponent,
          data: {
            title: 'Container Activity',
            urls: [{ title: 'Master', url: '/master' }, { title: 'Container Activity' }],
          },
        },
        {
          path: 'container-activity/entry',
          component: ContainerActivityEntryComponent,
          canDeactivate:[UnsavedChangesGuard],
          data: {
            title: 'Container Activity',
            urls: [{ title: 'Master', url: '/master' }, { title: 'Container Activity' }],
          },
        },
         {
    path: 'container-activity/entry/:id',
    component: ContainerActivityEntryComponent,
    canDeactivate:[UnsavedChangesGuard],
    data: {
      title: 'Container Activity',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Container Activity' },
      ]
    }
  },
  {
    path: 'user-activity-configuration',
    component: UserActivityConfigurationComponent,
    data: {
      title: 'Resource Allocation',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Resource Allocation' },
      ],
    },
  },

  {
    path: 'report-master/list',
    component: ReportMasterListComponent,
    data: {
      title: 'Report Master',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Report Master' },
      ]
    }
  },
  {
    path: 'report-master/entry',
    component: ReportMasterEntryComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Report Master',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Report Master' },
      ]
    }
  },
    {
    path: 'report-master/entry/:id',
    component: ReportMasterEntryComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Report Master',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Report Master' },
      ]
    }
  },
  {
    path: 'report-master/parameters/:id',
    component: ReportParameterConfigComponent,
    data: {
      title: 'Report Parameters',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Report Master', url: '/master/report-master/list' },
        { title: 'Parameters' },
      ]
    }
  },
   {
    path: 'mawb-stock/list',
    component: MawbStockListComponent,
    data: {
      title: 'Mawb-Stock',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Mawb-Stock' },
      ]
    }
  },
  {
    path: 'mawb-stock/entry',
    component: MawbStockComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Mawb-Stock',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Mawb-Stock' },
      ]
    }
  },

  {
    path: 'mawb-stock/entry/:id',
    component: MawbStockComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Mawb stock',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Mawb stock ' },
      ]
    }
  },

  {
    path: 'network/entry',
    component: NetworkEntryComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Network',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Network' },
      ]
    }
  },
  {
    path: 'tax-group/entry',
    component: TaxGroupComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Tax Group',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Tax Group ' },
      ]
    }
  },
  {
    path: 'voucher-period/entry',
    component: VoucherPeriodEntryComponent,
    data: {
      title: 'Voucher Period',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Voucher Period' },
      ]
    }
  },
  {
    path: 'voucher-period/entry/:VoucherPeriodSid',
    component: VoucherPeriodEntryComponent,
    data: {
      title: 'Voucher Period',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Voucher Period' },
      ]
    }
  },
   {
    path: 'standard-charge/list',
    component: StandardChargeListComponent,
    data: {
      title: 'Standard Charge',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Standard Charge' },
      ]
    }
  },
    {
    path: 'standard-charge/entry',
    component: StandardChargeEntryComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Standard Charge',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Standard Charge' },
      ]
    }
  },
    {
    path: 'standard-charge/entry/:id',
    component: StandardChargeEntryComponent,
    canDeactivate: [UnsavedChangesGuard],
    data: {
      title: 'Standard Charge',
      urls: [
        { title: 'Master', url: '/master' },
        { title: 'Standard Charge' },
      ]
    }
  },
  {
    path: 'print-master',
    component: PrintMasterListComponent,
    data: {
      title: 'Print Master',
      urls: [{ title: 'Master', url: '/master' }, { title: 'Print Master' }]
    }
  },
];
