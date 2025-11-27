# Freight Forwarding - Frontend Application

Angular 17 web application for Freight Forwarding Management System.

## Description

This is the frontend application providing user interfaces for:
- **CRM Operations**: Lead management, enquiries, quotations, customer tracking
- **Master Data Management**: Ports, vessels, charges, currencies, company/branch setup
- **Accounts Module**: Financial operations and voucher management
  - **Journal Voucher**: Multi-currency accounting entries with real-time validation
  - **Payment/Receipt Processing**: Payment and receipt voucher entry
  - **Dashboard**: Financial summaries and reports
- **Booking Management**: Booking entry, shipment tracking, documentation
- **Operations**: Master job, house job, and operational workflows

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (`npm install -g @angular/cli`)

## Project Setup

```bash
# Install dependencies
npm install
```

## Development Server

```bash
# Start development server
ng serve

# Alternative
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Build

```bash
# Development build
ng build

# Production build
ng build --configuration production

# Build and watch for changes
ng build --watch
```

The build artifacts will be stored in the `dist/` directory.

## Running Tests

```bash
# Unit tests
ng test

# Run tests with code coverage
ng test --code-coverage
```

## Key Features

### Journal Voucher Module
Complete accounting voucher entry interface with:
- ✅ **Multi-line entry**: Add unlimited debit/credit entries
- ✅ **Real-time calculations**: Auto-calculate local amounts (currency × exchange rate)
- ✅ **Balance validation**: Live debit/credit total comparison with visual indicators
- ✅ **Multi-currency**: Support for multiple currencies with auto exchange rates
- ✅ **Tax calculation**: Automatic tax line generation (India GST, UAE VAT)
- ✅ **Draft & Post**: Save as draft, validate, and post to general ledger
- ✅ **Search & Filter**: Advanced search with pagination
- ✅ **Company/Branch isolation**: Data filtered by selected company and branch
- ✅ **Cost/Profit centers**: Allocate to cost and profit centers
- ✅ **Job references**: Link to master jobs and house jobs

**Routes:**
- `/accounts/journal-voucher/list` - List all journal vouchers
- `/accounts/journal-voucher/entry` - Create new journal voucher
- `/accounts/journal-voucher/entry/:id` - Edit existing journal voucher
- `/accounts/journal-voucher/view/:id` - View journal voucher details

**Components:**
- `journal-voucher-list.component.ts` - List view with search, filter, pagination
- `journal-voucher-entry.component.ts` - Entry form with real-time validation
- `journal-voucher.service.ts` - API integration service

**Developer Guide:** See `../JOURNAL_VOUCHER_DEVELOPER_GUIDE.md` for comprehensive documentation.

### UI Components

**Reusable Components:**
- `ReusableTableComponent` - Advanced data grid with sorting, filtering, actions
- `BaseListComponent` - Base class for list views with pagination
- `PageHeaderComponent` - Standardized page header with actions
- `DropdownStore` - Centralized dropdown data management

**Shared Services:**
- `AppSettingsService` - Application settings, encryption, notifications
- `PaginationService` - Pagination state management
- `ExcelExportService` - Excel report generation

## Project Structure

```
src/
├── app/
│   ├── modules/
│   │   ├── accounts/
│   │   │   ├── journal-voucher/
│   │   │   │   ├── journal-voucher-entry/
│   │   │   │   ├── journal-voucher-list/
│   │   │   │   └── journal-voucher.service.ts
│   │   │   ├── accounts.service.ts
│   │   │   └── accounts-routing.module.ts
│   │   ├── crm-mobile/
│   │   ├── master/
│   │   ├── booking/
│   │   ├── operation/
│   │   └── authentication/
│   ├── core/
│   │   └── services/
│   │       └── app-settings.service.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── table/
│   │   │   ├── header-list/
│   │   │   └── base-list/
│   │   ├── services/
│   │   └── interfaces/
│   └── environments/
└── assets/
```

## Architecture

### Component Hierarchy

```
AppComponent
├── AuthenticationModule (Login, User Management)
├── DashboardModule
├── CRMModule (Leads, Enquiries, Quotations)
├── MasterModule (Master Data)
├── AccountsModule
│   ├── JournalVoucherModule
│   │   ├── JournalVoucherListComponent
│   │   └── JournalVoucherEntryComponent
│   ├── PaymentVoucherModule
│   └── ReceiptVoucherModule
├── BookingModule
└── OperationModule
```

### Data Flow

```
Component → Service → HTTP → Backend API
    ↓          ↑
 Form/UI    Response
    ↓          ↑
