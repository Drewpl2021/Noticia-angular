import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Noticias';
  constructor(private theme: ThemeService) {}
  toggleTheme() { this.theme.toggle(); }
  get themeLabel() {
    return this.theme.current() === 'light' ? '🌙 Oscuro' : '☀️ Claro';
  }
}
