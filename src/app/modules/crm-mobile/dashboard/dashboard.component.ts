import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { RouterModule } from '@angular/router';
import { AppService } from 'src/app/service/app.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  isMobile: boolean = false;

  menuItems = [
    { name: 'Port Master', badge: null, link: '/master/port-master/list', category: 'nav-port-master' },
    { name: 'UOM Master', badge: null, link: '/master/uom-master/list', category: 'nav-uom-master' },
    { name: 'Organization', badge: null, link: '/master/organization/list', category: 'nav-customer-master' },
    { name: 'Country', badge: null, link: '/master/country/list', category: 'nav-country-list' },
    { name: 'State', badge: null, link: '/master/state/list', category: 'nav-state-list' },
    { name: 'Unit', badge: null, link: '/master/unit/list', category: 'nav-unit-list' },
    { name: 'Vessel', badge: null, link: '/master/vessel/list', category: 'nav-vessel-list' },
    { name: 'Zone', badge: null, link: '/master/zone/list', category: 'nav-zone-list' },
    { name: 'Tarrif', badge: null, link: '/master/tarrif/list', category: 'nav-tarrif-list' },
    { name: 'City', badge: null, link: '/master/city/list', category: 'nav-city-list' },
    { name: 'Department', badge: null, link: '/master/department/list', category: 'nav-department-list' },
    { name: 'Currency', badge: null, link: '/master/currency/list', category: 'nav-currency-list' },
    { name: 'Currency Exchange', badge: null, link: '/accounts/currency-exchange/list', category: 'nav-currency-exchange-list' },
    { name: 'Sector', badge: null, link: '/master/sector/list', category: 'nav-sector-list' },
    { name: 'Voyage', badge: null, link: '/master/voyage/list', category: 'nav-voyage-list' },
    { name: 'Commodity', badge: null, link: '/master/commodity/list', category: 'nav-commodity-list' },
    { name: 'Package', badge: null, link: '/master/package-type/list', category: 'nav-package-list' },
    // { name: 'Lead', badge: 99, link: '/crm/lead/list', category: 'nav-lead' },
    // { name: 'Calendar', badge: null, link: '/crm/calendar', category: 'nav-calendar' },
    // { name: 'Customer', badge: null, link: '/crm/customer', category: 'nav-customer' },
    // { name: 'To Do', badge: null, link: '/crm/todo', category: 'nav-todo' },
    // { name: 'Rate Request', badge: null, link: '/crm/rate-request/view', category: 'nav-rate-request' },
    // { name: 'Sailing Schedule', badge: null, link: '', category: 'nav-sailing-schedule' },
    // { name: 'Quotation', badge: null, link: 'quotation', category: 'nav-quotation' },
    // { name: 'Dues', badge: null, link: '', category: 'nav-dues' },
    // { name: 'Lead Analysis', badge: null, link: '', category: 'nav-lead-analysis' },
    // { name: 'CRM', badge: null, link: '', category: 'nav-crm' },
    // { name: 'Lead Schedule Pending', badge: null, link: '', category: 'nav-lead-schedule' },
  ];
  i: any;

  constructor(private appService: AppService) { }

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice()
  }

