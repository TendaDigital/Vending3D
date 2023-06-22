# Vending3D

## Instruções básicas
1. Iniciar interface (print-interface)

    1. nvm use 10 - Versão do Node 10
    2. yarn install - instalar dependências
    3. yarn start - iniciar servidor
  
2. Iniciar server (print-server)

    1. nvm use 8 - Versão do Node 8
    2. yarn install - instalar dependências
    3. yarn start - iniciar servidor

3. Iniciar um worker para cada impressora

    1.  nvm use 8 - Versão do Node 8
    2.  yarn install - instalar dependências
    3.  yarn start - iniciar worker
    4.  Selecionar impressora a qual a sessão do terminal estará vinculada

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
