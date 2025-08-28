import { Component, Input } from '@angular/core';

@Component({
  selector: 'copy-button',
  standalone: true,
  template: `<button class="copy" (click)="copy()">Copy</button>`,
  styles: [`
    .copy {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 4px 10px;
      cursor: pointer;
      background: #f7f7f7;
      font-size: 0.85rem;
    }
    .copy:hover {
      background: #e5e7eb;
    }
  `]
})
export class CopyButtonComponent {
  @Input() text = '';

  async copy() {
    try {
      await navigator.clipboard.writeText(this.text);
    } catch {
      console.error('Copy failed');
    }
  }
}
