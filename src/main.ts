import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ThemeService } from './app/core/services/theme.service';
import {registerLocaleData} from "@angular/common";
import es from '@angular/common/locales/es';   // 👈 este es el import correcto

registerLocaleData(es);

bootstrapApplication(AppComponent, appConfig).then(() => {
  // Inicializa el tema una vez montada la app
  new ThemeService().init();
});
