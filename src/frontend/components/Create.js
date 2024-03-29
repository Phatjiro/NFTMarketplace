import { useState } from "react";
import { ethers } from "ethers";
import { Row, Form, Button } from "react-bootstrap";
import { create as ipfsHttpClient } from 'ipfs-http-client'
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

const Create = ({ marketplace, nft }) => {

    const [image, setImage] = useState('');
    const [price, setPrice] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const uploadToIpfs = async (event) => {
        event.preventDefault();
        const file = event.target.files[0];

        // Check file coi có chọn đúng định dạng không
        if (typeof file !== 'undefined') {
            try {
                const result = await client.add(file);
                console.log(result.path);
                setImage(`https://ipfs.infura.io/ipfs/${result.path}`);
            } catch (error) {
                console.log("ipfs image upload error: ", error);
            }
        }
    }

    const createNFT = async () => {
        if (!image || !price || !name || !description) return
        try {
            const result = await client.add(JSON.stringify({ image, name, description }));
            mintThenList(result);
        } catch (error) {
            console.log("ifps uri upload error: ", error);
        }
    }
    const mintThenList = async (result) => {
        const uri = `https://ipfs.infura.io/ipfs/${result.path}`;
        console.log(uri);
        // Mint NFT
        await (await nft.mint(uri)).wait();
        // get tokenId for new NFT
        const id = await nft.tokenCount();
        // approve marketplace to spend NFT
        await (await nft.setApprovalForAll(marketplace.address, true)).wait();
        // add NFT to marketplace
        const listingPrice = ethers.utils.parseEther(price.toString());
        console.log(typeof(listingPrice) + " - dong 50/Create.js - ")
        await (await marketplace.makeItem(nft.address, id, listingPrice)).wait();
    }

    return (
        <div className="container-fluid mt-5">
            <div className="row">
                <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
                    <div className="content mx-auto">
                        <Row className="g-4">
                            <Form.Control 
                                type="file" 
                                name="file" 
                                onChange={uploadToIpfs} 
                            />
                            <Form.Control 
                                onChange={(e) => setName(e.target.value)} 
                                size="lg" 
                                type="text" 
                                placeholder="Name" 
                            />
                            <Form.Control 
                                onChange={(e) => setDescription(e.target.value)} 
                                size="lg" 
                                type="textarea" 
                                placeholder="Description" 
                            />
                            <Form.Control 
                                onChange={(e) => setPrice(e.target.value)} 
                                size="lg" 
                                type="number" 
                                placeholder="Price in ETH" 
                            />
                            <div className="d-grid px-0">
                                <Button onClick={createNFT} variant="primary" size="lg">
                                    Create & List NFT!
                                </Button>
                            </div>
                        </Row>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Create;