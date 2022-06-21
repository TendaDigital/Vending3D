# Vending3D

## Instruções básicas
1. Iniciar interface (print-interface)
  1.1 nvm use 10 - Versão do Node 10
  1.2 yarn install - instalar dependências
  1.3 yarn start - iniciar servidor
2. Iniciar server (print-server)
  2.1 nvm use 8 - Versão do Node 8
  2.2 yarn install - instalar dependências
  2.3 yarn start - iniciar servidor
3. Iniciar um worker para cada impressora
  3.1 nvm use 8 - Versão do Node 8
  3.2 yarn install - instalar dependências
  3.3 yarn start - iniciar worker
  3.4 Selecionar impressora a qual a sessão do terminal estará vinculada

O arquivo **printers.json** deve existir na pasta *print-worker*. Nele, é necessário que seja especificada a porta USB ou USB-c na qual a impressora está conectada. Exemplo:
```json
[
  {
    "name": "Ender Mini 0",
    "port": {
      "comName": "/dev/ttyUSB0" // usb port
    }
  },
  {
    "name": "Ender Mini 1",
    "port": {
      "comName": "/dev/tty.usbserial-110" // usb-c port
    }
  }
]
```

Caso haja um erro relacionado ao canvas, comente o trecho relacionada a biblioteca *node-stl-thumbnailer*.
A interface mais nova foi desenvolvida na branch **feature/new-interface**.