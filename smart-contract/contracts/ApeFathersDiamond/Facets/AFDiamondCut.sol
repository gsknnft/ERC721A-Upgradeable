// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IDiamondCut } from "@solidstate/contracts/diamond/interfaces/IDiamondCut.sol";

contract MyDiamondCut is IDiamondCut {
    function diamondCut(IDiamondCut.FacetCut[] memory facetCuts, address _address, bytes memory _data) external override {}
}