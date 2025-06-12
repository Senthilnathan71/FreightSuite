import { RouteInfo } from './vertical-sidebar.metadata';

export const ROUTES: RouteInfo[] = [

  // {
  //   path: '/crm',
  //   title: 'Dashboard',
  //   icon: 'mdi mdi-view-dashboard',
  //   class: '',
  //   extralink: false,
  //   label: '',
  //   labelClass: '',
  //   submenu: []
  // },
  {
    path: '',
    title: 'Master',
    icon: 'mdi mdi-view-dashboard',
    class: '',
    extralink: false,
    label: '',
    labelClass: '',
    submenu: [
      {
        path: '/master/department/list',
        title: 'Department',
        icon: 'mdi mdi-office',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/port-master/list',
        title: 'Port Master',
        icon: 'mdi mdi-anchor',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/uom-master/list',
        title: 'UOM Master',
        icon: 'mdi mdi-ruler	',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/country/list',
        title: 'Country',
        icon: 'mdi mdi-earth',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/state/list',
        title: 'State',
        icon: 'mdi mdi-map',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/unit/list',
        title: 'Unit',
        icon: 'mdi mdi-cube',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/zone/list',
        title: 'Zone',
        icon: 'mdi mdi-vector-square',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/city/list',
        title: 'City',
        icon: 'mdi mdi-city',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/currency/list',
        title: 'Currency',
        icon: 'mdi mdi-currency-usd',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/vessel/list',
        title: 'Vessel',
        icon: 'mdi mdi-ferry',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/tarrif/list',
        title: 'Tariff',
        icon: 'mdi mdi-file-document',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/organization/list',
        title: 'Organization',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/company/list',
        title: 'Company',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/menu/list',
        title: 'Menu',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/report/list',
        title: 'Report',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/region/list',
        title: 'Region',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/division/list',
        title: 'division',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/container-type/list',
        title: 'Container Type',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/commodity/list',
        title: 'Commodity',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/package-type/list',
        title: 'Package Type',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/airline/list',
        title: 'Airline',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/sector/list',
        title: 'Sector',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/service-level/list',
        title: 'Service Level',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/inco/list',
        title: 'Inco',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/time-zone/list',
        title: 'Time Zone',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/charge/list',
        title: 'Charge',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/terms-condition/list',
        title: 'Terms and Condition',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/hs-sac',
        title: 'HS-SAC',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/module/list',
        title: 'Module',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/role/list',
        title: 'Role',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/rolemenu',
        title: 'Role Menu',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/chargegroup',
        title: 'Charge Group',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/tds-set/list',
        title: 'TDS Set',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/Imco/list',
        title: 'Imco',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/BIClause',
        title: 'BIClause',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
         {
        path: '/master/product/list',
        title: 'Product',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
        {
        path: '/master/sailing-schedule/list',
        title: 'Sailing Schedule',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/user/list',
        title: 'User',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/master/Charge-tax',
        title: 'Charge-tax',
        icon: 'fas fa-dot-circle',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
    ]
  },

  {
    path: '',
    title: 'Account',
    icon: 'mdi mdi-stackexchange',
    class: '',
    extralink: false,
    label: '',
    labelClass: '',
    submenu: [
      {
        path: '/accounts/currency-exchange/list',
        title: 'Currency Exchange',
        icon: 'mdi mdi-stackexchange',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/accounts/tax-group/list',
        title: 'Tax Group',
        icon: 'mdi mdi-stackexchange',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },

      {
        path: '/accounts/approval',
        title: 'Approval',
        icon: 'mdi mdi-stackexchange',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
    ]
  },
  {
    path: '',
    title: 'CRM',
    icon: 'mdi mdi-stackexchange',
    class: '',
    extralink: false,
    label: '',
    labelClass: '',
    submenu: [
      {
        path: '/crm/lead/list',
        title: 'Lead',
        icon: 'mdi mdi-stackexchange',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/crm/lead-schedule-pending',
        title: 'Lead Schedule Pending',
        icon: 'mdi mdi-stackexchange',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/crm/meeting-update',
        title: 'Meeting Update',
        icon: 'mdi mdi-stackexchange',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/crm/calendar',
        title: 'Calender',
        icon: 'mdi mdi-stackexchange',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/crm/rate-request/list',
        title: 'Rate Request',
        icon: 'mdi mdi-stackexchange',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/crm/quotation/list',
        title: 'Quotation',
        icon: 'mdi mdi-stackexchange',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
      {
        path: '/crm/todo',
        title: 'Todo',
        icon: 'mdi mdi-stackexchange',
        class: '',
        extralink: false,
        label: '',
        labelClass: '',
        submenu: []
      },
    ]
  },




  //







  // {
  //   path: '',
  //   title: 'UI',
  //   icon: 'mdi mdi-dots-horizontal',
  //   class: 'nav-small-cap',
  //   extralink: true,
  //   label: '',
  //   labelClass: '',
  //   submenu: []
  // },
  // {
  //   path: '',
  //   title: 'Component',
  //   icon: 'Cpu',
  //   class: 'has-arrow',
  //   extralink: false,
  //   label: '',
  //   labelClass: '',
  //   submenu: [
  //     {
  //       path: '/component/accordion',
  //       title: 'Accordion',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: '/component/alert',
  //       title: 'Alert',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: '/component/badges',
  //       title: 'Badges',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: '/component/buttons',
  //       title: 'Button',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: '/component/carousel',
  //       title: 'Carousel',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: '/component/card',
  //       title: 'Card',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: '/component/dropdown',
  //       title: 'Dropdown',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: '/component/datepicker',
  //       title: 'Datepicker',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: '/component/modal',
  //       title: 'Modal',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: '/component/pagination',
  //       title: 'Pagination',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: '/component/poptool',
  //       title: 'Popover & Tooltip',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: '/component/progressbar',
  //       title: 'Progressbar',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: '/component/rating',
  //       title: 'Ratings',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: '/component/nav',
  //       title: 'Nav',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: '/component/timepicker',
  //       title: 'Timepicker',
  //       icon: 'mdi mdi-adjust',
  //       class: '',
  //       extralink: false,
  //       label: '',
  //       labelClass: '',
  //       submenu: []
  //     },
  //     {
  //       path: "/component/toast",
  //       title: "Toast",
  //       icon: "mdi mdi-adjust",
  //       class: "",
  //       extralink: false,
  //       label: "",
  //       labelClass: "",
  //       submenu: [],
  //     },
  //   ]
  // }
];
