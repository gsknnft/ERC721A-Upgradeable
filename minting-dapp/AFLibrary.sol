// MyLibrary.sol
library AFLibrary {
    event TokenTransferFailed(address indexed from, address indexed to, uint256 indexed tokenId);
    event TokenTransfer(address indexed from, address indexed to, uint256 indexed tokenId);

    /**
     * @notice Batch Transfer ApeFather NFTs Easier and gas efficiently
     */
    function batchTransfer(uint256[] memory _tokenIds, address _to) public {
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
