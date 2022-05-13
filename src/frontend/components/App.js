import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

// import logo from './logo.png';
import './App.css';
import Navigation from "./Navbar";

import React, { useState } from "react"; // Dùng useState để lưu trữ tài khoản được kết nối với ứng dụng.
import { ethers } from "ethers";

import MarketplaceAbi from "../contractsData/Marketplace.json";
import MarketplaceAddress from "../contractsData/Marketplace-address.json";
import NFTAbi from "../contractsData/NFT.json";
import NFTAddress from "../contractsData/NFT-address.json";

import Home from "./Home";
import Create from "./Create";
import MyListedItem from "./MyListedItem";
import MyPurchase from "./MyPurchases";
import { Spinner } from "react-bootstrap";

import MetaMaskOnboarding from '@metamask/onboarding';

const onboarding = new MetaMaskOnboarding();

// Tạo hàm kiểm tra xem đã cài đặt MetaMask hay chưa? Trả về true/false
const isMetaMaskInstalled = () => {
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
}

// Tạo sự kiện để cài đặt MetaMask - dùng sẵn thư viện @metamask/onboarding
const onClickInstallMetaMask = () => {
  onboarding.startOnboarding();
}

function App() {

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [nft, setNFT] = useState({});
  const [marketplace, setMarketplace] = useState({})

  // Change button Connect Wallet cho phù hợp, nếu chưa tải MetaMask ta chuyển thành Install MetaMask cho hay hơn ^^
  let strButton = "Connect Wallet";
  if (!isMetaMaskInstalled()) {
    strButton = "Install MetaMask";
  }

  // MetaMask login/connect
  const web3Handler = async () => {

    // Check metamask install
    if (!isMetaMaskInstalled()) {
      onClickInstallMetaMask();
      return;
    }

    // Get list accounts from MetaMask
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }); // Trả về danh sách account
    setAccount(accounts[0]);
    // Get provider from MetaMask
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    // Set signer - lấy tài khoản đăng kí đã kết nối (Chưa hiểu khúc này lắm :v không phải tài khoản account[0] sao).
    const signer = provider.getSigner();

    const { chainId } = await provider.getNetwork();

    if (chainId != 31337) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: "0x7a69",
          },
        ],
      });
    }

    window.ethereum.on('chainChanged', (chainId) => {
      window.location.reload();
      console.log(chainId);
    })

    window.ethereum.on('accountsChanged', async function (accounts) {
      setAccount(accounts[0])
      await web3Handler()
    })
    loadContracts(signer)
  }
  const loadContracts = async (signer) => {
    // Get deployed copies contracts
    const marketplace = new ethers.Contract(MarketplaceAddress.address, MarketplaceAbi.abi, signer);
    setMarketplace(marketplace);
    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer);
    setNFT(nft);
    setLoading(false);
  }

  return (
    <BrowserRouter>
      <div className="App">
      
      <Navigation web3Handler = {web3Handler} account={account} strButton={strButton} />

      {loading ? (
        // loading true --> hiển thị thông báo đang kết nối
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <Spinner animation="border" style={{ display: 'flex' }} />
          <p className='mx-3 my-0'>Đang kết nối với MetaMask... bạn đợi chút nhé ^^</p>
        </div>
      ) : (
        // loading false --> xuất ra các tuyến đường luôn nè :D
        <Routes>
          <Route path="/" element={ <Home marketplace={marketplace} nft={nft} /> } />
          <Route path="/create" element={ <Create marketplace={marketplace} nft={nft} /> } />
          <Route path="/my-listed-items" element={ <MyListedItem marketplace={marketplace} nft={nft} account={account} /> } />
          <Route path="/my-purchases" element={ <MyPurchase marketplace={marketplace} nft={nft} account={account} /> } />
        </Routes>
      )}

      </div>
    </BrowserRouter>
  );
}

export default App;
