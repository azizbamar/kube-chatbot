import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ChatService } from '../core/chat.service';
import { MarkdownPipe } from '../shared/markdown.pipe';
import { CodeHighlightDirective } from '../shared/code-highlight.directive';
import { CopyButtonComponent } from '../shared/copy-button.component';
import { ChatMessage } from '../core/types';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, MarkdownPipe, CodeHighlightDirective, CopyButtonComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements AfterViewChecked {
  private chat = inject(ChatService);

  @ViewChild('scrollMe') private scrollContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef<HTMLTextAreaElement>;

  input = signal('');
  typing = signal(false);
  isOnline = signal(true);
  
  messages = signal<ChatMessage[]>([{
    id: crypto.randomUUID(),
    fromUser: false,
    content: '👋 Welcome! I\'m your Docker & Kubernetes assistant. I can help you with:\n\n• Container management and troubleshooting\n• Kubernetes cluster operations\n• YAML configuration files\n• Best practices and optimization\n\nTry asking me something like "How do I scale a deployment?" or paste your kubectl/docker commands!',
    createdAt: Date.now(),
  }]);

  // Command suggestions for the interface
  suggestions = [
    'kubectl get pods',
    'docker ps',
    'How do I debug a crashloop?',
    'Show me a deployment YAML',
    'kubectl logs troubleshooting',
    'docker container optimization'
  ];

  canSend = computed(() => !!this.input().trim() && !this.typing());
  
  // Computed property for displaying messages with proper styling classes
  displayMessages = computed(() => {
    return this.messages().map(msg => ({
      ...msg,
      cssClass: msg.fromUser ? 'user' : 'bot',
      timestamp: this.formatTimestamp(msg.createdAt)
    }));
  });

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  onSend() {
    if (!this.canSend()) return;
    
    const text = this.input().trim();
    this.input.set('');
    this.resetTextareaHeight();

    // Add user message
    const userMsg: ChatMessage = { 
      id: crypto.randomUUID(), 
      fromUser: true, 
      content: text, 
      createdAt: Date.now() 
    };
    this.messages.update(m => [...m, userMsg]);

    // Set typing state
    this.typing.set(true);
    
    // Call your chat service
    this.chat.send(text).subscribe({
      next: (reply: string) => {
        const assistantMsg: ChatMessage = { 
          id: crypto.randomUUID(), 
          fromUser: false, 
          content: reply, 
          createdAt: Date.now() 
        };
        this.messages.update(m => [...m, assistantMsg]);
        this.typing.set(false);
      },
      error: (error) => {
        console.error('Chat service error:', error);
        const errorMsg: ChatMessage = { 
          id: crypto.randomUUID(), 
          fromUser: false, 
          content: '❌ Sorry, I encountered an error while processing your request. Please try again.', 
          createdAt: Date.now() 
        };
        this.messages.update(m => [...m, errorMsg]);
        this.typing.set(false);
      }
    });
  }

  // Handle Enter key press (Send on Enter, new line on Shift+Enter)
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  // Handle input changes and auto-resize textarea
  onInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.input.set(target.value);
    this.autoResizeTextarea(target);
  }

  // Insert suggestion into input
  insertSuggestion(suggestion: string) {
    this.input.set(suggestion);
    this.messageInput.nativeElement.focus();
    // Auto-resize after inserting suggestion
    setTimeout(() => {
      this.autoResizeTextarea(this.messageInput.nativeElement);
    }, 0);
  }

  // Auto-resize textarea based on content
  private autoResizeTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120); // Max height of 120px
    textarea.style.height = newHeight + 'px';
  }

  // Reset textarea height
  private resetTextareaHeight() {
    if (this.messageInput) {
      this.messageInput.nativeElement.style.height = 'auto';
    }
  }

  // Scroll to bottom of messages
  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.warn('Could not scroll to bottom:', err);
    }
  }

  // Format timestamp for display
  private formatTimestamp(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) { // Less than 1 minute
      return 'just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  }

  // Get copy candidate for commands (your existing method)
  copyCandidate(msg: ChatMessage): string | null {
    const line = msg.content.trim().split('\n').find(l => 
      l.startsWith('kubectl ') || 
      l.startsWith('docker ') || 
      l.startsWith('helm ') ||
      l.startsWith('k9s ') ||
      l.startsWith('minikube ')
    );
    return line || null;
  }

  // Check if message contains code blocks
  hasCodeBlock(content: string): boolean {
    return content.includes('```') || content.includes('`kubectl') || content.includes('`docker');
  }

  // Extract commands from message for quick copy
  getCommands(content: string): string[] {
    const commands: string[] = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('kubectl ') || 
          trimmed.startsWith('docker ') || 
          trimmed.startsWith('helm ') ||
          trimmed.startsWith('k9s ') ||
          trimmed.startsWith('minikube ')) {
        commands.push(trimmed);
      }
    });
    
    return commands;
  }

  // Clear chat history
  clearChat() {
    this.messages.set([{
      id: crypto.randomUUID(),
      fromUser: false,
      content: '👋 Chat cleared! How can I help you with Docker and Kubernetes today?',
      createdAt: Date.now(),
    }]);
  }

  // Export chat history
  exportChat() {
    const chatData = {
      exportDate: new Date().toISOString(),
      messages: this.messages().map(msg => ({
        from: msg.fromUser ? 'User' : 'Assistant',
        content: msg.content,
        timestamp: new Date(msg.createdAt).toISOString()
      }))
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `docker-k8s-chat-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Connection status simulation (you can connect this to actual service status)
  checkConnection() {
    // You can implement actual connection checking logic here
    // For now, we'll simulate it
    this.isOnline.set(false);
    setTimeout(() => {
      this.isOnline.set(true);
    }, 2000);
  }
}