// 20:12:02 -> Repaying with Aave

/**
 * @dev we would create a function called repay()
 */

const { getNamedAccounts, ethers } = require("hardhat")
const { getWeth, AMOUNT } = require("../scripts/getWeth")

async function main() {
    await getWeth()

    const { deployer } = await getNamedAccounts()
    const lendingPool = await getLendingPool(deployer)
    console.log(`Lending Pool Address ${lendingPool.address}`)

    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
    console.log("Depositing...")
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
    console.log("Deposited!")

    let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, deployer)

    const daiPrice = await getDaiPrice()

    const amountToDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
    console.log(`You can borrow ${amountToDaiToBorrow} DAI`)

    const amountToDaiToBorrowWei = ethers.utils.parseEther(amountToDaiToBorrow.toString())

    const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    await borrowDai(daiTokenAddress, lendingPool, amountToDaiToBorrowWei, deployer)

    await getBorrowUserData(lendingPool, deployer)

    /**
     * @dev we want to repay what we borrowed
     **/
    await repay(amountToDaiToBorrowWei, daiTokenAddress, lendingPool, deployer)

    /**
     * @dev we called getBorrowUserData(lendingPool, deployer) again bcos
     * we want to again know the user account data across all the reserves when we repay 
     */
    await getBorrowUserData(lendingPool, deployer)
}

/**
 * @notice Repays a borrowed `amount` on a specific reserve
 **/
async function repay(amount, daiAddress, lendingPool, account) {
    /**
     * @dev when we want to repay, we need to approve aave to do so
     */
    await approveErc20(daiAddress, lendingPool.address, amount, account)

    /**
     * @param daiAddress same as asset The address of the borrowed underlying asset previously borrowed
     * @param amount The amount to repay
     * @param rateMode The interest rate mode at of the debt the user wants to repay: 1 for Stable, 2 for Variable
     * @param onBehalfOf Address of the user who will get his debt reduced/removed.
     **/
    const repayTx = await lendingPool.repay(daiAddress, amount, 1, account)
    await repayTx.wait(1)
    console.log("Repaid")
}

async function borrowDai(daiAddress, lendingPool, amountToDaiToBorrowWei, account) {
    const borrowTx = await lendingPool.borrow(daiAddress, amountToDaiToBorrowWei, 1, 0, account)
    await borrowTx.wait(1)
    console.log("You've borrowed!")
}

async function getDaiPrice() {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616e4d11a78f511299002da57a0a94577f1f4"
    )
    const price = (await daiEthPriceFeed.latestRoundData())[1]
    console.log(`The DAI/ETH price is ${price.toString()}`)
    return price
}

async function getBorrowUserData(lendingPool, account) {
    const {
        totalCollateralETH,
        totalDebtETH,
        availableBorrowsETH
    } = await lendingPool.getUserAccountData(account)
    console.log(`You have ${totalCollateralETH} worth of ETH deposited`)
    console.log(`You have ${totalDebtETH} worth of ETH borrowed`)
    console.log(`You have ${availableBorrowsETH} worth of ETH borrowed`)
    return { availableBorrowsETH, totalDebtETH }
}

async function getLendingPool(account) {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account
    )
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)
    return lendingPool
}

async function approveErc20(erc20Address, spenderAddress, amountToSpend, account) {
    const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account)
    const tx = await erc20Token.approve(spenderAddress, amountToSpend)
    await tx.wait(1)
    console.log("Approved!")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })

// Now when we run -> yarn hardhat run scripts/aaveBorrow.js
// It displays this -> Got 20000000000000000 WETH
// Lending Pool Address 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9
// Approved!
// Depositing...
// Deposited!
// You have 20000000000000000 worth of ETH deposited
// You have 0 worth of ETH borrowed
// You have 16500000000000000 worth of ETH borrowed
// The DAI/ETH price is 617103955105258
// You can borrow 25.40090671972172 DAI
// Error: VM Exception while processing transaction: reverted with reason string '12'
//     at <UnrecognizedContract>.<unknown> (0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9)
//     at <UnrecognizedContract>.<unknown> (0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9)
//     at <UnrecognizedContract>.<unknown> (0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9)
//     at processTicksAndRejections (node:internal/process/task_queues:96:5)
//     at HardhatNode._mineBlockWithPendingTxs (/home/shadow-walker/hardhat-defi-fcc/node_modules/hardhat/src/internal/hardhat-network/provider/node.ts:1650:23)

// again I ignored this same error bcos it wasent resolved in the repo

// Also note that patrick said the reason why we still have some borrowed left is bcos
// when we borrow DAI it added interest. so if we want to pay the remaining debt
// we can swap our ETH for DAI in Uniswap and programmatically get the Uniswap contract that we do that
// in our code and pay the dept fully.
