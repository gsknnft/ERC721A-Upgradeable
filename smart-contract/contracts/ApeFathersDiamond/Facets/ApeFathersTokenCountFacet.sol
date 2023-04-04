// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../lib/SafeMath.sol";
import "../lib/IERC721.sol";
import "../lib/IERC721Receiver.sol";
import "../lib/Address.sol";
import "../ApeFathersBaseFacet.sol";

contract ApeFathersTokenCountFacet is ApeFathersBaseFacet {
    using SafeMath for uint256;
    using Address for address;

    uint256 private _numberMinted;
    mapping(address => uint256) private _numberMintedBy;

    function numberMinted() public view returns (uint256) {
        return _numberMinted;
    }

    function numberMintedBy(address account) public view returns (uint256) {
        return _numberMintedBy[account];
    }

    function _mint(address to, uint256 tokenId) internal override {
        super._mint(to, tokenId);
        _numberMinted = _numberMinted.add(1);
        _numberMintedBy[to] = _numberMintedBy[to].add(1);
    }

    function _transfer(address from, address to, uint256 tokenId) internal override {
        super._transfer(from, to, tokenId);
        _numberMintedBy[from] = _numberMintedBy[from].sub(1);
        _numberMintedBy[to] = _numberMintedBy[to].add(1);
    }

    function _burn(uint256 tokenId) internal override {
        super._burn(tokenId);
        _numberMinted = _numberMinted.sub(1);
        _numberMintedBy[_msgSender()] = _numberMintedBy[_msgSender()].sub(1);
    }
}
