# OpenFraction
OpenFraction es un contrato de fraccionalización de NFTs desarrollado para una
Hackathon de Blockchain. Está desarrollado en Solidity para ser utilizado
en cadenas estilo Ethereum.

# API
OpenFraction se implementa como un token ERC20, y puede recibir mediante
safeTransfer tokens ERC721 de otros contratos. De los tokens ERC721 que posee,
actualmente permite generar votaciones de transferencia a otra billetera,
en dichas votaciones se participa utilizando los valores del ERC20. Una vez
se llega al 50% del totalSupply, se ejecuta automáticamente la transferencia.

```
const tokenApi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint256)"
];

const fractionApi = [
    ...tokenApi,
    "function voteCount() view returns (uint256)",
    "function haveVoted(uint256 voteId) view returns (bool)",
    "function voteInfo(uint256 voteId) view returns (address, address, uint256, uint256, bool, bool)",
    "function createVote(address, address, uint256, bool) returns (uint256)",
    "function voteFor(uint256) returns (uint256)",

    "function nftCount() view returns (uint256)",
    "function get(uint256) view returns (address, uint256)",
    "function getIndex(address, uint256) view returns (uint256, bool)",

    "function totalSupply() view returns (uint256)",
];
```

# Development

## Blockchain

Para el desarrollo del contrato, es necesario tener instalados Brownie (Framework de desarrollo para Solidity en Python), Solidity y Ganache (nodo local de desarrollo):

1. [Instalación de Brownie](https://eth-brownie.readthedocs.io/en/stable/install.html)
2. Solidity generalmente se instala mediante Brownie, caso contrario se puede [instalar manualmente de múltiples maneras (NPM, Nativo, Etc)](https://docs.soliditylang.org/en/v0.8.14/installing-solidity.html)
3. [Ganache](https://github.com/trufflesuite/ganache#command-line-use)


Una vez instalados, podemos proceder. En el archivo contracts/OpenFraction.sol se encuentra el contrato + estructuras de ayuda relacionadas. 

En caso de requerir agregar dependencias, podemos usar el comando `brownie pm install [repo de github con estructuras a usar]`, por ejemplo se utilizó `brownie pm install OpenZeppelin/openzeppelin-contracts@4.6.0` para instalar las implementaciones e interfaces de OpenZeppelin.

Para recompilar el contrato, utilizamos `brownie compile`. Luego podemos abrir un nodo local y una consola para comunicarnos mediante `brownie console`. La consola de Brownie nos permite hacer deploy del contrato y llamar métodos del mismo, así como realizar transacciones en la blockchain en general. En modo development (por defecto) configura 10 cuentas con balance 100 por defecto.

Por ejemplo, si quisieramos hacer un deploy de OpenFraction así como de TestNFT, mintear un NFT para probar OpenFraction, y generar una votación de prueba y aprobarla, podríamos ejecutar:

```
>>> OpenFraction.deploy(2000, "NFT Holding Inc", "NHI", {'from': accounts[0]})
Transaction sent: 0x316aeba9354f2002462b51d3a9c4190f44450da29e836bc947b47b078fab4c85
  Gas price: 0.0 gwei   Gas limit: 12000000   Nonce: 0
  OpenFraction.constructor confirmed   Block: 1   Gas used: 1309335 (10.91%)
  OpenFraction deployed at: 0x3194cBDC3dbcd3E11a07892e7bA5c3394048Cc87

<OpenFraction Contract '0x3194cBDC3dbcd3E11a07892e7bA5c3394048Cc87'>
>>> TestNFT.deploy({'from': accounts[0]})
Transaction sent: 0xbb420c53b4ab0006ba892f68c90203e7496e32473e0d02b14e4b05e0b1503a27
  Gas price: 0.0 gwei   Gas limit: 12000000   Nonce: 1
  TestNFT.constructor confirmed   Block: 2   Gas used: 1216930 (10.14%)
  TestNFT deployed at: 0x602C71e4DAC47a042Ee7f46E0aee17F94A3bA0B6

<TestNFT Contract '0x602C71e4DAC47a042Ee7f46E0aee17F94A3bA0B6'>
>>> TestNFT[0].mint(OpenFraction[0], {'from': accounts[0]})
Transaction sent: 0x2278aeaae81aa7f38160798b4d545b50bcbc2779b980b31e06bc7c38463eb93b
  Gas price: 0.0 gwei   Gas limit: 12000000   Nonce: 2
  TestNFT.mint confirmed   Block: 3   Gas used: 135866 (1.13%)

<Transaction '0x2278aeaae81aa7f38160798b4d545b50bcbc2779b980b31e06bc7c38463eb93b'>
>>> OpenFraction[0].get(0)
("0x602C71e4DAC47a042Ee7f46E0aee17F94A3bA0B6", 0)
```

A este punto, ya tenemos un NFT en propiedad del contrato. Si ejecutamos ahora:

```
>>> OpenFraction[0].createVote("0x0000000000000000000000000000000000000000", TestNFT[0], 0, False, {'from': accounts[0]})
Transaction sent: 0x026bada41f2bad82cad63de96e4a0989aff4ea013f36770b718d9add3030acbb
  Gas price: 0.0 gwei   Gas limit: 12000000   Nonce: 3
  OpenFraction.createVote confirmed   Block: 4   Gas used: 79510 (0.66%)

<Transaction '0x026bada41f2bad82cad63de96e4a0989aff4ea013f36770b718d9add3030acbb'>
>>> OpenFraction[0].voteInfo(0)
("0x0000000000000000000000000000000000000000", "0x602C71e4DAC47a042Ee7f46E0aee17F94A3bA0B6", 0, 0, False, False)
>>> OpenFraction[0].voteFor(0)
Transaction sent: 0x73d99ae72cf8364223ae484b66b18945d046571376302f8f12a18fa8aab195c0
  Gas price: 0.0 gwei   Gas limit: 12000000   Nonce: 4
  OpenFraction.voteFor confirmed (ERC721: transfer to the zero address)   Block: 5   Gas used: 105637 (0.88%)

<Transaction '0x73d99ae72cf8364223ae484b66b18945d046571376302f8f12a18fa8aab195c0'>
```

Se ha generado un voto, y se ha votado con la enteridad de los votos disponibles (al crear el contrato se le transfiere la totalidad del supply del token al creador) lo cual ejecutó la transacción de transferencia. Al ser dirigida a la billetera 0x0000, la implementación de OpenZeppelin rechazó esta transacción.

TODO: documentar cómo hacer un deploy en cadena real utilizando brownie.

## Frontend

Para el desarrollo frontend, es necesario tener instalado NPM. El frontend está desarrollado utilizando React, MaterialUI, y ethers.js.

Para inicializar el servidor de prueba, se debe ejecutar:
```bash
cd ./frontend/openfraction-frontend;
npm start;
```
e ir en el navegador a http://localhost:3000
