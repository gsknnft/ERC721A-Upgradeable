// ApeFathersMintFacet
contract ApeFathersMintFacet is Ownable {
    // state variables and constructor
    // ...

    // mint function
    function mint(uint256 numTokens) external payable nonReentrant {
        ApeFathersBase.mint(numTokens);
    }

    function burnClaim(uint16[] calldata _tokenIds, uint8 verifyNumberOfTokens) external nonReentrant {
        ApeFathersBase.burnClaim(_tokenIds, verifyNumberOfTokens);
    }

    // public sale price and maximum number of tokens per transaction
    function setPublicSalePrice(uint256 _price) external onlyOwner {
        // ...
    }

    function setPublicSaleMaxMint(uint256 _maxMint) external onlyOwner {
        // ...
    }

    // ...
}



