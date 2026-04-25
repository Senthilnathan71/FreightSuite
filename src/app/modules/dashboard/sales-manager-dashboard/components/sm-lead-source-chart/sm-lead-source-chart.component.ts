import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LeadSourceItem } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-lead-source-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './sm-lead-source-chart.component.html',
  styleUrls: ['./sm-lead-source-chart.component.scss']
})
export class SmLeadSourceChartComponent implements OnChanges {
  @Input() data: LeadSourceItem[] = [];

  chartOptions: any = {};

  private colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#4f46e5', '#16a34a', '#ef4444', '#f97316', '#0d9488', '#6366f1', '#a855f7', '#14b8a6'];

  ngOnChanges() {
    if (!this.data?.length) return;
    this.chartOptions = {
      series: this.data.map(d => d.count),
      chart: { type: 'donut', height: 280, fontFamily: 'Inter, sans-serif' },
      labels: this.data.map(d => d.source),
      colors: this.colors.slice(0, this.data.length),
      legend: {
        position: 'right', fontSize: '12px', fontWeight: 500,
        labels: { colors: '#475569' },
        markers: { width: 10, height: 10, radius: 3 }
      },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: true,
              total: {
                show: true, label: 'Total Leads', fontSize: '12px', color: '#94a3b8',
                formatter: (w: any) => w.globals.spikeWidth ? '' : w.globals.series.reduce((a: number, b: number) => a + b, 0).toString()
              }
            }
          }
        }
      },
      tooltip: {
        y: { formatter: (val: number) => `${val} leads` }
      },
      stroke: { width: 2, colors: ['#fff'] }
    };
  }
}
