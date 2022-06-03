import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Row, Col, Card, Button } from "react-bootstrap";

export default function MyPurchases({ marketplace, nft, account }) {
    const [loading, setLoading] = useState(true);
    const [purchases, setPurchases] = useState([]);
    
    const loadPurchasedItems = async () => {
        // Fetch purchased item from marketplace by quering Offered events with the buyer set as the user
        const filter = marketplace.filters.Bought(null, null, null, null, null, account);
        const results = await marketplace.queryFilter(filter);
        
        // Fetch metadata of each NFT and add that to listedItem object
        // Cần dùng "Promise.all" để ép kiểu các phần bên trong do "result.map" thực hiện nhiều hoạt động không đồng bộ
        const purchases = await Promise.all(results.map(async i => {
            // Lấy các đối số từ mỗi kết quả nhận được
            // Fetch arguments from each result
            i = i.args;
            // get uri url from  nft contract
            const uri = await nft.tokenURI(i.tokenId);
            // use uri to fecth the nft metadata stored on ipfs
            const response = await fetch(uri);
            const metadata = await response.json();
            // get total price of item (item price + fee)
            const totalPrice = await marketplace.getTotalPrice(i.itemId);
            // define listed item object
            let purchasedItem = {
                totalPrice,
                price: i.price,
                itemId: i.itemId,
                name: metadata.name,
                description: metadata.description,
                image: metadata.image
            }
            return purchasedItem
        }))
        setLoading(false);
        setPurchases(purchases);
    }
    useEffect(() => {
        loadPurchasedItems()
    }, [])

    const sellAgain = async (item) => {
        // approve marketplace to spend NFT
        await (await nft.setApprovalForAll(marketplace.address, true)).wait();
        // add NFT to marketplace
        const listingPrice = item.price;
        console.log(listingPrice + " - dong 12/MyListedItem.js - ")
        console.log(item.itemId + " - don 13/MyListedItem.js - ")
        console.log(item.tokenId + " - don 14/MyListedItem.js - ")
        await (await marketplace.makeOldItem(nft.address, item.itemId, listingPrice, item.itemId)).wait();
        item.sold = false;
        console.log(item.sold);
        loadPurchasedItems();
    }
    useEffect(() => {
        loadPurchasedItems()
    }, [])

    if (loading) return (
        <main style={{ padding: "1rem 0" }}>
            <h2>Đang tải... bạn đợi chút nhé ^^</h2>
        </main>
    )
    return (
        <div className="flex justify-center">
            {purchases.length > 0 ?
                <div className="px-5 py-3 container">
                    <h2>- Purchased -</h2>
                    <Row xs={1} md={2} lg={4} className="g-4 py-5">
                        {purchases.map((item, idx) => (
                            <Col key={idx} className="overflow-hidden">
                                <Card>
                                    <Card.Img variant="top" src={item.image} />
                                    <Card.Text>
                                        {ethers.utils.formatEther(item.totalPrice)} ETH
                                    </Card.Text>
                                    <Card.Footer>
                                        <div className='d-grid'>
                                            <Button onClick={() => sellAgain(item)} variant="primary" size="lg">
                                                Sell again
                                            </Button>
                                        </div>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>    
                : (
                    <main style={{ padding: "1rem 0" }}>
                        <h2>No purchases</h2>
                    </main>
                )}
        </div>
    ) 
}