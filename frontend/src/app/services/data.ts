import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Data {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  async registraUtente(dati: any) {
    const chiamata = this.http.post<any>(`${this.apiUrl}/api/registrazione`, dati);
    return await lastValueFrom(chiamata);
  }

  async login(dati: any) {
    const chiamata = this.http.post<any>(`${this.apiUrl}/api/login`, dati);
    return await lastValueFrom(chiamata);
  }

  async getNote(utenteId: number) {
    const chiamata = this.http.get<any[]>(`${this.apiUrl}/api/note/${utenteId}`);
    return await lastValueFrom(chiamata);
  }

  async aggiungiNota(utenteId: number, contenuto: string) {
    const chiamata = this.http.post<any>(`${this.apiUrl}/api/note`, { utenteId, contenuto });
    return await lastValueFrom(chiamata);
  }

  async cancellaNota(notaId: number) {
    const chiamata = this.http.delete<any>(`${this.apiUrl}/api/note/${notaId}`);
    return await lastValueFrom(chiamata);
}

}