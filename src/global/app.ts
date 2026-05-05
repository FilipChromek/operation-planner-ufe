import '@material/web/list/list'
import '@material/web/list/list-item'
import '@material/web/icon/icon'
import '@material/web/textfield/filled-text-field'
import '@material/web/select/filled-select'
import '@material/web/select/select-option'
import '@material/web/slider/slider'
import '@material/web/button/filled-button'
import '@material/web/button/filled-tonal-button'
import '@material/web/button/outlined-button'
import '@material/web/divider/divider'
import '@material/web/iconbutton/filled-icon-button'
import '@material/web/chips/chip-set'
import '@material/web/chips/assist-chip'
import '@material/web/chips/filter-chip'
import '@material/web/radio/radio'
import '@material/web/progress/circular-progress'

import { registerNavigationApi } from './navigation.js'

function ensureStylesheet(id: string, href: string) {
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

export default function () {
  ensureStylesheet(
    'or-planner-roboto-font',
    'https://fonts.googleapis.com/css?family=Roboto:300,400,500&display=swap',
  );

  ensureStylesheet(
    'or-planner-material-symbols-font',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block',
  );

  registerNavigationApi()
}
