import {
  Component,
  inject,
  signal,
  ViewChild,
  ElementRef,
  AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { AiChatService } from '../../core/services/ai-chat.service';

interface ChatMessage {
  from: 'user' | 'bot';
  text: string;
}

@Component({
  standalone: true,
  selector: 'app-ia-chat',
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './ia-chat.component.html',
  styleUrls: ['./ia-chat.component.css']
})
export class IaChatComponent implements AfterViewChecked {
  private ai = inject(AiChatService);

  // mensajes
  messages = signal<ChatMessage[]>([
    {
      from: 'bot',
      text: 'Hola, soy tu asistente IA integrado a Noticias360. ¿En qué te ayudo hoy?'
    }
  ]);

  // estado UI
  loading = signal(false);
  typing  = signal(false); // 👈 nuevo: indica que el bot está escribiendo
  errorMsg = signal<string | null>(null);

  // input
  inputControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(1)]
  });

  // scroll
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;

  // timer para la animación
  private typingTimer: any = null;
  private readonly typingDelay = 20; // ms por carácter (ajusta a gusto)

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    if (!this.scrollContainer) return;
    try {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  // limpia la respuesta (<think>...</think> fuera)
  private cleanReply(raw: string): string {
    if (!raw) return '';
    const sinThink = raw.replace(/<think>[\s\S]*?<\/think>/i, '');
    return sinThink.trim();
  }

  // animación: escribe letra por letra en el último mensaje del bot
  private startTyping(fullText: string) {
    if (!fullText) return;

    // por si quedara algún timer anterior
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }

    this.typing.set(true);
    let index = 0;

    // añadimos un mensaje vacío del bot
    this.messages.update(list => [...list, { from: 'bot', text: '' }]);

    this.typingTimer = setInterval(() => {
      index++;

      const partial = fullText.slice(0, index);

      this.messages.update(list => {
        const newList = [...list];
        const lastIndex = newList.length - 1;

        if (lastIndex >= 0 && newList[lastIndex].from === 'bot') {
          newList[lastIndex] = { ...newList[lastIndex], text: partial };
        }
        return newList;
      });

      if (index >= fullText.length) {
        this.typing.set(false);
        if (this.typingTimer) {
          clearInterval(this.typingTimer);
          this.typingTimer = null;
        }
      }
    }, this.typingDelay);
  }

  // enviar mensaje al backend
  sendMessage() {
    if (this.inputControl.invalid || this.loading()) {
      return;
    }

    const text = this.inputControl.value.trim();
    if (!text) return;

    this.errorMsg.set(null);

    // agrega mensaje del usuario
    this.messages.update(list => [...list, { from: 'user', text }]);
    this.loading.set(true);
    this.inputControl.setValue('');

    this.ai.enviarMensaje(text).subscribe({
      next: reply => {
        this.loading.set(false);
        const clean = this.cleanReply(reply);
        this.startTyping(clean); // 👈 aquí usamos el efecto máquina de escribir
      },
      error: err => {
        console.error('Error en el chat IA', err);
        this.loading.set(false);
        this.errorMsg.set('Ocurrió un error al comunicar con la IA.');
        this.messages.update(list => [
          ...list,
          {
            from: 'bot',
            text: 'Lo siento, hubo un problema al conectarme con el servicio de IA. Intenta de nuevo.'
          }
        ]);
      }
    });
  }

  // Enter para enviar, Shift+Enter para nueva línea
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // submit del form (evita recarga)
  onSubmit(event: Event) {
    event.preventDefault();
    this.sendMessage();
  }
}
