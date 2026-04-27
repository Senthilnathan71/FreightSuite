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

  private readonly palette = [
    '#05608D',
    '#06b6d4',
    '#f59e0b',
    '#16a34a',
    '#f97316',
    '#8b5cf6',
    '#ec4899',
    '#0ea5a4',
    '#dc2626',
    '#64748b',
    '#84cc16',
    '#14b8a6',
  ];

  ngOnChanges() {
    const normalizedData = (this.data || [])
      .map((item) => ({
        source: item.source || 'Unknown',
        count: item.count || 0,
      }))
      .sort((left, right) => right.count - left.count);

    const hasData = normalizedData.length > 0;
    const chartData = hasData
      ? normalizedData
      : [{ source: 'NoData', count: 1 }];
    const totalLeads = normalizedData.reduce((sum, item) => sum + item.count, 0);
    const colors = chartData.map((item, index) =>
      item.source === 'NoData' ? '#cbd5e1' : this.palette[index % this.palette.length]
    );

    this.chartOptions = {
      series: chartData.map((item) => item.count),
      chart: { type: 'donut', height: 300, fontFamily: 'Inter, sans-serif' },
      labels: chartData.map((item) => item.source === 'NoData' ? 'No data' : item.source),
      colors,
      legend: {
        position: 'right',
        fontSize: '11px',
        fontWeight: 500,
        labels: { colors: '#475569' },
        markers: { width: 10, height: 10, radius: 3 },
        itemMargin: { vertical: 2 }
      },
      dataLabels: {
        enabled: hasData,
        style: {
          fontSize: '11px',
          fontWeight: 700,
          colors: colors.map((color) => this.getReadableTextColor(color)),
        },
        dropShadow: { enabled: false },
      },
      plotOptions: {
        pie: {
          donut: {
            background: '#0d4f74',
            size: '62%',
            labels: {
              show: true,
              name: {
                fontSize: '12px',
                fontWeight: 700,
                color: '#ffffff',
              },
              value: {
                fontSize: '18px',
                fontWeight: 800,
                color: '#ffffff',
                formatter: (value: string) => hasData ? value : '0',
              },
              total: {
                show: true,
                label: hasData ? 'Total Leads' : 'No source data',
                fontSize: '11px',
                fontWeight: 700,
                color: '#ffffff',
                formatter: () => `${totalLeads}`,
              },
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

  private getReadableTextColor(color: string): string {
    const normalized = color.replace('#', '');
    const value = normalized.length === 3
      ? normalized.split('').map((char) => char + char).join('')
      : normalized;
    const red = parseInt(value.slice(0, 2), 16);
    const green = parseInt(value.slice(2, 4), 16);
    const blue = parseInt(value.slice(4, 6), 16);
    const luminance = (0.299 * red) + (0.587 * green) + (0.114 * blue);

    return luminance > 160 ? '#0f172a' : '#ffffff';
  }
}
