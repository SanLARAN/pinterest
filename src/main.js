// Entry point: loads fonts + styles, boots the game.
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/900.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import './style.css';
import { Game } from './game/game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.start();

// Debug handle for manual QA in the browser console.
window.hollowkeep = game;
