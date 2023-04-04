// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import { ERC721AUpgradeable, AddressUpgradeable } from  "./ImportsFacet.sol";
import "../ApeFathersBase.sol";

contract ApeFathersPausableFacet is ApeFathersBaseFacet {
    using SafeMath for uint256;
    using AddressUpgradeable for address;

    bool private _paused;

    event Paused(address account);
    event Unpaused(address account);

    constructor() {
        _paused = false;
    }

    modifier whenNotPaused() {
        require(!_paused, "ApeFathers: paused");
        _;
    }

    modifier whenPaused() {
        require(_paused, "ApeFathers: not paused");
        _;
    }

    function paused() public view returns (bool) {
        return _paused;
    }

    function pause() public onlyOwner whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    function unpause() public onlyOwner whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }

    function batchTransfer(address[] calldata recipients, uint256[] calldata tokenIds) public whenNotPaused {
        require(recipients.length == tokenIds.length, "ApeFathers: recipients and tokenIds length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            _transfer(msg.sender, recipients[i], tokenIds[i]);
        }
    }
}
