import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { HeatmapSeries } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-heatmap-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './sm-heatmap-chart.component.html',
  styleUrls: ['./sm-heatmap-chart.component.scss']
})
export class SmHeatmapChartComponent implements OnChanges {
  @Input() data: HeatmapSeries[] = [];

  chartOptions: any = {};

  ngOnChanges() {
    if (!this.data?.length) return;
    this.chartOptions = {
      series: this.data.map(d => ({ name: d.userName, data: d.data })),
      chart: { type: 'heatmap', height: Math.max(200, this.data.length * 45), toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.5,
          radius: 4,
          colorScale: {
            ranges: [
              { from: 0, to: 0, name: 'None', color: '#f1f5f9' },
              { from: 1, to: 5, name: 'Low', color: '#bae6fd' },
              { from: 6, to: 10, name: 'Medium', color: '#38bdf8' },
              { from: 11, to: 20, name: 'High', color: '#0284c7' },
              { from: 21, to: 100, name: 'Critical', color: '#075985' },
            ]
          }
        }
      },
      dataLabels: { enabled: true, style: { fontSize: '11px', colors: ['#1e293b'] } },
      xaxis: { labels: { style: { fontSize: '10px', colors: '#64748b' } } },
      yaxis: { labels: { style: { fontSize: '12px', fontWeight: 500, colors: '#334155' } } },
      grid: { padding: { right: 20 } },
      tooltip: { y: { formatter: (val: number) => `${val} items` } }
    };
  }
}
