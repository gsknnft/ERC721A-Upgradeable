// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;



import {ERC721AUpgradeable} from 'erc721a-upgradeable/contracts/ERC721AUpgradeable.sol';
import {ERC721A__Initializable} from 'erc721a-upgradeable/contracts/ERC721A__Initializable.sol';
import {ERC721AStorage} from 'erc721a-upgradeable/contracts/ERC721AStorage.sol';
import {ECDSAUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol';
import {SafeMathUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import {AddressUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import {EnumerableSetUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol';
import {ERC165Upgradeable} from '@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol';
import {IERC165Upgradeable} from '@openzeppelin/contracts-upgradeable/interfaces/IERC165Upgradeable.sol';
import {IERC721Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import {IERC721MetadataUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721MetadataUpgradeable.sol';
import {IERC721EnumerableUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721EnumerableUpgradeable.sol';
import {ContextUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';
import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {UUPSUpgradeable} from '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import {PausableUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol';
import {ReentrancyGuardUpgradeable} from '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import {ERC721URIStorageUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol';
import {IApeDads} from "./IApeDads.sol";
import {AFDiamondCut} from './Facets/AFDiamondCut.sol';
import {LibDiamond} from '@diamondhand-protocol/diamond/contracts/libraries/LibDiamond.sol';



abstract contract ApeFathersBase is ERC721AUpgradeable, ContextUpgradeable, OwnableUpgradeable, UUPSUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable, ERC721URIStorageUpgradeable {
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;

    struct RoyaltyInfo {
        uint96 fee;
        address recipient;
    }

    uint256 public constant TOTAL_MAX_TOKENS = 4000;
    uint256 public constant MAX_PUBLIC_MINT = 4000;
    uint256 public constant MAX_GIFT_MINT = 500;
    uint256 public constant MAX_BURN_CLAIM = 2000;
    uint256 public constant MAX_TOKENS_PER_BATCH = 20;
    uint256 public publicPrice;
    uint256 public tokensPerBatch;
    string public hiddenMetadataUri;
    bool public revealed;
    bool public burnClaimActive;
    bool public publicSaleActive;
    uint8 public batchSizePerTx;
    address public apeDadsAddress;
    mapping(uint256 => bool) public publicSaleMinted;
    mapping(address => uint256) public mintedCount;
    mapping(uint256 => RoyaltyInfo) private royalties;

    event TokenTransfer(address indexed from, address indexed to, uint256 indexed tokenId);
    mapping(uint256 => bool) public static burned;

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function initialize() external initializer {
        __ERC721_init("ApeFathers", "APES");
        // set default values
        publicPrice = 0.06 ether;
        publicSaleActive = false;
        burnClaimActive = false;
        revealed = false;
        apeDads = IApeDads(0x6468f4243Faa8C3330bAAa0a7a138E2e5628C6f5);
        batchSizePerTx = 10;
        tokensPerBatch = 500;
        defaultRoyaltyFee = 1000; // 10%
        defaultRoyaltyRecipient = msg.sender;
        hiddenMetadataUri = "";
        royaltyFee = defaultRoyaltyFee;
        royaltyRecipient = defaultRoyaltyRecipient;
    }

    function setBaseURI(string memory _baseURI) external onlyOwner {
        // ...
    }

function setPublicSaleState(bool _saleActiveState) external onlyOwner {
    publicSaleActive = _saleActiveState;
    emit PublicSaleStateUpdates(_publicSaleActive);
}


function setBurnClaimState(bool _burnClaimActive) external onlyOwner {
    burnClaimActive = _burnClaimActive;
    emit BurnClaimStateUpdated(_burnClaimActive);
}

function setPublicPrice(uint256 _publicPrice) external onlyOwner {
    require(_publicPrice > 0, "Invalid public price");

    publicPrice = _publicPrice;
    emit PublicPriceUpdated(_publicPrice);
}


function setApeDadsAddress(address _newAddress) external onlyOwner {
    require(_newAddress != address(0), "Invalid address");
    require(_newAddress.isContract(), "Not a contract address");

    apeDadsAddress = _newAddress;
    emit ApeDadsAddressUpdated(_newAddress);
}

function getRoyalty() external view returns (uint96, address) {
    return (royaltyFee, royaltyRecipient);
}

function setRoyalty(uint96 _fee, address _recipient) external onlyOwner {
    require(_fee <= MAX_ROYALTY_FEE, "Invalid royalty fee");

    royaltyFee = _fee;
    royaltyRecipient = _recipient;

    emit RoyaltyUpdated(_fee, _recipient);
}

function withdraw() external onlyOwner {
    uint256 balance = address(this).balance;
    require(balance > 0, "No balance to withdraw");

    (bool success,) = payable(owner()).call{value: balance}("");
    require(success, "Withdraw failed");

    emit Withdrawn(owner(), balance);
}



function mint(uint256 numTokens) external payable nonReentrant {
    require(publicSaleActive, "Public sale not active");
    require(numTokens > 0 && numTokens <= MAX_MINTS_PER_TX, "Invalid number of tokens");
    require(totalSupply() + numTokens <= MAX_SUPPLY, "Max supply reached");
    require(msg.value >= publicPrice * numTokens, "Insufficient ether");

    _mintTokens(msg.sender, numTokens);

    if (msg.value > 0) {
        uint256 refundAmount = msg.value - publicPrice * numTokens;
        if (refundAmount > 0) {
            (bool success,) = payable(msg.sender).call{value: refundAmount}("");
            require(success, "Refund failed");
        }
    }
}

function gift(address[] calldata receivers, uint8[] calldata mintNumber) external onlyOwner {
    require(receivers.length == mintNumber.length, "Invalid input length");

    for (uint i = 0; i < receivers.length; i++) {
        uint256 numTokens = mintNumber[i];
        require(numTokens > 0 && numTokens <= MAX_MINTS_PER_TX, "Invalid number of tokens");
        require(totalSupply() + numTokens <= MAX_SUPPLY, "Max supply reached");

        _mintTokens(receivers[i], numTokens);
    }
}

function burnClaim(uint16[] calldata _tokenIds, uint8 verifyNumberOfTokens) external nonReentrant {
    require(burnClaimActive, "Burn claim not active");
    require(_tokenIds.length == verifyNumberOfTokens, "Invalid input length");

    uint256 royalty = 0;
    for (uint i = 0; i < _tokenIds.length; i++) {
        uint256 tokenId = uint256(_tokenIds[i]);
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved or owner");

        royalty += _calculateRoyaltyFee(tokenId);
        _burn(tokenId);
    }

if (royalty > 0) {
    address royaltyRecipient = getRoyaltyRecipient();
    require(royaltyRecipient != address(0), "Invalid royalty recipient");

    IApeDads(apeDadsAddress).payRoyalty{value: royalty}(royaltyRecipient);
}



    // setBurnClaimState function
    function setBurnClaimState(bool _state) external onlyOwner {
        // ...
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721URIStorage, ERC721) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function _baseURI() internal view virtual override(ERC721URIStorage) returns (string memory) {
        return baseTokenURI;
    }


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

