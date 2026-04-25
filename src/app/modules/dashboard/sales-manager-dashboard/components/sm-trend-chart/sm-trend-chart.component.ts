import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { WeeklyTrendPoint } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-trend-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './sm-trend-chart.component.html',
  styleUrls: ['./sm-trend-chart.component.scss']
})
export class SmTrendChartComponent implements OnChanges {
  @Input() data: WeeklyTrendPoint[] = [];

  chartOptions: any = {};

  ngOnChanges() {
    if (!this.data?.length) return;
    const categories = this.data.map(d => {
      const date = new Date(d.weekStart);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    this.chartOptions = {
      series: [
        { name: 'New Leads', data: this.data.map(d => d.newLeads) },
        { name: 'Meetings', data: this.data.map(d => d.meetings) },
        { name: 'Conversions', data: this.data.map(d => d.conversions) }
      ],
      chart: {
        type: 'area', height: 280, toolbar: { show: false }, fontFamily: 'Inter, sans-serif',
        zoom: { enabled: false }
      },
      colors: ['#8b5cf6', '#06b6d4', '#16a34a'],
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05, stops: [0, 90, 100] }
      },
      xaxis: {
        categories,
        labels: { style: { fontSize: '11px', colors: '#94a3b8' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: { style: { fontSize: '11px', colors: '#94a3b8' } }
      },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
      legend: {
        position: 'top', horizontalAlign: 'right', fontSize: '12px',
        markers: { width: 10, height: 10, radius: 3 }
      },
      tooltip: { shared: true, intersect: false },
      dataLabels: { enabled: false }
    };
  }
}
