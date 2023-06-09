import {PetItem} from "./components/PetItem";
import {Navbar} from "./components/Navbar";
import TxError from "./components/TxError";
import WalletNotDetected from "./components/WalletNotDetected";
import {useEffect, useState} from "react";
import ConnectWallet from "./components/ConnectWallet";

import {ethers} from "ethers";
import {contractAddress} from "./address";
import PetAdoptionArtifact from "./contracts/PetAdoption.json";
import {TxInfo} from "./components/TxInfo";

const HARDHAT_NETWORK_ID = Number(process.env.REACT_APP_NETWORK_ID);

function Dapp() {
    const [pets, setPets] = useState([])
    const [ownedPets, setOwnedPets] = useState([])
    const [adoptedPets, setAdoptedPets] = useState([])
    const [selectedAddress, setSelectedAddress] = useState(undefined)
    const [contract, setContract] = useState(undefined)
    const [txError, setTxError] = useState(undefined)
    const [txInfo, setTxInfo] = useState(undefined)
    const [view, setView] = useState("home")


    useEffect(() => {
        async function fetchPets() {
            const res = await fetch("/pets.json");
            const data = await res.json();

            setPets(data)
        }

        fetchPets()
    }, [])

    async function connectWallet() {
        try {
            const accounts = await window.ethereum.request({method: 'eth_requestAccounts'})

            await checkNetwork()
            initializeDapp(accounts[0])

            window.ethereum.on("accountsChanged", ([newAddress]) => {
                if (!newAddress) {
                    setAdoptedPets([])
                    setOwnedPets([])
                    setSelectedAddress(undefined)
                    setContract(undefined)
                    setTxError(undefined)
                    setTxInfo(undefined)
                    setView("home")
                    return
                }

                initializeDapp(newAddress)
            })
        } catch (e) {
            console.error(e.message)
        }
    }

    async function initializeDapp(address) {
        setSelectedAddress(address)
        const contract = await initContract();
        getAdoptedPets(contract)
    }

    async function initContract() {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner(0);
        const contract = new ethers.Contract(
            contractAddress.PetAdoption,
            PetAdoptionArtifact.abi,
            signer
        );

        setContract(contract)
        return contract;
    }

    async function getAdoptedPets(contract) {
        try {
            const adoptedPets = await contract.getAllAdoptedPets();
            const ownedPets = await contract.getAllAdoptedPetsByOwner();

            if (adoptedPets.length > 0) {
                setAdoptedPets(adoptedPets.map(petId => Number(petId)))
            } else {
                setAdoptedPets([])
            }

            if (ownedPets.length > 0) {
                setOwnedPets(ownedPets.map(petId => Number(petId)))
            } else {
                setOwnedPets([])
            }
        } catch (e) {
            console.error(e.message)
        }
    }

    async function adoptPet(id) {
        try {
            const tx = await contract.adoptPet(id);
            setTxInfo(tx.hash)
            const receipt = await tx.wait();

            if (receipt.status === 0) {
                throw new Error("Transaction failed")
            }

            setAdoptedPets([...adoptedPets, id])
            setOwnedPets([...ownedPets, id])
        } catch (e) {
            setTxError(e?.reason)
        } finally {
            setTxInfo(undefined)
        }
    }

    async function switchNetwork() {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${HARDHAT_NETWORK_ID.toString(16)}` }],
        })
    }

    async function checkNetwork() {
        if (window.ethereum.networkVersion !== HARDHAT_NETWORK_ID.toString()) {
            return switchNetwork()
        }

        return null
    }

    if (!window.ethereum) {
        return <WalletNotDetected />
    }

    if (!selectedAddress) {
        return <ConnectWallet connect={connectWallet} />
    }

    return (
        <div className="container">
            {
                txInfo && <TxInfo message={txInfo} />
            }
            {
                txError && <TxError dissmiss={() => setTxError(undefined)} message={txError} />
            }
            <br />
            <Navbar
                setView={setView}
                address={selectedAddress}
            />
            <div className="items">
                {
                    view === "home" ? (
                        pets.map(pet => (
                            <PetItem
                                key={pet.id}
                                pet={pet}
                                inProgress={!!txInfo}
                                disabled={adoptedPets.includes(pet.id)}
                                adoptPet={adoptPet}
                            />
                        ))
                    ) : (
                        pets.filter(pet => ownedPets.includes(pet.id))
                            .map(pet => (
                            <PetItem
                                key={pet.id}
                                pet={pet}
                                inProgress={!!txInfo}
                                disabled
                            />
                        ))
                    )
                }
            </div>
        </div>
    );
}

export default Dapp;