statCards = [
  {
    icon: 'fas fa-dollar-sign', // for Revenue
    amount: '$12,500',
    title: 'Revenue',
    bgColor: 'bg-primary',
  },
  {
    icon: 'fas fa-shopping-bag', // for Orders
    amount: '1,200',
    title: 'Orders',
    bgColor: 'bg-success',
  },
  {
    icon: 'fas fa-users', // for Customers
    amount: '750',
    title: 'Customers',
    bgColor: 'bg-warning',
  },
  {
    icon: 'fas fa-chart-line', // for Growth
    amount: '18%',
    title: 'Growth',
    bgColor: 'bg-danger',
  },
  {
    icon: 'fas fa-hand-holding-usd', // for Net Profit
    amount: '$85K',
    title: 'Net Profit',
    bgColor: 'bg-info',
  },
  {
    icon: 'fas fa-hand-holding-usd', // for Invoices
    amount: '3,400',
    title: 'Invoices',
    bgColor: 'bg-secondary',
  },
  {
    icon: 'fas fa-box', // for Shipments
    amount: '540',
    title: 'Shipments',
    bgColor: 'bg-dark',
  },
  {
    icon: 'fas fa-clock', // for On-Time Delivery
    amount: '98%',
    title: 'On-Time Delivery',
    bgColor: 'bg-success',
  },
];



  productsSummary = {
    count: 180,
    percentChange: 12.5,
    percentClass: 'bg-success text-white',
    profitInfo: 'Total sales increased by 12.5% from last quarter.',
  };

  visitFromUSA = [
    { city: 'New York', percent: 25, badgeColor: 'bg-primary' },
    { city: 'Los Angeles', percent: 20, badgeColor: 'bg-success' },
    { city: 'Chicago', percent: 18, badgeColor: 'bg-danger' },
    { city: 'Houston', percent: 15, badgeColor: 'bg-warning' },
    { city: 'Phoenix', percent: 12, badgeColor: 'bg-info' },
    { city: 'Philadelphia', percent: 10, badgeColor: 'bg-secondary' },
    { city: 'San Antonio', percent: 9, badgeColor: 'bg-dark' },
    { city: 'San Diego', percent: 8, badgeColor: 'bg-primary' },
    { city: 'Dallas', percent: 7, badgeColor: 'bg-success' },
    { city: 'San Jose', percent: 6, badgeColor: 'bg-danger' },
  ];

  getProductStatusBadge(status: string): string {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-success';
      case 'limited':
        return 'bg-warning';
      case 'out of stock':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getReviewStatusBadge(status: string): string {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-success';
      case 'pending':
        return 'bg-warning';
      case 'rejected':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  topProducts = [
    {
      product: 'iPhone 14 Pro',
      category: 'Smartphone',
      price: '$999',
      stock: 120,
      sold: 80,
      revenue: '$79,920',
      rating: '4.8',
      brand: 'Apple',
      supplier: 'Tech Distributors',
      warehouse: 'California',
      status: 'Available',
      remarks: 'Top seller',
    },
    {
      product: 'Samsung QLED TV',
      category: 'Electronics',
      price: '$1,200',
      stock: 50,
      sold: 35,
      revenue: '$42,000',
      rating: '4.6',
      brand: 'Samsung',
      supplier: 'Vision Supplies',
      warehouse: 'Texas',
      status: 'out of stock',
      remarks: 'High demand',
    },
    {
      product: 'Nike Air Max',
      category: 'Footwear',
      price: '$180',
      stock: 200,
      sold: 150,
      revenue: '$27,000',
      rating: '4.9',
      brand: 'Nike',
      supplier: 'Sporty Inc.',
      warehouse: 'Florida',
      status: 'Available',
      remarks: 'Fast moving',
    },
    {
      product: 'Samsung QLED TV',
      category: 'Electronics',
      price: '$1,200',
      stock: 50,
      sold: 35,
      revenue: '$42,000',
      rating: '4.6',
      brand: 'Samsung',
      supplier: 'Vision Supplies',
      warehouse: 'Texas',
      status: 'out of stock',
      remarks: 'High demand',
    },
    {
      product: 'Nike Air Max',
      category: 'Footwear',
      price: '$180',
      stock: 200,
      sold: 150,
      revenue: '$27,000',
      rating: '4.9',
      brand: 'Nike',
      supplier: 'Sporty Inc.',
      warehouse: 'Florida',
      status: 'Available',
      remarks: 'Fast moving',
    },
  ];

  customerReviews = [
    {
      customer: 'John Doe',
      product: 'iPhone 14 Pro',
      review: 'Amazing device!',
      rating: '5',
      date: '2025-05-01',
      status: 'Published',
      remarks: 'Verified',
    },
    {
      customer: 'Alice Smith',
      product: 'Samsung QLED TV',
      review: 'Great colors.',
      rating: '4.7',
      date: '2025-04-28',
      status: 'Published',
      remarks: 'Frequent buyer',
    },
    {
      customer: 'Michael Johnson',
      product: 'Nike Air Max',
      review: 'Super comfortable.',
      rating: '4.9',
      date: '2025-04-20',
      status: 'Pending',
      remarks: 'New user',
    },
    {
      customer: 'Emily Clark',
      product: 'MacBook Air',
      review: 'Very sleek!',
      rating: '4.8',
      date: '2025-04-19',
      status: 'rejected',
      remarks: 'Top reviewer',
    },
    {
      customer: 'Daniel Lee',
      product: 'Sony Headphones',
      review: 'Excellent sound quality.',
      rating: '4.6',
      date: '2025-04-17',
      status: 'Published',
      remarks: 'Music lover',
    },
    {
      customer: 'Sophia Turner',
      product: 'Dell XPS 13',
      review: 'Performance beast.',
      rating: '4.9',
      date: '2025-04-15',
      status: 'Pending',
      remarks: 'Tech enthusiast',
    },
    {
      customer: 'Michael Johnson',
      product: 'Nike Air Max',
      review: 'Super comfortable.',
      rating: '4.9',
      date: '2025-04-20',
      status: 'Pending',
      remarks: 'New user',
    },
    {
      customer: 'Emily Clark',
      product: 'MacBook Air',
      review: 'Very sleek!',
      rating: '4.8',
      date: '2025-04-19',
      status: 'rejected',
      remarks: 'Top reviewer',
    },
    {
      customer: 'Daniel Lee',
      product: 'Sony Headphones',
      review: 'Excellent sound quality.',
      rating: '4.6',
      date: '2025-04-17',
      status: 'Published',
      remarks: 'Music lover',
    },
    {
      customer: 'Sophia Turner',
      product: 'Dell XPS 13',
      review: 'Performance beast.',
      rating: '4.9',
      date: '2025-04-15',
      status: 'Pending',
      remarks: 'Tech enthusiast',
    },
  ];
}



