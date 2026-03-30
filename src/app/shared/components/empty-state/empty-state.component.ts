import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  @Input() title: string = 'No results found';
  @Input() description: string = 'Try adjusting your search or filters to find what you are looking for.';
  @Input() hasAction: boolean = false;
}
