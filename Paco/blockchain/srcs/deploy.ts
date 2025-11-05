import { ethers } from 'ethers'
import fs from 'fs'
import solc from 'solc'

// -----------------------------
// 1. Compile the contract
// -----------------------------
const source = fs.readFileSync('./contracts/GameScore.sol', 'utf8')
const input = {
	language: 'Solidity',
	sources: { 'GameScore.sol': { content: source } },
	settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
}

const output = JSON.parse(solc.compile(JSON.stringify(input)))
const contractSol = output.contracts['GameScore.sol']['GameScore']
fs.writeFileSync('./contracts/GameScore.json', JSON.stringify(contractSol))
console.log('Compiled contract written to GameScore.json')

// -----------------------------
// 2. Connect to local Avalanche node
// -----------------------------
const privateKey = '0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027'
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:9650/ext/bc/C/rpc')
const wallet = new ethers.Wallet(privateKey, provider)

async function main() {
	const balance = await provider.getBalance(wallet.address)
	console.log('Wallet balance:', ethers.formatEther(balance), 'AVAX')

	const compiled = JSON.parse(fs.readFileSync('./contracts/GameScore.json'))
	const factory = new ethers.ContractFactory(compiled.abi, compiled.evm.bytecode.object, wallet)

	console.log('Deploying contract...')
	const nonce = await provider.getTransactionCount(wallet.address, 'pending')
	const contract = await factory.deploy({ nonce })
	await contract.waitForDeployment()
	console.log('Contract deployed at:', contract.target)

	console.log('NONCE: ', nonce)
	console.log('Setting score to 42...')
	const txSet = await contract.setScore(42, { nonce })
	await txSet.wait()
	console.log('Score set!')

	// 5. Read the score
	const score = await contract.getScore()
	console.log('Score on chain:', score.toString())
}

main().catch(err => {
	console.error('Error:', err)
})
