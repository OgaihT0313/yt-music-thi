# YT Music Thi

Player de desktop para o [YouTube Music](https://music.youtube.com), feito com [Electron](https://www.electronjs.org/).

## Recursos

- Janela própria do YouTube Music (com login da sua conta Google)
- Fechar a janela não para a música: o app fica na bandeja do sistema
- Menu da bandeja com Tocar/Pausar, Próxima e Anterior
- Teclas de mídia do teclado funcionam
- Atalhos globais extras:
  - `Ctrl+Shift+Espaço` — tocar/pausar
  - `Ctrl+Shift+→` — próxima
  - `Ctrl+Shift+←` — anterior
- Nome da música no título da janela
- Lembra o tamanho e a posição da janela
- Só uma instância aberta por vez

## Como rodar

Precisa do [Node.js](https://nodejs.org/) (versão 18 ou mais nova).

```bash
npm install
npm start
```

## Gerar o instalador para Windows

```bash
npm run dist
```

O instalador `.exe` fica na pasta `dist/`.
