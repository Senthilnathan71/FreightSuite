import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ResponseTimeMetric } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-response-times',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './sm-response-times.component.html',
  styleUrls: ['./sm-response-times.component.scss']
})
export class SmResponseTimesComponent implements OnChanges {
  @Input() data: ResponseTimeMetric[] = [];

  gauges: { label: string; value: number; color: string; chartOptions: any }[] = [];

  ngOnChanges() {
    if (!this.data?.length) return;
    const avgLM = this.average(this.data.map(d => d.avgLeadToMeeting));
    const avgLC = this.average(this.data.map(d => d.avgLeadToCustomer));
    const avgQA = this.average(this.data.map(d => d.avgQuoteToApproval));

    this.gauges = [
      { label: 'Lead to Meeting', value: avgLM, color: '#06b6d4', chartOptions: this.buildGauge(avgLM, 30, '#06b6d4') },
      { label: 'Lead to Customer', value: avgLC, color: '#8b5cf6', chartOptions: this.buildGauge(avgLC, 90, '#8b5cf6') },
      { label: 'Quote to Approval', value: avgQA, color: '#f59e0b', chartOptions: this.buildGauge(avgQA, 30, '#f59e0b') },
    ];
  }

  private average(nums: number[]): number {
    const valid = nums.filter(n => n > 0);
    return valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 : 0;
  }

  private buildGauge(value: number, maxDays: number, color: string): any {
    const pct = Math.min(100, Math.round((value / maxDays) * 100));
    return {
      series: [pct],
      chart: { type: 'radialBar', height: 180, sparkline: { enabled: true } },
      colors: [color],
      plotOptions: {
        radialBar: {
          startAngle: -135, endAngle: 135,
          hollow: { size: '60%' },
          track: { background: '#f1f5f9', strokeWidth: '100%' },
          dataLabels: {
            name: { show: false },
            value: {
              show: true, fontSize: '20px', fontWeight: 700, color: '#0f172a',
              formatter: () => `${value}d`
            }
          }
        }
      }
    };
  }
}
