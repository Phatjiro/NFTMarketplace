import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Row, Col, Card } from "react-bootstrap";

function renderSoldItems(items) {
    return (
        <>
            <h2>- Sold -</h2>
            <Row xs={1} md={2} lg={4} className="g-4 py-3">
                {items.map((item, idx) => (
                    <Col key={idx} className="overflow-hidden">
                        <Card>
                            <Card.Img variant="top" src={item.image} />
                            <Card.Footer>
                                For {ethers.utils.formatEther(item.totalPrice)} ETH - Recieved {ethers.utils.formatEther(item.price)} ETH
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
            </Row>
        </>
    )
}

export default function MyListedItems({ marketplace, nft, account }) {

    const [loading, setLoading] = useState(true);
    const [listedItems, setListedItems] = useState([]);
    const [soldItems, setSoldItems] = useState([]);

    const loadListedItems = async () => {

        // Load all sold items that the user listed
        const itemCount = await marketplace.itemCount();
        let listedItems = [];
        let soldItems = [];

        // Dùng for để load từng cái lên nè
        for (let indx = 1; indx <= itemCount; indx++) {
            
            const i = await marketplace.items(indx);
            if (i.seller.toLowerCase() === account) {

                // Get uri from NFT contract
                const uri = await nft.tokenURI(i.tokenId);
                // Use uri to fecth the nft metadata stored on ipfs
                const response = await fetch(uri) // dùng fetch để lấy đường dẫn về
                const metadata = await response.json() // lụm từ response cái file json để đọc
                // Get totalPrice of item (price + fee)
                const totalPrice = await marketplace.getTotalPrice(i.itemId);
                // Define listed item object
                let item = {
                    totalPrice,
                    price: i.price,
                    itemId: i.itemId,
                    name: metadata.name,
                    description: metadata.description,
                    image: metadata.image
                }

                listedItems.push(item);
                // Add listed item to --> sold items array if it sold == true
                if (i.sold) {
                    soldItems.push(item);
                }
            }
        }
        setLoading(false);
        setListedItems(listedItems);
        setSoldItems(soldItems);
    }
    useEffect(() => {
        loadListedItems()
    }, []);
    
    if (loading) return (
        <main style={{ padding: "1rem 0" }}>
            <h2>Đang tải... bạn đợi chút nhé ^^</h2>
        </main>
    );
    // Continue later, have to go now!!! 9:18 13/05/2022.
    return (
        <div className="flex justify-center">
            {listedItems.length > 0 ?
                <div className="px-5 py-3 container">
                    <h2>- Listed -</h2>
                    <Row xs={1} md={2} lg={4} className="g-4 py-3">
                        {listedItems.map((item, idx) => (
                            <Col key={idx} className="overflow-hidden">
                                <Card>
                                    <Card.Img variant="top" src={item.image} />
                                    <Card.Footer>{ethers.utils.formatEther(item.totalPrice)} ETH</Card.Footer>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    {soldItems.length > 0 && renderSoldItems(soldItems)}
                </div>
                : (
                    <main style={{ padding: "1rem 0" }}>
                        <h2>No listed assets</h2>
                    </main>
                )}   
        </div>
    )
}