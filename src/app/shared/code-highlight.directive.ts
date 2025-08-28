import { AfterViewInit, Directive, ElementRef } from '@angular/core';
import hljs from 'highlight.js/lib/common';

@Directive({ selector: '[codeHighlight]', standalone: true })
export class CodeHighlightDirective implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    const blocks: NodeListOf<HTMLElement> =
      this.el.nativeElement.querySelectorAll('pre code');
    blocks.forEach((block) => hljs.highlightElement(block));
  }
}
