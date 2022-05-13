// Đây là file để test hợp đồng bằng javascript
// Vì khi triển khai hợp đồng các, nhất là các hợp đồng lớn cần tốn nhiều chi phí cho sửa chữa (không dễ dàng như web) vì vậy
// ta cần kiểm tra kĩ trước khi đưa ra thực tế.

// Ok! Bây giờ ta sẽ dùng khung kiểm tra Waffle do hardhat cung cấp (bản thân mình thấy test bằng waffle khá ok, dễ dùng).

const { expect } = require("chai");

const toWei = (num) => ethers.utils.parseEther(num.toString()); // 1 ether == 10^18 wei
const fromWei = (num) => ethers.utils.formatEther(num);

describe("NFTMarketplace", function() {
    // Đây là chỗ viết bài kiểm tra cho hợp đồng.
    // Và đây là phút 48:00 trong video hướng dẫn.
    
    let deployer, addr1, addr2, nft, marketplace; // Dùng let để khai báo biến trước.
    let feePercent = 1;
    let URI = "Sample URI";

    // Bỏ phần khai báo vào trong đây, mỗi lần test đỡ phải ghi lại.
    beforeEach(async function() {
        // Dùng nhà máy (Factory) cho hợp đồng như bên deploy.js
        const NFT = await ethers.getContractFactory("NFT");
        const Marketplace = await ethers.getContractFactory("Marketplace");

        // Get signers
        [deployer, addr1, addr2] = await ethers.getSigners();

        nft = await NFT.deploy();
        marketplace = await Marketplace.deploy(feePercent);
    });

    // Kiểm tra sương sương khi delpoy coi có đúng mấy cái tên đồ không.
    describe("Deployment", function() {
        it("Name and symbol of the NFT collection", async function() {
            expect( await nft.name()).to.equal("Pixel NFT");
            expect( await nft.symbol()).to.equal("PET");
        })
        it("feeAccount and feePercent of the Marketplace", async function() {
            expect( await marketplace.feeAccount()).to.equal(deployer.address);
            expect( await marketplace.feePercent()).to.equal(feePercent);
        })
    });

    // Ok! Bây giờ ta kiểm tra khi đúc NFT (mint) xem như thế nào.
    describe("Minting NFTs", function() {
        it("Minted NFT", async function() {
            // Ta sẽ cho người có addr1 đúc (mint) - Người 1
            await nft.connect(addr1).mint(URI);
            expect( await nft.tokenCount()).to.equal(1);
            expect( await nft.balanceOf(addr1.address)).to.equal(1);
            expect( await nft.tokenURI(1)).to.equal(URI);

            // Ta sẽ cho người có addr2 đúc (mint) - Người 2
            await nft.connect(addr2).mint(URI);
            expect( await nft.tokenCount()).to.equal(2);
            expect( await nft.balanceOf(addr2.address)).to.equal(1);
            expect( await nft.tokenURI(2)).to.equal(URI);
        })
    });
    // Tạo item trên Marketplace
    describe("Making marketplace items", function() {
        beforeEach(async function() {
            // Đầu tiên, cho addr1 mint 1 NFT ra trước - Người 1
            await nft.connect(addr1).mint(URI);
            // addr1 approves (cấp quyền cho marketplace giữ NFT)
            await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
        })
        it("Create new item, tranfer NFT from seller to marketplace && emit Offered event", async function() {
            // addr1 offer their NFT at a price of 1 ether
            await expect(marketplace.connect(addr1).makeItem(nft.address, 1, toWei(1)))
                .to.emit(marketplace, "Offered")
                .withArgs(
                    1,
                    nft.address,
                    1,
                    toWei(1),
                    addr1.address
                )
            // Kiểm tra xem NFT đã thuộc sở hữu của marketplace chưa?
            expect( await nft.ownerOf(1)).to.equal(marketplace.address);
            // Item count bây giờ phải là 1
            expect( await marketplace.itemCount()).to.equal(1);
            // Get item from items mapping then check fields to ensure they are correct
            const item = await marketplace.items(1);
            expect(item.itemId).to.equal(1);
            expect(item.nft).to.equal(nft.address);
            expect(item.tokenId).to.equal(1);
            expect(item.price).to.equal(toWei(1));
            expect(item.sold).to.equal(false);
        })

        it("Should fail if price is set to zero", async function() {
            await expect(

                marketplace.connect(addr1).makeItem(nft.address, 1, 0)

            ).to.be.revertedWith("Price must be greater than zero");
        });
    });

    describe("Purchasing marketplace item", function() {
        let price = 2;
        let totalPriceInWei;
        beforeEach(async function() {
            // Đầu tiên, cho addr1 mint 1 NFT ra trước - Người 1
            await nft.connect(addr1).mint(URI);
            // addr1 approves (cấp quyền cho marketplace giữ NFT)
            await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
            // addr1 make their nft a marketplace item
            await marketplace.connect(addr1).makeItem(nft.address, 1, toWei(2));
        })
        it("Update item to market and sell it to buyer", async function() {
            const sellerInitalEthBal = await addr1.getBalance();
            const feeAccountInitalEthBal = await deployer.getBalance();

            // Fetch items total price
            totalPriceInWei = await marketplace.getTotalPrice(1);

            // addr2 purchases item
            await expect(marketplace.connect(addr2).purchaseItem(1, { value: totalPriceInWei }))
                .to.emit(marketplace, "Bought")
                .withArgs(
                    1,
                    nft.address,
                    1,
                    toWei(price),
                    addr1.address,
                    addr2.address
                )

            const sellerFinalEthBal = await addr1.getBalance();
            const feeAccountFinalEthBal = await deployer.getBalance();
            
            // Kiểm tra tiền Final có giống với mong đợi không
            expect(+fromWei(sellerFinalEthBal)).to.equal(+price + +fromWei(sellerInitalEthBal));

            // Tính fee
            const fee = (feePercent/100) * price;

            expect(+fromWei(feeAccountFinalEthBal)).to.equal(+fee + +fromWei(feeAccountInitalEthBal));

            // Kiểm tra xem NFT đó thuộc addr2 chưa
            expect( await nft.ownerOf(1)).to.equal(addr2.address);
            // Kiểm tra trạng thái item coi đổi chưa
            expect( (await marketplace.items(1)).sold).to.equal(true);
        });

        it("Fail invalid item id - sold item - not enough ether", async function() {
            // Invalid item id
            await expect(
                marketplace.connect(addr2).purchaseItem(2, { value: totalPriceInWei })
            ).to.be.revertedWith("item doesn't exist");
            await expect(
                marketplace.connect(addr2).purchaseItem(0, { value: totalPriceInWei })
            ).to.be.revertedWith("item doesn't exist");

            // Not enough ether
            await expect(
                marketplace.connect(addr2).purchaseItem(1, { value: toWei(price) })
            ).to.be.revertedWith("not enough ether");

            // Already sold
            // addr2 mua nft số 1
            await marketplace.connect(addr2).purchaseItem(1, { value: totalPriceInWei })
            // deployer thử mua lại cái nft số 1 lần nữa
            await expect(
                marketplace.connect(deployer).purchaseItem(1, { value: totalPriceInWei })
            ).to.be.revertedWith("item already sold");
        });
    });
}) // Ok! 7 bài test full chức năng đã thành công hết. Gét gô qua UI thôi ae ^^. 1:21:54 in youtube.