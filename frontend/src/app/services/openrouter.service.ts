// src/app/services/openrouter.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment1';

interface ChatMsg  { role: 'system' | 'user'; content: string }
interface ChatReq  { model: string; messages: ChatMsg[]; temperature?: number }
interface ChatResp { choices: { message: { content: string } }[] }

@Injectable({ providedIn: 'root' })
export class OpenrouterService {
  private url     = `${environment.openRouterBaseUrl}/chat/completions`;
  private headers = new HttpHeaders({
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${environment.openRouterApiKey}`,
    // en option, pour le leaderboard OpenRouter :
    'HTTP-Referer':  window.location.origin,
    'X-Title':       document.title
  });

  constructor(private http: HttpClient) {}

  summarizeDiscussion(text: string): Observable<string> {
    const body: ChatReq = {
      model: 'deepseek/deepseek-r1:free',
      messages: [
        { role: 'system', content: 'Tu es un assistant qui résume les discussions.' },
        { role: 'user',   content: text }
      ],
      temperature: 0.2
    };

    return this.http
      .post<ChatResp>(this.url, body, { headers: this.headers })
      .pipe(
        map(r => r.choices[0].message.content.trim())
      );
  }
}
