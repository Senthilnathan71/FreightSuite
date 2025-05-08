import { Routes } from '@angular/router';
import { CustomerComponent } from './customer/customer.component';
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
import { CustomerViewComponent } from './customer/customer-view/customer-view.component';
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
import { RegionListComponent } from './region/region-list/region-list.component';
import { RegionEntryComponent } from './region/region-entry/region-entry.component';
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




export const MasterRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: CustomerComponent,
      },
      {
        path: 'customer/list',
        component: CustomerComponent,
        data: {
          title: 'Customer',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Customer' },
          ],
        },
      },
      {
        path: 'customer/view',
        component: CustomerViewComponent,
        data: {
          title: 'New Customer',
          urls: [
            { title: 'Master', url: '/master' },
            { title: 'Customer', url: 'customer' },
            { title: 'View' },
          ],
        },
      },
      {
        path: "city/list",
        component: CityListComponent,
        data: {
          title: "City",
          urls: [
            { title: "Master", url: "/master" },
            { title: "City" },
          ],
        },
      },
      {
        path: "city/entry",
        component: CityEntryComponent,
        data: {
          title: "Add City",
          urls: [
            { title: "Master", url: "/master" },
            { title: "City" },
          ],
        },
      },
      {
        path: "city/entry/:id",
        component: CityEntryComponent,
        data: {
          title: "Edit City",
          urls: [
            { title: "Master", url: "/master" },
            { title: "City" },
          ],
        },
      },
      {
        path: "department/list",
        component: DepartmentListComponent,
        data: {
          title: "Department",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Department" },
          ],
        },
      },
      {
        path: "department/entry",
        component: DepartmentEntryComponent,
        data: {
          title: "Add Department",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Department" },
          ],
        },
      },
      {
        path: "currency/list",
        component: CurrencyListComponent,
        data: {
          title: "Currency",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Currency" },
          ],
        },
      },
      {
        path: "currency/entry",
        component: CurrencyEntryComponent,
        data: {
          title: "Add Currency",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Currency" },
          ],
        },
      },
      {
        path: "port-master/view",
        component: PostMasterViewComponent,
        data: {
          title: "Port Master",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Port Master" },
          ],
        },
      },
      {
        path: "port-master/view/:id",
        component: PostMasterViewComponent,
        data: {
          title: "Port Master",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Port Master" },
          ],
        },
      },
      {
        path: "port-master/list",
        component: PostMasterListComponent,
        data: {
          title: "Port Master",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Port Master List" },
          ],
        },
      },
      {
        path: "uom-master/list",
        component: UOMListComponent,
        data: {
          title: "UOM Master",
          urls: [
            { title: "Master", url: "/master" },
            { title: "UOM Master List" },
          ],
        },
      },
      {
        path: "uom-master/view",
        component: UOMViewComponent,
        data: {
          title: "UOM Master Entry",
          urls: [
            { title: "Master", url: "/master" },
            { title: "UOM Master View" },
          ],
        },
      },
      {
        path: "uom-master/view/:id",
        component: UOMViewComponent,
        data: {
          title: "UOM Master Edit",
          urls: [
            { title: "Master", url: "/master" },
            { title: "UOM Master View" },
          ],
        },
      },
      {
        path: "country/list",
        component: CountryListComponent,
        data: {
          title: "Country",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Country List" },
          ],
        },
      },
      {
        path: "country/entry",
        component: CountryEntryComponent,
        data: {
          title: "Country",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Country Add" },
          ],
        },
      },
      {
        path: "country/entry/:id",
        component: CountryEntryComponent,
        data: {
          title: "Country",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Country update" },
          ],
        },
      },
      {
        path: "state/list",
        component: StateListComponent,
        data: {
          title: "State",
          urls: [
            { title: "Master", url: "/master" },
            { title: "State List" },
          ],
        },
      },
      {
        path: "state/entry",
        component: StateEntryComponent,
        data: {
          title: "State",
          urls: [
            { title: "Master", url: "/master" },
            { title: "State Add" },
          ],
        },
      },
      {
        path: "unit/list",
        component: UnitListComponent,
        data: {
          title: "Unit",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Unit List" },
          ],
        },
      },
      {
        path: "unit/entry",
        component: UnitEntryComponent,
        data: {
          title: "Unit",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Unit Add" },
          ],
        },
      },
      {
        path: "unit/entry/:id",
        component: UnitEntryComponent,
        data: {
          title: "Unit",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Unit Edit" },
          ],
        },
      },
      {
        path: "vessel/list",
        component: VesselListComponent,
        data: {
          title: "Vessel",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Vessel List" },
          ],
        },
      },
      {
        path: "vessel/entry",
        component: VesselEntryComponent,
        data: {
          title: "Vessel",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Vessel Add" },
          ],
        },
      },
      {
        path: "zone/list",
        component: ZoneListComponent,
        data: {
          title: "Zone",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Zone List" },
          ],
        },
      },
      {
        path: "zone/entry",
        component: ZoneEntryComponent,
        data: {
          title: "Zone",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Zone Add" },
          ],
        },
      },
      {
        path: "tarrif/list",
        component: TarrifListComponent,
        data: {
          title: "Tarrif",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Tarrif" },
          ],
        },
      },
      {
        path: "tarrif/entry",
        component: TarrifEntryComponent,
        data: {
          title: "Add Tarrif",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Tarrif" },
          ],
        },
      },
      {
        path: "sector/list",
        component: SectorListComponent,
        data: {
          title: "Sector List",
          urls: [
            { title: "Master", url: "/master" },
            { title: "sector" },
          ],
        },
      },
      {
        path: "sector/entry",
        component: SectorEntryComponent,
        data: {
          title: "Sector Entry",
          urls: [
            { title: "Master", url: "/master" },
            { title: "sector" },
          ],
        },
      },
      {
        path: "menu/list",
        component: MenuListComponent,
        data: {
          title: "Menu List",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Menu" },
          ],
        },
      },
      {
        path: "menu/entry",
        component: MenuListComponent,
        data: {
          title: "Menu Entry",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Menu" },
          ],
        },
      },
      {
        path: "report/list",
        component: ReportListComponent,
        data: {
          title: "Report",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Report" },
          ],
        },
      },
      {
        path: "report/entry",
        component: ReportEntryComponent,
        data: {
          title: "Report",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Report" },
          ],
        },
      },
      {
        path: "region/list",
        component: RegionListComponent,
        data: {
          title: "Region",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Region" },
          ],
        },
      },
      {
        path: "region/entry",
        component: RegionEntryComponent,
        data: {
          title: "Region",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Region" },
          ],
        },
      },
      {
        path: "company/list",
        component: CompanyListComponent,
        data: {
          title: "Company",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Company" },
          ],
        },
      },
      {
        path: "company/entry",
        component: CompanyEntryComponent,
        data: {
          title: "Company",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Company" },
          ],
        },
      },
      {
        path: "branch/list",
        component: BranchListComponent,
        data: {
          title: "Branch",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Branch" },
          ],
        },
      },
      {
        path: "branch/entry",
        component: BranchEntryComponent,
        data: {
          title: "Branch",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Branch" },
          ],
        },
      },
      {
        path: "airline/list",
        component: AirlineListComponent,
        data: {
          title: "Airline",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Airline" },
          ],
        },
      },
      {
        path: "airline/entry",
        component: AirlineEntryComponent,
        data: {
          title: "Airline",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Airline" },
          ],
        },
      },
      {
        path: "division/list",
        component: DivisionListComponent,
        data: {
          title: "Division",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Division" },
          ],
        },
      },
      {
        path: "division/entry",
        component: DivisionEntryComponent,
        data: {
          title: "Division",
          urls: [
            { title: "Master", url: "/master" },
            { title: "division" },
          ],
        },
      },
      {
        path: "container-type/list",
        component: ContainerTypeListComponent,
        data: {
          title: "Container Type",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Container Type" },
          ],
        },
      },
      {
        path: "container-type/entry",
        component: ContainerTypeEntryComponent,
        data: {
          title: "Container Type",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Container Type" },
          ],
        },
      },
      {
        path: "milestone/list",
        component: MilestoneListComponent,
        data: {
          title: "Milestone",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Milestone" },
          ],
        },
      },
      {
        path: "milestone/entry",
        component: MilestoneEntryComponent,
        data: {
          title: "Container Type",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Milestone" },
          ],
        },
      },
      {
        path: "organization/list",
        component: OrganizationListComponent,
        data: {
          title: "Organization",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Organization" },
          ],
        },
      },
      {
        path: "organization/entry",
        component: OrganizationEntryComponent,
        data: {
          title: "Organization",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Organization" },
          ],
        },
      },
      {
        path: "commodity/list",
        component: CommodityListComponent,
        data: {
          title: "Commodity",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Commodity" },
          ],
        },
      },
      {
        path: "commodity/entry",
        component: CommodityEntryComponent,
        data: {
          title: "Commodity",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Commodity" },
          ],
        },
      },
      {
        path: "package-type/list",
        component: PackageTypeListComponent,
        data: {
          title: "Package Type",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Package Type" },
          ],
        },
      },
      {
        path: "package-type/entry",
        component: PackageTypeEntryComponent,
        data: {
          title: "Package Type",
          urls: [
            { title: "Master", url: "/master" },
            { title: "Package Type" },
          ],
        },
      },

    ]
  }

];




// import { MilestoneListComponent } from './milestone/milestone-list/milestone-list.component';
// import { MilestoneEntryComponent } from './milestone/milestone-entry/milestone-entry.component';
// import { OrganizationListComponent } from './organization/organization-list/organization-list.component';
// import { OrganizationEntryComponent } from './organization/organization-entry/organization-entry.component';