Validation  Mapping
    ↓          ↑
  State    Update UI
```

## Configuration

### Environment Variables

**`src/environments/environment.ts` (Development):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

**`src/environments/environment.prod.ts` (Production):**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com'
};
```

## State Management

### Company & Branch Context

The application uses localStorage to maintain:
- **selected-company**: Current company context (encrypted)
- **selected-branch**: Current branch context (encrypted)
- **current-year-id**: Current financial year

Access pattern:
```typescript
this.currentCompany = this.appSettingService.decrypt(
  localStorage.getItem('selected-company')
);
this.currentBranch = this.appSettingService.decrypt(
  localStorage.getItem('selected-branch')
);
```

### Dropdown Data Caching

The `DropdownStore` service caches frequently used master data:
- Currencies
- Departments
- Countries
- Ports
- Vessels

## Styling

### CSS Framework
- **Bootstrap 5**: Primary CSS framework
- **Angular Material**: Material Design components
- **Custom SCSS**: Application-specific styles in `src/assets/scss/`

### Responsive Design
- Mobile-first approach
- Breakpoints: 576px, 768px, 992px, 1200px
- Adaptive table layouts

## Best Practices

### Component Development
1. Use **standalone components** for new features
2. Extend `BaseListComponent` for list views
3. Use **reactive forms** for data entry
4. Implement **OnInit** lifecycle hook properly
5. Unsubscribe from observables in **ngOnDestroy**

### Service Layer
1. Centralize API calls in services
2. Use **RxJS operators** for data transformation
3. Handle errors gracefully
4. Implement loading states

### Form Validation
1. Use **Validators** from `@angular/forms`
2. Implement custom validators when needed
3. Display validation errors clearly
4. Disable submit until form is valid

### Performance
1. Use **OnPush** change detection where possible
2. Implement **trackBy** functions for *ngFor
3. Lazy load modules
4. Optimize bundle size

## Common Tasks

### Adding a New Module

```bash
# Generate module
ng generate module modules/new-feature --routing

# Generate components
ng generate component modules/new-feature/list --standalone
ng generate component modules/new-feature/entry --standalone

# Generate service
ng generate service modules/new-feature/new-feature
```

### Creating a List Component

```typescript
export class NewFeatureListComponent extends BaseListComponent {
  protected searchItems(): Observable<any> {
    return this.service.search(params);
  }

  protected getSearchParams(): SearchParams {
    return {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      // ... other params
    };
  }
}
```

## Troubleshooting

### Common Issues

#### 1. "Cannot find module '@angular/...'"
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. Build errors with strict mode
Check `tsconfig.json` and ensure all types are properly defined.

#### 3. API connection refused
- Verify backend is running on port 3000
- Check `environment.ts` apiUrl configuration
- Ensure CORS is enabled in backend

#### 4. Company/Branch data not loading
- Check localStorage for 'selected-company' and 'selected-branch'
- Verify user is logged in
- Check network tab for API calls

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Code Quality

### Linting
```bash
ng lint
```

### Format Code
```bash
# Using Prettier (if configured)
npm run format
```

## Deployment

### Build for Production

```bash
# Create production build
ng build --configuration production

# Output will be in dist/FreightForwarding/
```

### Deploy to Web Server

Copy contents of `dist/FreightForwarding/` to your web server's public directory.

**Important:** Configure web server for Angular routing:
- All routes should redirect to `index.html`
- Example nginx config:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Contributing

1. Create feature branch from `develop`
2. Make changes following code standards
3. Test thoroughly
4. Create pull request with description

## Documentation

- **Developer Guide**: `../JOURNAL_VOUCHER_DEVELOPER_GUIDE.md`
- **API Documentation**: Backend Swagger at `http://localhost:3000/api`
- **Project Guide**: `../CLAUDE.md`

## License

Proprietary - All rights reserved

## Support

For issues and support, contact the development team.

---

**Version:** 1.0.0
**Last Updated:** 2025-11-15
**Angular Version:** 17.x
