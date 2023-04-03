// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IApeDads} from "./IApeDads.sol";
import {ERC721AUpgradeable} from 'erc721a-upgradeable/contracts/ERC721AUpgradeable.sol';
import {ERC721A__Initializable} from 'erc721a-upgradeable/contracts/ERC721A__Initializable.sol';
import {ERC721AStorage} from 'erc721a-upgradeable/contracts/ERC721AStorage.sol';
import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {UUPSUpgradeable} from '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import {SafeMathUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import {PausableUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol';
import {ReentrancyGuardUpgradeable} from '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import {ERC721URIStorageUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol';
import {ECDSAUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol';
// prettier ignore