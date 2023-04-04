// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721AUpgradeable} from 'erc721a-upgradeable/contracts/ERC721AUpgradeable.sol';
import {ERC721A__Initializable} from 'erc721a-upgradeable/contracts/ERC721A__Initializable.sol';
import {ERC721AStorage} from 'erc721a-upgradeable/contracts/ERC721AStorage.sol';
import {ECDSAUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol';
import {SafeMathUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import {AddressUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import {ERC165Upgradeable} from '@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol';
import {IERC165Upgradeable} from '@openzeppelin/contracts-upgradeable/interfaces/IERC165Upgradeable.sol';
import {IERC721Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import {IERC721MetadataUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721MetadataUpgradeable.sol';
import {IERC721EnumerableUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721EnumerableUpgradeable.sol';
import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {UUPSUpgradeable} from '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import {PausableUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol';
import {ReentrancyGuardUpgradeable} from '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import {ERC721URIStorageUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol';
import {IApeDads} from "./IApeDads.sol";
import {AFDiamondCut} from './AFDiamondCut.sol';
import {LibDiamond} from '@diamondhand-protocol/diamond/contracts/libraries/LibDiamond.sol';

library ImportsLib {
  using SafeMathUpgradeable for uint256;
  using ECDSAUpgradeable for bytes32;
}
