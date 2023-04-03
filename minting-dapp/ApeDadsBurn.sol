// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {ApeFathers } from '../ApeFathers.sol';
import { IApeDads } from "./IApeDads.sol";

contract ApeDadsBurn is ApeFathers {


        // ApeDads Contract
    // ApeDads Contract
    IApeDads internal apeDads = IApeDads(apeDadsAddress);
    


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
}