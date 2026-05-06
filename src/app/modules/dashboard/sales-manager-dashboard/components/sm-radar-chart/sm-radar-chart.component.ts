import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ScoreboardRow } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-radar-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './sm-radar-chart.component.html'
})
export class SmRadarChartComponent implements OnChanges {
  @Input() scoreboard: ScoreboardRow[] = [];

  person1Id: number | null = null;
  person2Id: number | null = null;
  chartOptions: any = {
    series: [],
    chart: { type: 'radar', height: 350, width: '100%', toolbar: { show: false } },
    colors: ['#DC2626', '#3B82F6'],
    xaxis: { categories: [] },
    yaxis: { show: false },
    stroke: { width: 2 },
    fill: { opacity: 0.2 },
    markers: { size: 4 },
    legend: { position: 'bottom' },
    tooltip: { enabled: true }
  };

  private categories = [
    'Leads\nNo Meeting',
    'Meetings\nScheduled',
    'Follow-Ups\nPending',
    'Not\nConverted',
    'No Quote',
    'Enquiry\nNo Quote',
    'Quote\nPending',
    'Approved\nNo Booking'
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['scoreboard'] && this.scoreboard?.length >= 2) {
      this.person1Id = this.scoreboard[0]?.UserMasterSid;
      this.person2Id = this.scoreboard[1]?.UserMasterSid;
      this.buildChart();
    }
  }

  onPerson1Change() {
    // If person2 is the same as person1, automatically change person2
    if (this.person1Id === this.person2Id) {
      const firstAvailable = this.scoreboard.find(sp => sp.UserMasterSid !== this.person1Id);
      if (firstAvailable) {
        this.person2Id = firstAvailable.UserMasterSid;
      }
    }
    this.buildChart();
  }

  onSelectionChange() {
    this.buildChart();
  }

  getPerson1Name(): string {
    const p1 = this.scoreboard.find(s => s.UserMasterSid === this.person1Id);
    return p1?.userName || '';
  }

  getPerson2Name(): string {
    const p2 = this.scoreboard.find(s => s.UserMasterSid === this.person2Id);
    return p2?.userName || '';
  }

  getFilteredSalespersons(): ScoreboardRow[] {
    return this.scoreboard.filter(sp => sp.UserMasterSid !== this.person1Id);
  }

  private buildChart() {
    const p1 = this.scoreboard.find(s => s.UserMasterSid === this.person1Id);
    const p2 = this.scoreboard.find(s => s.UserMasterSid === this.person2Id);
    
    if (!p1 || !p2) return;

    console.log('Building chart with:', {
      p1: p1.userName,
      p1Data: [p1.s1, p1.s2, p1.s3, p1.s4, p1.s5, p1.s6, p1.s7, p1.s8],
      p2: p2.userName,
      p2Data: [p2.s1, p2.s2, p2.s3, p2.s4, p2.s5, p2.s6, p2.s7, p2.s8]
    });

    this.chartOptions = {
      series: [
        { 
          name: p1.userName, 
          data: [p1.s1, p1.s2, p1.s3, p1.s4, p1.s5, p1.s6, p1.s7, p1.s8]
        },
        { 
          name: p2.userName, 
          data: [p2.s1, p2.s2, p2.s3, p2.s4, p2.s5, p2.s6, p2.s7, p2.s8]
        }
      ],
      chart: { 
        type: 'radar', 
        height: 350, 
        width: '100%', 
        toolbar: { show: false },
        background: 'transparent'
      },
      colors: ['#DC2626', '#3B82F6'],
      xaxis: { 
        categories: this.categories, 
        labels: { 
          style: { 
            fontSize: '10px',
            fontWeight: 500, 
            colors: '#475569' 
          },
          show: true
        } 
      },
      yaxis: { 
        show: false,
        min: 0
      },
      stroke: { 
        width: 2,
        curve: 'smooth'
      },
      fill: { 
        opacity: 0.2,
        type: 'solid'
      },
      markers: { 
        size: 4,
        strokeWidth: 2,
        strokeColors: ['#ffffff', '#ffffff'],
        hover: { size: 6 }
      },
      legend: { 
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '11px',
        fontWeight: 500,
        markers: { 
          width: 10, 
          height: 10, 
          radius: 10,
          strokeWidth: 1
        },
        itemMargin: { horizontal: 12, vertical: 4 }
      },
      tooltip: { 
        y: { 
          formatter: (val: number, { dataPointIndex }: any) => {
            const metric = this.categories[dataPointIndex]?.replace('\n', ' ') || '';
            return `${val} ${metric.toLowerCase()}`;
          }
        } 
      }
    };
  }
}