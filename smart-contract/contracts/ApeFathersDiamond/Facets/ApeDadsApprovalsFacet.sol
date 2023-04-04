// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {DiamondBase} from "diamond-2/contracts/DiamondBase.sol";
import {ApeFathersBase} from "../ApeFathersBase.sol";
import {IApeDads} from "./IApeDads.sol";
import {ECDSAUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol';

contract ApeDadsApprovalsFacet is DiamondBase, ApeFathersBase {
    using ECDSAUpgradeable for bytes32;

    bytes32 constant APE_DADS_APPROVALS = keccak256("ApeDadsApprovals");

    // EIP-712 Permit
    mapping(address => uint256) private nonces;
    bytes32 private constant PERMIT_TYPEHASH = keccak256('Permit(address spender,uint256 nonce)');

    function getMessageHash(uint16[] memory tokenIds, bool _approve) internal view returns (bytes32) {
        bytes32 tokenIdsHash = keccak256(abi.encodePacked(tokenIds));
        bytes32 approvalHash = keccak256(abi.encodePacked(_approve));
        return keccak256(abi.encodePacked(address(this), msg.sender, tokenIdsHash, approvalHash));
    }

    function askForApproval(uint16[] memory tokenIds, bool _approve) internal returns (bool) {
        bytes32 messageHash = getMessageHash(tokenIds, _approve);
        address spender = address(this);
        require(apeDads.isOwnerOf(tokenIds[0]) == msg.sender, 'Only token owner can approve');
        apeDads.approve(spender, uint256(messageHash));
        return true;
    }

    /**
     * @dev Ask User for confirmation of transaction.
     */
    function askForConfirmation(uint16[] memory tokenIds, bool _approve) internal returns (bool) {
        require(askForApproval(tokenIds, _approve), 'Failed to show prompt');
        return true;
    }

    event ApprovalGranted(address indexed _sender);

    /*
     * @notice Approves ALL ApeDadNFT token IDs as owned by the caller.
     **/
    function permitBurnAllTokens(address apeDadsAddress, uint256 _nonce, uint8 v, bytes32 r, bytes32 s) external {
        require(apeDadsAddress == address(apeDads), 'Invalid token contract address');
        // Ensure the nonce is correct to prevent replay attacks
        require(nonces[msg.sender] == _nonce, 'Invalid nonce');

        // Increment the nonce for the user
        nonces[msg.sender] += 1;

        // Create the message hash
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, _nonce));

        // Create the EIP-712 domain separator hash
        bytes32 domainSeparator = keccak256(abi.encodePacked('ApeFathersContract', '1', address(this)));

        // Create the EIP-712 hash to sign
        bytes32 hashToSign = ECDSAUpgradeable.toTypedDataHash(domainSeparator, messageHash);

        // Recover the signer's address from the signature
        address signer = ECDSAUpgradeable.recover(hashToSign, v, r, s);

        // Ensure the signer is the user
        require(signer == msg.sender, 'Invalid signature');

        // Approve this contract for burning all tokens held by the message sender
        apeDads.setApprovalForAll(address(this), true);
        emit ApprovalGranted(msg.sender);
    }

    function approveAllTokensForBurn(uint256 nonce, bytes memory _signature) external {
        // Ensure that the sender is the owner of the ApeDads tokens
        require(apeDads.balanceOf(msg.sender) > 0, 'Only token owner can approve');

        // Inform the user of what they are approving
        string memory warning = 'Approve to burn ALL ApeDads NFTs';
        bytes memory data = abi.encodeWithSignature('warning(string)', warning);
        (bool sendersuccess, ) = msg.sender.call(data);
        require(sendersuccess, 'Failed to show Metamask warning');

        // Get message hash
        bytes32 messageHash = keccak256(abi.encodePacked(address(this), msg.sender, nonce));

        // Recover the signer's address from the signature
        address signer = ECDSAUpgradeable.recover(messageHash, _signature);

        // Ensure the signer is the user
        require(signer == msg.sender, 'Invalid signature');

        // Approve this contract for burning all tokens held by the message sender
        apeDads.setApprovalForAll(address(this), true);
        emit ApprovalGranted(msg.sender);
    }

    /*
     * @notice Approves the selected # of ONLY ApeDadNFT token IDs as indicated by the token owner
     **/
    event ApprovalComplete(address indexed _sender, uint16[] _tokenIds);

    function approveTokensForBurn(uint16[] calldata _tokenIds, bool _approve, bytes memory _signature) external {
        // Inform the user of what they are approving
        string
            memory warning = 'WARNING: You are approving the transfer of all your ApeDad NFTs to be burned by this contract. Please ensure you have selected the correct tokens to burn.';
        bytes memory data = abi.encodeWithSignature('warning(string)', warning);
        (bool success, ) = msg.sender.call(data);
        require(success, 'Failed to show Metamask warning');

        // Approve the contract for burning all specified tokens held by the message sender
        require(_tokenIds.length > 0, 'Token IDs array is empty');

        // Get message hash
        bytes32 messageHash = getMessageHash(_tokenIds, _approve);

        // Verify the signature
        address owner = apeDads.ownerOf(uint256(_tokenIds[0]));
        require(owner == ECDSAUpgradeable.recover(messageHash, _signature), 'Invalid signature');

        // Approve the contract for burning all specified tokens held by the message sender
        apeDads.approve(address(this), uint256(messageHash));

        emit ApprovalComplete(msg.sender, _tokenIds);
    }
}
