import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Row, Col, Card, Button } from "react-bootstrap";

import ic_ethererum from "./svg.svg";

const Home = ({ marketplace, nft }) => {
    
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load items lên marketplace
    const loadMarketplaceItems = async () => {
        const itemCount = await marketplace.itemCount();
        let items = [];

        for (let i = 1; i <= itemCount; i++) {
            const item = await marketplace.items(i);
            if (!item.sold) {
                // Get uri url from nft contract
                const uri = await nft.tokenURI(item.tokenId);
                // Use uri to fecth the nft metadata stored on ipfs
                const response = await fetch(uri) // dùng fetch để lấy đường dẫn về
                const metadata = await response.json() // lụm từ response cái file json để đọc
                // Get totalPrice of item (price + fee)
                const totalPrice = await marketplace.getTotalPrice(item.itemId);
                
                // Add item to items array
                items.push({
                  totalPrice,
                  itemId: item.itemId,
                  seller: item.seller,
                  name: metadata.name,
                  description: metadata.description,
                  image: metadata.image
                })
            }
        }
        setItems(items)
        setLoading(false);
    }

    const buyMarketItem = async (item) => {
        await (await marketplace.purchaseItem(item.itemId, { value: item.totalPrice })).wait();
        loadMarketplaceItems();
    }
    useEffect(() => {
        loadMarketplaceItems()
    }, [])


    if (loading) return (
        <main style={{ padding: "1rem 0" }}>
            <h2>Đang tải... bạn đợi chút nhé ^^</h2>
        </main>
    )

    return (
    <div className="flex justify-center">
      {items.length > 0 ?
        <div className="px-5 py-3 container">
          <h2>- Marketplace -</h2>
          <Row xs={1} md={2} lg={4} className="g-4 py-5">
            {items.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={item.image} />
                  <Card.Body color="secondary">
                    <Card.Title>ID: {parseInt(item.itemId)}</Card.Title>
                    <Card.Title>{item.name}</Card.Title>
                    <Card.Text>
                      {item.description}
                    </Card.Text>
                  </Card.Body>
                  <Card.Footer>
                    <div className='d-grid'>
                      <Button onClick={() => buyMarketItem(item)} variant="primary" size="lg">
                        <img src={ic_ethererum} width="18" height="32" /> {ethers.utils.formatEther(item.totalPrice)} ETH
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
            <h2>No listed assets</h2>
          </main>
        )}
    </div>
  )
}
export default Home