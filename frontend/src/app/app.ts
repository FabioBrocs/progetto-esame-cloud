import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Data } from './services/data';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './app.html', 
  styleUrls: ['./app.scss']
})
export class App {
  isLoginMode = true;

  datiForm = { username: '', password: '' };

  idUtenteLoggato: number | null = null;
  listaNote: any[] = [];
  nuovaNotaTesto = '';
  messaggioEsito = '';
  utenteLoggato: string | null = null;

  constructor(
    private data: Data, 
    private cdr: ChangeDetectorRef 
  ) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.messaggioEsito = '';
    this.datiForm = { username: '', password: '' };
  }


  async onSubmit() {
    this.messaggioEsito = '';
    
    try {
        if (this.isLoginMode) {
            const res = await this.data.login(this.datiForm);        
            this.utenteLoggato = res.utente;
            this.idUtenteLoggato = res.idUtente; 
            this.messaggioEsito = "Login effettuato con successo!";
            await this.caricaNote();
        } 
        else { 
            await this.data.registraUtente(this.datiForm);
            this.messaggioEsito = "Registrazione riuscita! Inserisci di nuovo la password per accedere.";
            
            this.isLoginMode = true; 
            this.datiForm.password = ''; 
        }
    } catch (error: any) {
        console.error("Errore durante l'operazione:", error);
        this.messaggioEsito = error.error?.errore || "Errore di comunicazione con il server";
    } finally {
        this.cdr.detectChanges(); 
    }
}

  async caricaNote() {
    if (this.idUtenteLoggato) {
      this.listaNote = await this.data.getNote(this.idUtenteLoggato);
      this.cdr.detectChanges();
    }
  }

  async inviaNota() {
    if (!this.idUtenteLoggato || !this.nuovaNotaTesto) {
        console.warn("Dati mancanti per l'invio!");
        return;
    }

    try {
        const res = await this.data.aggiungiNota(this.idUtenteLoggato, this.nuovaNotaTesto);
        
        this.nuovaNotaTesto = '';
        this.messaggioEsito = "Nota salvata con successo!";
        
        await this.caricaNote();
        this.cdr.detectChanges();
    } catch (error: any) {
        console.error("Errore durante l'invio della nota:", error);
        this.messaggioEsito = "Errore nel salvataggio della nota.";
        this.cdr.detectChanges();
    }
}


  logout() {
    this.utenteLoggato = null;
    this.messaggioEsito = "Sessione chiusa.";
    this.cdr.detectChanges();
  }
}
