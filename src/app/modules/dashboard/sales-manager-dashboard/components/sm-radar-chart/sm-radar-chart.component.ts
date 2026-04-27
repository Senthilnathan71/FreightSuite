import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ScoreboardRow, SalespersonInfo } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-radar-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './sm-radar-chart.component.html',
  styleUrls: ['./sm-radar-chart.component.scss']
})
export class SmRadarChartComponent implements OnChanges {
  @Input() scoreboard: ScoreboardRow[] = [];

  person1Id: number | null = null;
  person2Id: number | null = null;
  chartOptions: any = {};

  private categories = ['Leads', 'Meetings', 'Follow-Ups', 'Not Conv.', 'Quote', 'Enq', 'Pending', 'No Booking'];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['scoreboard'] && this.scoreboard?.length >= 2) {
      this.person1Id = this.scoreboard[0]?.UserMasterSid;
      this.person2Id = this.scoreboard[1]?.UserMasterSid;
      this.buildChart();
    }
  }

  onSelectionChange() {
    this.buildChart();
  }

  private buildChart() {
    const p1 = this.scoreboard.find(s => s.UserMasterSid === this.person1Id);
    const p2 = this.scoreboard.find(s => s.UserMasterSid === this.person2Id);
    if (!p1 || !p2) return;

    this.chartOptions = {
      series: [
        { name: p1.userName, data: [p1.s1, p1.s2, p1.s3, p1.s4, p1.s5, p1.s6, p1.s7, p1.s8] },
        { name: p2.userName, data: [p2.s1, p2.s2, p2.s3, p2.s4, p2.s5, p2.s6, p2.s7, p2.s8] }
      ],
      chart: { type: 'radar', height: '100%', width: '100%', toolbar: { show: false }},
      colors: ['#0f766e', '#6366f1'],
      xaxis: { categories: this.categories, labels: { style: { fontSize: '11px', colors: '#64748b' } } },
      yaxis: { show: false },
      stroke: { width: 2 },
      fill: { opacity: 0.15 },
      markers: { size: 3 },
      legend: { position: 'top', fontSize: '12px', markers: { width: 10, height: 10, radius: 3 } },
      tooltip: { y: { formatter: (val: number) => `${val} items` } }
    };
  }
}
