// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// Sử dụng ERC721URIStorage để biến contract NFT của ta thành 1 ERC721 tiêu chuẩn.
contract NFT is ERC721URIStorage {
    uint public tokenCount; // Giá trị mặc định của số nguyên không dấu (uint) trong solidity là 0.

    constructor() ERC721("Pixel NFT", "PET"){}

    // Đúc token mới (mint) thì tokenCount sẽ tăng lên 1 để lấy mã mới.
    // _tokenURI hình như là để nhập vào 1 cái link siêu dữ liệu - từ đó để set ảnh cho NFT (có thể là vậy).
    function mint(string memory _tokenURI) external returns(uint) {
        tokenCount ++;
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);
        return(tokenCount);
    }

    // --> Contract NFT.sol như vậy là đã xong. Chúng ta chỉ cần 1 hàm mint duy nhất. Let's go qua phần khác nào!
    // À khoan, qua hardhat test 1 tí đã nào :D. Phút 29:00. "npx hardhat node"
}