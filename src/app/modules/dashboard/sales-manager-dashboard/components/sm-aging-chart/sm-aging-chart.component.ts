import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { AgingRow } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-aging-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './sm-aging-chart.component.html',
  styleUrls: ['./sm-aging-chart.component.scss']
})
export class SmAgingChartComponent implements OnChanges {
  @Input() data: AgingRow[] = [];

  chartOptions: any = {};

  ngOnChanges() {
    if (!this.data?.length) return;
    this.chartOptions = {
      series: [
        { name: '0-7 days', data: this.data.map(d => d.days0to7) },
        { name: '8-30 days', data: this.data.map(d => d.days8to30) },
        { name: '31-60 days', data: this.data.map(d => d.days31to60) },
        { name: '60+ days', data: this.data.map(d => d.days60plus) },
      ],
      chart: { type: 'bar', height: Math.min(350, Math.max(220, this.data.length * 50)), stacked: true, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
      plotOptions: { bar: { horizontal: true, borderRadius: 3, barHeight: '65%' } },
      colors: ['#16a34a', '#f59e0b', '#f97316', '#ef4444'],
      xaxis: {
        categories: this.data.map(d => d.userName),
        labels: { style: { fontSize: '11px', colors: '#94a3b8' } }
      },
      yaxis: { labels: { style: { fontSize: '12px', fontWeight: 500, colors: '#334155' } } },
      legend: {
        position: 'top', fontSize: '12px',
        markers: { width: 10, height: 10, radius: 3 }
      },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f5f9' },
      tooltip: { y: { formatter: (val: number) => `${val} leads` } }
    };
  }
}
