// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; // Cái này dùng để bảo mật, hạn chế bị tấn công thì phải.

contract Marketplace is ReentrancyGuard {

    // State Variables
    // immutable là khai báo biến đó thành bất biến, có thể chỉ định nhưng không thay đổi trong suốt hợp đồng.
    address payable public immutable feeAccount; // Account nhận được phí.
    uint public immutable feePercent; // Phần trăm phí khi bán.
    uint public itemCount;

    /*  
        Tạo 1 cái struct cho item
        Phải có dữ liệu được liên kết với mỗi item, bao gồm:
        id của NFT trong hợp đồng đó,
        địa chỉ của người bán,
        giá mà người bán đặt.
    */
    struct Item {
        uint itemId;
        IERC721 nft; // Bản sao của hợp đồng NFT
        uint tokenId;
        uint price;
        address payable seller; // Địa chỉ người bán
        bool sold; // Đã bán hay chưa? False = chưa, True = rồi.
    }

    // Tạo event để theo dõi các sự kiện của hợp đồng.
    // Xác định từng trường của sự kiện
    event Offered (
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller
    );
    event Bought (
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller,
        address indexed buyer
    );

    // ItemId -> Item (Ánh xạ sương sương để lấy dữ liệu nè).
    mapping(uint => Item) public items;

    // Viết hàm khởi tạo
    constructor(uint _feePercent) {
        // Không cần chuyển địa chỉ nhận phí, tham chiếu từ địa chỉ người gửi luôn (msg.sender).
        // Vì mình muốn người nhận là người khởi tạo và là người duy nhất dùng hàm này.
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }

    // IERC721 _nft: Người dùng chuyển đến địa chỉ hợp đồng NFT
    // Và solidity tự động biến nó thành một phiên bản hợp đồng NFT tiếp theo.
    function makeItem(IERC721 _nft, uint _tokenId, uint _price) external nonReentrant { // nonReentrant để ngắn kẻ xấu gọi hàm này quá nhiều lần trước khi hàm thực hiện xong.
        // Kiểm tra để giá phải lớn hơn 0.
        require(_price > 0, "Price must be greater than zero");
        // Tăng tokenCount khi thành công ở bước trên.
        itemCount ++;
        // Transfer NFT
        _nft.transferFrom(msg.sender, address(this), _tokenId);
        // Add item to items mapping
        items[itemCount] = Item (
            itemCount,
            _nft,
            _tokenId,
            _price,
            payable(msg.sender),
            false
        );
        // emit Offered event: Tạo sự kiện và lưu vào nhật kí. Nhật kí này được lưu vào blockchain.
        emit Offered (
            itemCount,
            address (_nft),
            _tokenId,
            _price,
            msg.sender
        );
    }

    // IERC721 _nft: Người dùng chuyển đến địa chỉ hợp đồng NFT
    // Và solidity tự động biến nó thành một phiên bản hợp đồng NFT tiếp theo.
    function makeOldItem(IERC721 _nft, uint _tokenId, uint _price, uint _itemId) external nonReentrant { // nonReentrant để ngắn kẻ xấu gọi hàm này quá nhiều lần trước khi hàm thực hiện xong.
        // Kiểm tra để giá phải lớn hơn 0.
        require(_price > 0, "Price must be greater than zero");
        // Transfer NFT
        _nft.transferFrom(msg.sender, address(this), _tokenId);
        // Add item to items mapping
        items[_itemId] = Item (
            _itemId,
            _nft,
            _tokenId,
            _price,
            payable(msg.sender),
            false
        );
        // emit Offered event: Tạo sự kiện và lưu vào nhật kí. Nhật kí này được lưu vào blockchain.
        emit Offered (
            itemCount,
            address (_nft),
            _tokenId,
            _price,
            msg.sender
        );
    }

    function purchaseItem(uint _itemId) external payable nonReentrant {
        uint _totalPrice = getTotalPrice(_itemId);
        Item storage item = items[_itemId];
        require(_itemId > 0 && _itemId <= itemCount, "item doesn't exist"); // Kiểm tra xem _itemId có nằm trong phạm vi tồn tại không
        require(msg.value >= _totalPrice, "not enough ether"); // Kiểm tra tiền người gửi có đủ không
        require(!item.sold, "item already sold"); // Kiểm tra trạng thái đã bán của item

        // Đủ điều kiện rồi thì thanh toán và mua thôi nè ^^
        item.seller.transfer(item.price);
        feeAccount.transfer(_totalPrice - item.price);

        // Update trạng thái item sau khi bán
        item.sold = true;
        // Transfer NFT to buyer thôi nào
        item.nft.transferFrom(address(this), msg.sender, item.tokenId);
        // emit Bought event: Tạo sự kiện và lưu vào nhật kí. Nhật kí này được lưu vào blockchain.
        emit Bought(
            _itemId, 
            address(item.nft), 
            item.tokenId, 
            item.price, 
            item.seller, 
            msg.sender
        );
    }

    // Get tổng tiền user phải trả vì có phí 1% :v
    function getTotalPrice(uint _itemId) view public returns(uint) {
        return(items[_itemId].price*(100 + feePercent)/100); // giá gốc + phí thuế
    }
}