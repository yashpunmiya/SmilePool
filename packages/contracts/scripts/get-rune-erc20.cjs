// Simple script to compute the ERC20 address for a given Rune ID
const { getCreate2RuneAddress } = require("@midl/executor");

const runeId = process.argv[2] || "200401:1";
const erc20Address = getCreate2RuneAddress(runeId);
console.log(`Rune ID: ${runeId}`);
console.log(`ERC20 Address: ${erc20Address}`);
