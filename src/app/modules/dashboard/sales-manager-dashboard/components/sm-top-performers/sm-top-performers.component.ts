import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScoreboardRow } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-top-performers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sm-top-performers.component.html',
  styleUrls: ['./sm-top-performers.component.scss']
})
export class SmTopPerformersComponent implements OnChanges {
  @Input() scoreboard: ScoreboardRow[] = [];
  @Output() performerClicked = new EventEmitter<ScoreboardRow>(); 

  topPerformers: { row: ScoreboardRow; initials: string; rank: number }[] = [];

  ngOnChanges() {
    if (!this.scoreboard?.length) {
      this.topPerformers = [];
      return;
    }
    this.topPerformers = [...this.scoreboard]
      .sort((a, b) => b.total - a.total)
      .slice(0, 4)
      .map((row, i) => ({
        row,
        initials: row.userName?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '',
        rank: i + 1
      }));
  }

  getRankIcon(rank: number): string {
    switch (rank) {
      case 1: return 'fas fa-trophy';
      case 2: return 'fas fa-medal';
      case 3: return 'fas fa-award';
      default: return 'fas fa-star';
    }
  }

  getRankColor(rank: number): string {
    switch (rank) {
      case 1: return '#E9B949';
      case 2: return '#B7BFC7';
      case 3: return '#CD7F32';
      default: return '#0B6A7A';
    }
  }
  
  onPerformerClick(performer: { row: ScoreboardRow; initials: string; rank: number }) {
    this.performerClicked.emit(performer.row);
  }
}
