// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ApeFathersDiamond} from "../ApeFathersDiamond.sol";
import {IApeDads} from "../core/IApeDads.sol";
import {LibDiamond} from '@diamondhand-protocol/diamond/contracts/libraries/LibDiamond.sol';

interface IPermitsFacet {
function askForApproval(uint16[] memory tokenIds, bool _approve) external returns (bool);
function askForConfirmation(uint16[] memory tokenIds, bool _approve) external returns (bool);
}

contract PermitsFacet is IPermitsFacet, ApeFathersDiamond {
function getMessageHash(uint16[] memory tokenIds, bool _approve) internal view returns (bytes32) {
bytes32 tokenIdsHash = keccak256(abi.encodePacked(tokenIds));
bytes32 approvalHash = keccak256(abi.encodePacked(_approve));
return keccak256(abi.encodePacked(address(this), msg.sender, tokenIdsHash, approvalHash));
}

function askForApproval(uint16[] memory tokenIds, bool _approve) public override returns (bool) {
    bytes32 messageHash = getMessageHash(tokenIds, _approve);
    address spender = address(this);
    require(apeDads.isOwnerOf(tokenIds[0]) == msg.sender, 'Only token owner can approve');
    apeDads.approve(spender, uint256(messageHash));
    return true;
}

/**
 * @dev Ask User for confirmation of transaction.
 */
function askForConfirmation(uint16[] memory tokenIds, bool _approve) public override returns (bool) {
    require(askForApproval(tokenIds, _approve), 'Failed to show prompt');
    return true;
}

event ApprovalGranted(address indexed _sender);


}