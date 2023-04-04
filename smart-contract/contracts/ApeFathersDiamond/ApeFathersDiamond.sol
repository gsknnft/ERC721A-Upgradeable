// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IApeDads,ERC721AUpgradeable, ERC721A__Initializable } from "./Facets/Imports.sol";
import {Diamond} from "diamond-2/contracts/diamond/Diamond.sol";
import {DiamondCutFacet} from "diamond-2/contracts/libraries/DiamondCutFacet.sol";
import {OwnershipFacet} from "diamond-2/contracts/libraries/OwnershipFacet.sol";
import {ApeFathersBase} from "./ApeFathersBase.sol";
import {} from 'erc721a-upgradeable/contracts/ERC721AUpgradeable.sol';
import {} from 'erc721a-upgradeable/contracts/ERC721A__Initializable.sol';
import {ERC721AStorage} from 'erc721a-upgradeable/contracts/ERC721AStorage.sol';
import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {UUPSUpgradeable} from '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import {SafeMathUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import {PausableUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol';
import {ReentrancyGuardUpgradeable} from '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import {ERC721URIStorageUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol';
import {ECDSAUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol';
import {AFDiamondCut} from './Facets/AFDiamondCut.sol';
import {LibDiamond} from '@diamondhand-protocol/diamond/contracts/libraries/LibDiamond.sol';


contract ApeFathers is Diamond, ApeFathersBase {
    using DiamondLib for DiamondLib.FacetData[];
    using AddressUpgradeable for address;


    bytes32 constant APE_FATHERS = keccak256("ApeFathers");
    bytes32 constant APE_FATHERS_INIT = keccak256("ApeFathersInit");

    struct DiamondStorage {
        DiamondLib.FacetData[] diamondCut;
        mapping(bytes4 => address) facets;
        mapping(bytes4 => bool) selectorToFacetAndPosition;
        bool initialized;
    }

    function initialize() public initializerERC721A initializer {
        require(!_diamondStorage().initialized, "Already initialized");
        _diamondStorage().initialized = true;
        // add diamond cut facets
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        Diamond.addFacet(address(diamondCutFacet), "");
        OwnershipFacet ownershipFacet = new OwnershipFacet();
        Diamond.addFacet(address(ownershipFacet), "");

        // initialize ApeFathersBase
        ApeFathersBase.initialize();
    }

        function facetAddresses() public view returns (address[] memory) {
        return Diamond.facetAddresses();
    }

    function cut(
        address[] calldata _add,
        address[] calldata _rem,
        bytes[] calldata _calldata
    ) external onlyOwner {
        Diamond.cut(_add, _rem, _calldata);
    }

    function getRoyalty() external view returns (uint96, address) {
        return ApeFathersBase.getRoyalty();
    }

    function setRoyalty(uint96 _fee, address _recipient) external onlyOwner {
        ApeFathersBase.setRoyalty(_fee, _recipient);
    }

    function withdraw() external onlyOwner {
        ApeFathersBase.withdraw();
    }

    function setPublicSaleState(bool _saleActiveState) external onlyOwner {
        ApeFathersBase.setPublicSaleState(_saleActiveState);
    }

    function setBurnClaimState(bool _burnClaimActive) external onlyOwner {
        ApeFathersBase.setBurnClaimState(_burnClaimActive);
    }

    function setPublicPrice(uint256 _publicPrice) external onlyOwner {
        ApeFathersBase.setPublicPrice(_publicPrice);
    }

    function mint(uint256 numTokens) external payable nonReentrant {
        ApeFathersBase.mint(numTokens);
    }

    function gift(address[] calldata receivers, uint8[] calldata mintNumber) external onlyOwner {
        ApeFathersBase.gift(receivers, mintNumber);
    }

    function burnClaim(uint16[] calldata _tokenIds, uint8 verifyNumberOfTokens) external nonReentrant {
        ApeFathersBase.burnClaim(_tokenIds, verifyNumberOfTokens);
    }

    function pause() external onlyOwner {
        ApeFathersBase.pause();
    }

    function unpause() external onlyOwner {
        ApeFathersBase.unpause();
    }

    function setHiddenMetadataUri(string memory _hiddenMetadataUri) external onlyOwner {
        ApeFathersBase.setHiddenMetadataUri(_hiddenMetadataUri);
    }

    function setRevealed(bool _state) external onlyOwner {
        ApeFathersBase.setRevealed(_state);
    }

    DiamondLib.addFacet(
        APE_FATHERS_INIT,
        abi.encodeWithSelector(ApeFathers.initialize.selector),
        DiamondLib.FacetCutAction.Replace
    );

    DiamondLib.addFacet(
        APE_FATHERS,
        abi.encodeWithSelector(ApeFathers.pause.selector),
        DiamondLib.FacetCutAction.Replace
    );

    DiamondLib.addFacet(
        APE_FATHERS,
        abi.encodeWithSelector(ApeFathers.unpause.selector),
        DiamondLib.FacetCutAction.Replace
    );

    DiamondLib.addFacet(
        APE_FATHERS,
        abi.encodeWithSelector(ApeFathers.setHiddenMetadataUri.selector, string('')),
        DiamondLib.FacetCutAction.Replace
    );

    DiamondLib.addFacet(
        APE_FATHERS,
        abi.encodeWithSelector(ApeFathers.setRevealed.selector, false),
        DiamondLib.FacetCutAction.Replace
    );

    DiamondLib.addFacet(
        APE_FATHERS,
        abi.encodeWithSelector(ApeFathers.setTokensPerBatch.selector, uint256(0)),
        DiamondLib.FacetCutAction.Replace
    );

    DiamondLib.addFacet(
        APE_FATHERS,
        abi.encodeWithSelector(ApeFathers.revealTokens.selector),
        DiamondLib.FacetCutAction.Replace
    );

    DiamondLib.addFacet(
        APE_FATHERS,
        abi.encodeWithSelector(ApeFathers.calculateRoyaltyFee.selector, uint256(0), uint256(0)),
        DiamondLib.FacetCutAction.Replace
    );

    DiamondLib.addFacet(
        APE_FATHERS,
        abi.encodeWithSelector(ApeFathers._setDefaultRoyalty.selector, address(0), uint256(0)),
        DiamondLib.FacetCutAction.Replace
    );

    DiamondLib.addFacet(
        APE_FATHERS,
        abi.encodeWithSelector(ApeFathers.numberMinted.selector, address(0)),
        DiamondLib.FacetCutAction.Replace
    );

    DiamondLib.addFacet(
        APE_FATHERS,
        abi.encodeWithSelector(ApeFathers.setRoyalty.selector, uint96(0), address(0)),
        DiamondLib.FacetCutAction.Replace
    );

    DiamondLib.addFacet(
        APE_FATHERS,
        abi.encodeWithSelector(ApeFathers.withdraw.selector),
        DiamondLib.FacetCutAction.Replace
    );

    DiamondLib.addFacet(
        APE_FATHERS,
        abi.encodeWithSelector(ApeFathers.setBatchSizePerTx.selector, uint8(0)),
        DiamondLib.FacetCutAction.Replace
    );

    DiamondLib.addFacet(
        APE_FATHERS,
        abi.encodeWithSelector(ApeFathers.setPublicSaleState.selector, false),
        DiamondLib.FacetCutAction.Replace
    );

    DiamondLib.addFacet(
        APE_FATHERS,
        abi.encodeWithSelector(ApeFathers.setBurnClaimState.selector, false),
    );
}