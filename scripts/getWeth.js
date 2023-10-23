// 19:30:51 -> WETH Wrapped ETH, forking Mainnet -- without comments

const { getNamedAccounts, ethers } = require("hardhat")
const AMOUNT = ethers.utils.parseEther("0.02")

async function getWeth() {
    const { deployer } = await getNamedAccounts()
    const iWeth = await ethers.getContractAt(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        deployer
    )
    const tx = await iWeth.deposit({ value: AMOUNT })
    await tx.wait(1)
    const wethBalance = await iWeth.balanceOf(deployer)
    console.log(`Got ${wethBalance.toString()} WETH`)
}

module.exports = {
    getWeth,
    AMOUNT
}

/*
// // 19:30:51 -> WETH Wrapped ETH, forking Mainnet

// const { getNamedAccounts, ethers } = require("hardhat")
// const AMOUNT = ethers.utils.parseEther("0.02")

// /**
//  * @dev We want to write a script that will deposit our token i.e ETH with a WETH token i.e ERC-20 token
//  */
// async function getWeth() {
//     const { deployer } = await getNamedAccounts()
//     /**
//      *@dev We want to call the deposit function on the weth contract, which means we would need
//      * the abi, contract address
//      * So we want to use the contract address of WETH Token mainnet = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
//      * getContractAt() -> to get a specific contract
//      */
//     const iWeth = await ethers.getContractAt(
//         "IWeth",
//         "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
//         deployer
//     )
//     const tx = await iWeth.deposit({ value: AMOUNT })
//     await tx.wait(1)
//     const wethBalance = await iWeth.balanceOf(deployer)
//     console.log(`Got ${wethBalance.toString()} WETH`)
// }

// module.exports = {
//     getWeth,
//     AMOUNT
// }
// */

