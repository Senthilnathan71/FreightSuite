import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FunnelData } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-funnel-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './sm-funnel-chart.component.html',
  styleUrls: ['./sm-funnel-chart.component.scss']
})
export class SmFunnelChartComponent implements OnChanges {
  @Input() data: FunnelData | null = null;

  chartOptions: any = {};

  ngOnChanges() {
    if (!this.data) return;
    const d = this.data;
    const categories = ['Leads Created', 'Meetings Held', 'Converted to Customer', 'Quote Created', 'Quote Approved', 'Booking Created'];
    const values = [d.leadsCreated, d.meetingsHeld, d.convertedToCustomer, d.quoteCreated, d.quoteApproved, d.bookingCreated];
    const colors = ['#0f766e', '#14b8a6', '#5eead4', '#6366f1', '#f59e0b', '#16a34a'];

    this.chartOptions = {
      series: [{ name: 'Count', data: values }],
      chart: { type: 'bar', height: 240, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
      plotOptions: {
        bar: { horizontal: true, distributed: true, borderRadius: 6, barHeight: '70%' }
      },
      colors,
      dataLabels: {
        enabled: true, style: { fontSize: '12px', fontWeight: 700, colors: ['#fff'] },
        formatter: (val: number) => val > 0 ? val.toString() : ''
      },
      xaxis: { categories, labels: { style: { fontSize: '12px', colors: '#64748b' } } },
      yaxis: { labels: { style: { fontSize: '12px', fontWeight: 500, colors: '#334155' } } },
      tooltip: {
        y: {
          formatter: (val: number) => {
            const pct = d.leadsCreated > 0 ? ((val / d.leadsCreated) * 100).toFixed(1) : '0';
            return `${val} (${pct}% of leads)`;
          }
        }
      },
      grid: { borderColor: '#e2e8f0', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      legend: { show: false }
    };
  }
}
