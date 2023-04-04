// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {ApeFathers} from "../ApeFathers.sol";

contract Permits is ApeFathers {

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
}
