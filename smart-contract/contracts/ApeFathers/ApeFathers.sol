// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IApeDads} from "./core/IApeDads.sol";
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


contract ApeFathers is
    ERC721AUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable 
{
    using SafeMathUpgradeable for uint256;
    using ECDSAUpgradeable for bytes32;
    // ERC721 Token Standard
    mapping(uint256 => address) internal _tokenOwners;
    mapping(address => uint256) internal _balances;
    mapping(uint256 => mapping(address => bool)) internal _tokenApprovals;
    mapping(address => mapping(address => bool)) internal _operatorApprovals;
    uint256 internal defaultRoyaltyFee;
    uint256 internal totalRevealed;
    uint256 internal publicPrice;
    uint256 internal tokensPerBatch; // Number of tokens to reveal per batch
    uint96 internal royaltyFee;
    uint16 internal MAX_SUPPLY; // Maximum supply of tokens that can be minted
    uint8 internal batchSizePerTx;
    string internal version;
    string internal uriPrefix;
    string internal uriSuffix;
    string internal baseTokenURI;
    string internal hiddenMetadataUri;
    bool internal revealed;
    bool internal metadataFrozen;
    bool internal payoutAddressesFrozen;
    bool internal isBurnClaimActive;
    bool internal isPublicSaleActive;
    address internal royaltyAddress;
    address internal defaultRoyaltyAddress;
    address[] internal payoutAddresses;
    uint256[] internal payoutBasisPoints;

    // ERC721URIStorage
    mapping(address => uint256) private _tokenCounts;
    mapping(uint256 => string) private _tokenURIs;


    // ApeDads Contract
    address apeDadsAddress = 0x6468f4243Faa8C3330bAAa0a7a138E2e5628C6f5;
    IApeDads internal apeDads = IApeDads(apeDadsAddress);
    
    // Batch Transfer
    uint256 internal constant MAX_BATCH_SIZE = 50;

    //     
    function initialize() public initializerERC721A initializer {
        __ERC721A_init("ApeFathers", "DAPES");
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ERC1967Upgrade_init();
        MAX_SUPPLY = 4000;
        apeDadsAddress = 0x6468f4243Faa8C3330bAAa0a7a138E2e5628C6f5;
        payoutAddresses = [0xa8750034896B0747b290f98439B6f5969070084A, 0x1FA95261FA842bC9c6AB4C0e925daee53feFE430];
        defaultRoyaltyAddress = 0xa8750034896B0747b290f98439B6f5969070084A;
        defaultRoyaltyFee = 500; //set initial royalty fee to 5%
        royaltyFee = 500;
        publicPrice = 0.06 ether;
        batchSizePerTx = 10;
        tokensPerBatch = 500;
        version = '1.0.0';
        uriSuffix = '.json';
        uriPrefix = '';
        hiddenMetadataUri = 'ipfs://__CID__/hidden.json';
        revealed = false;
        metadataFrozen = false;
        payoutAddressesFrozen = false; //  If true, payout addresses and basis points are permanently frozen and can never be updated
        isBurnClaimActive = false; // If true tokens can be burned in order to mint
        isPublicSaleActive = false;
        payoutBasisPoints = [8500, 1500];
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Intentionally left empty for a specific reason
    }


    // This file can contain state variables and functions that are related to the administration of the contract.
    // For example, it contains state variables for the contract version, royalty fee, and payout addresses, as well as functions for updating these values and withdrawing funds.
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev
     */
    function setHiddenMetadataUri(string memory _hiddenMetadataUri) external onlyOwner {
        hiddenMetadataUri = _hiddenMetadataUri;
    }

    function setRevealed(bool _state) external onlyOwner {
        revealed = _state;
    }
    
    function setTokensPerBatch(uint256 _tokensPerBatch) external onlyOwner {
        tokensPerBatch = _tokensPerBatch;
    }

        function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function revealTokens() external onlyOwner {
        require(revealed == false, 'Tokens have been revealed');
        require(totalSupply() > 0, 'Token supply is 0');
        require(tokensPerBatch > 0, 'Tokens must be greater than 0');

        uint256 tokensToReveal = min(tokensPerBatch, totalSupply().sub(totalRevealed));

        revealed = true;
        totalRevealed += tokensToReveal;
    }
        function calculateRoyaltyFee(uint256 total, uint256 fee) internal pure returns (uint256) {
        uint256 feeAmount = total * fee;
        return feeAmount / 10000;
    }

    function _setDefaultRoyalty(address _newRoyaltyAddress, uint256 _newRoyaltyFee) public onlyOwner {
        defaultRoyaltyAddress = _newRoyaltyAddress;
        defaultRoyaltyFee = _newRoyaltyFee;
    }

    /**
     * @notice Wraps and exposes publicly _numberMinted() from ERC721A
     */
    function numberMinted(address owner) public view returns (uint256) {
        return _numberMinted(owner);
    }

    /**
     * @notice Change the royalty address where royalty payouts are sent
     */
    function setRoyalty(uint96 _fee, address _recipient) external onlyOwner {
        require(_recipient != address(0), 'RECIPIENT_NOT_0');
        require(_fee <= 1500, 'Invalid royalty fee'); // Ensure royalty fee is no more than 15%
        royaltyFee = _fee;
        royaltyAddress = _recipient;
        _setDefaultRoyalty(_recipient, _fee);
    }

    /**
     * @notice Withdraws all funds held within contract
     */
    function withdraw() external nonReentrant onlyOwner {
        require(address(this).balance > 0, 'NO_FUNDS');
        uint256 balance = address(this).balance;
        for (uint256 i = 0; i < payoutAddresses.length; i++) {
            require(payable(payoutAddresses[i]).send((balance * payoutBasisPoints[i]) / 10000), 'MUST_EQUAL_100');
        }
    }

    /**
     * @notice Set the maximum public mints allowed per a given transaction
     */
    function setBatchSizePerTx(uint8 _batchSizePerTx) external onlyOwner {
        batchSizePerTx = _batchSizePerTx;
    }

    /**
     * @notice To be updated by contract owner to allow public sale minting
     */
    function setPublicSaleState(bool _saleActiveState) external onlyOwner {
        require(isPublicSaleActive != _saleActiveState, 'NEW_STATE_IDENTICAL_TO_OLD_STATE');
        isPublicSaleActive = _saleActiveState;
    }

    /**
     * @notice To be updated by contract owner to allow burning to claim a token for free + gas
     */
    function setBurnClaimState(bool _burnClaimActive) external onlyOwner {
        require(isBurnClaimActive != _burnClaimActive, 'BURN CLAIM CLOSED');
        isBurnClaimActive = _burnClaimActive;
    }

    /**
     * @notice Update the public mint price
     */
    function setPublicPrice(uint256 _publicPrice) external onlyOwner {
        publicPrice = _publicPrice;
    }

    /**
     * @notice Allow owner to send gifts to multiple addresses
     */
    function gift(address[] calldata receivers, uint8[] calldata mintNumber) external onlyOwner {
        require(receivers.length == mintNumber.length, 'BOTH_NUMBERS_MUST_BE_SAME_LENGTH');
        uint16 totalMint = 0;
        for (uint8 i = 0; i < mintNumber.length; i++) {
            totalMint += mintNumber[i];
        }
        require(totalSupply() + totalMint <= 4000, 'MAX_SUPPLY_EXCEEDED');
        for (uint16 i = 0; i < receivers.length; i++) {
            _safeMint(receivers[i], mintNumber[i]);
        }
    }

    /**
     * @notice Allow for public minting of tokens
     */
    function mint(uint256 numTokens) external payable nonReentrant {
        require(isPublicSaleActive, 'PUBLIC_NOT_ACTIVE');
        require(numTokens <= batchSizePerTx, 'MAX_MINTS_PER_TX_EXCEEDED');
        require(totalSupply() + numTokens <= MAX_SUPPLY, 'MAX_SUPPLY_EXCEEDED');
        require(msg.value == publicPrice * numTokens, 'PAYMENT_INCORRECT');
        _safeMint(_msgSender(), numTokens);
        if (totalSupply() >= MAX_SUPPLY) {
            isPublicSaleActive = false;
        }
    }

    function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
        require(_exists(_tokenId), 'ERC721Metadata: URI query');

        if (revealed == false) {
            return hiddenMetadataUri;
        }
        string memory fullURI = string(abi.encodePacked(_baseURI(), _toString(_tokenId), uriSuffix));
        return fullURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }
    /**
     * @notice Update the base token URI
     */
    function setBaseURI(string calldata _newBaseURI) external onlyOwner {
        require(!metadataFrozen, 'METADATA_HAS_BEEN_FROZEN');
        baseTokenURI = _newBaseURI;
    }

    function setUriAttributes(string memory _uriPrefix, string memory _uriSuffix) external onlyOwner {
        uriPrefix = _uriPrefix;
        uriSuffix = _uriSuffix;
    }
    /**
     * @dev Used to directly approve a specific token for transfers by the current msg.sender
     * @param tokenId The ID of the token to approve for transfer
     */
    function _directApproveMsgSenderFor(uint256 tokenId) internal {
        assembly {
            mstore(0x00, tokenId)
            mstore(0x20, 6) // '_tokenApprovals' is at slot 6.
            sstore(keccak256(0x00, 0x40), caller())
        }
    }
    
    /*
    /    https://chiru-labs.github.io/ERC721A/#/migration?id=supportsinterface 
    **/
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
        //   Supports the following interfaceIds:
        //    - IERC165: 0x01ffc9a7
        //    - IERC721: 0x80ac58cd
        //    - IERC721Metadata: 0x5b5e139f
        //    - IERC2981: 0x2a55205a
        //    - IERC4907: 0xad092b5c
        return
            interfaceId == 0x80ac58cd || // IERC721
            interfaceId == 0x5b5e139f || // IERC721Metadata
            interfaceId == 0x2a55205a; // IERC2981
    }

    event BurnClaimComplete(address indexed user, uint256 numberMinted, uint16[] tokenIds);

    /**
    * @dev Burn ApeDads Tokens and Receive ApeFathers tokens in return
    - WARNING: THIS ACTION IS IRREVERSABLE. ENSURE YOU ARE 
        AWARE OF THE RISKS OF BURNING YOUR ASSETS. */
    error TokenCountVerificationFailed(string message);
    error BurnClaimIsNotActive(string message);
    error InvalidClaim(string message);
    error CannotClaimTokenYouDontHold(string message);

    function burnClaim(uint16[] calldata _tokenIds, uint8 verifyNumberOfTokens) external nonReentrant {
        if (!isBurnClaimActive) {
            revert BurnClaimIsNotActive('BURN_NOT_ACTIVE');
        }
        if (_tokenIds.length != verifyNumberOfTokens) {
            revert TokenCountVerificationFailed('WRONG_#_OF_TOKENS');
        }
        if (_tokenIds.length < 1) {
            revert InvalidClaim('NO_TOKEN_PROVIDED');
        }

        address[] memory owners = new address[](_tokenIds.length);
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            address owner = apeDads.isOwnerOf(_tokenIds[i]);
            if (owner != _msgSender()) {
                revert CannotClaimTokenYouDontHold('NO_APEDADS_TOKEN_OWNED');
            }
            owners[i] = owner;
            apeDads.burn(_tokenIds[i]);
            _safeMint(_msgSender(), _tokenIds[i]);
        }

        emit BurnClaimComplete(_msgSender(), _tokenIds.length, _tokenIds);
    }


    /**
     * @notice Hook that is called before any token transfer. This includes minting and burning.
     */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual {
        // Clear approval from the previous owner
        _tokenApprovals[tokenId][from] = false;

        //  Directly approve the current owner for the transfer
        _directApproveMsgSenderFor(tokenId);

        // Set mapped approval for the new owner
        _tokenApprovals[tokenId][to] = true;

        // Call beforeTokenTransfer after other operations
        this.beforeTokenTransfer(from, to, tokenId);
    }

    function beforeTokenTransfer(address from, address, uint256) external payable virtual nonReentrant {
        // check if royalties are due
        if (from != address(0) && royaltyFee > 0) {
            uint256 royalty = (msg.value * royaltyFee) / 10000; // calculate royalty based on fee
            (bool success, ) = royaltyAddress.call{value: royalty}(''); // transfer royalty to recipient
            require(success, 'Royalty transfer failed');
        }
    }

    event TokenTransferFailed(address indexed from, address indexed to, uint256 indexed tokenId);
    event TokenTransfer(address indexed from, address indexed to, uint256 indexed tokenId);

    /**
     * @notice Batch Transfer ApeFather NFTs Easier and gas efficiently
     */
    function batchTransfer(uint256[] memory _tokenIds, address _to) external nonReentrant {
        uint256 len = _tokenIds.length;
        require(len >= 2, 'Must provide at least 2 IDs');

        uint256 i = 0;
        while (i < len) {
            uint256 end = i + batchSizePerTx;
            if (end > len) {
                end = len;
            }
            uint256[] memory batchIds = new uint256[](end - i);
            for (uint256 j = i; j < end; j++) {
                batchIds[j - i] = _tokenIds[j];
            }

            // Transfer tokens in a batch and skip over errors
            for (uint256 j = 0; j < batchIds.length; j++) {
                this.safeTransferFrom(_msgSender(), _to, batchIds[j]);
                // Log successful transfer
                emit TokenTransfer(_msgSender(), _to, batchIds[j]);
            }
            i += batchSizePerTx;
        }
    }
}
