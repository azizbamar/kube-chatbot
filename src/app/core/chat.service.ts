import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ChatRequest, ChatResponse } from './types';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class ChatService {
private http = inject(HttpClient);
private base = environment.apiBaseUrl;


send(message: string): Observable<string> {
return this.http.post<ChatResponse>(`${this.base}/api/chat`, { message }).pipe(
map(res => res.reply)
);
}
}