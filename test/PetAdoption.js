const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers} = require("hardhat");

describe("PetAdoption", function () {
    async function deployContractFixture() {
        const PETS_COUNTS = 5;
        const ADOPTED_PET_IDX = 0;

        const [owner, account2, account3] = await ethers.getSigners();
        const PetAdoption = await ethers.getContractFactory("PetAdoption");
        const contract = await PetAdoption.deploy(PETS_COUNTS);

        await contract.connect(account3).adoptPet(ADOPTED_PET_IDX);

        return {
            owner, account2, account3,
            contract,
            petsAddedCount: PETS_COUNTS,
            adoptedPetIdx: ADOPTED_PET_IDX
        };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { owner, contract } = await loadFixture(deployContractFixture);
            const contractOwner = await contract.owner();

            expect(contractOwner).to.equal(owner.address);
        })

        it("Should return the right owner", async function () {
            const { owner, contract } = await loadFixture(deployContractFixture);
            const contractOwner = await contract.getOwner();

            expect(contractOwner).to.equal(owner.address);
        })
    })

    describe("Add pet", function () {
        it("Should revert with the right error in case of non-owner", async function () {
            const { contract, account2 } = await loadFixture(deployContractFixture);

            await expect(contract.connect(account2).addPet())
                .to.be.revertedWith("Only owner can add pets");
        });

        it("Should increase pet index", async function () {
            const { contract, petsAddedCount } = await loadFixture(deployContractFixture);

            await contract.addPet();

            const petIndex = await contract.petIndex();

            expect(petIndex).to.equal(petsAddedCount + 1);
        });
    })

    describe("Adopt pet", function () {
        it("Should revert with out of range pet index", async function () {
            const { contract, petsAddedCount } = await loadFixture(deployContractFixture);

            await expect(contract.adoptPet(petsAddedCount))
                .to.be.revertedWith("Pet does not exist");
            await expect(contract.adoptPet(-1)).to.be.rejectedWith("value out-of-bounds");
        })

        it("Pet is already adopted", async function () {
            const { contract, adoptedPetIdx } = await loadFixture(deployContractFixture);

            await expect(contract.adoptPet(adoptedPetIdx))
                .to.be.revertedWith("Pet already adopted");
        })

        it("Should adopt pet successfully", async function () {
            const { contract, account2 } = await loadFixture(deployContractFixture);
            const firstPetIdx = 1;
            const secondPetIdx = 2;

            await expect(contract.connect(account2).adoptPet(firstPetIdx)).not.to.be.reverted;
            await contract.connect(account2).adoptPet(secondPetIdx);

            const petOwnerAddress = await contract.petIdxToOwnerAddress(firstPetIdx);
            const zeroAddress = await contract.petIdxToOwnerAddress(100);

            expect(zeroAddress).to.equal("0x0000000000000000000000000000000000000000");
            expect(petOwnerAddress).to.equal(account2.address);

            const petsByOwner = await contract.connect(account2).getAllAdoptedPetsByOwner();
            const allAdoptedPets = await contract.getAllAdoptedPets();

            expect(petsByOwner.length).to.equal(2);
            expect(allAdoptedPets.length).to.equal(3);

            expect(petsByOwner).to.deep.equal([firstPetIdx, secondPetIdx]);
        })
    });
});
