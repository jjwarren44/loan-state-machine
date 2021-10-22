const stateMachine = artifacts.require("StateMachine.sol");

const amount = 1000;
const interest = 10;
const duration = 10000;

module.exports = function(deployer, _network, accounts) {
    deployer.deploy(stateMachine, amount, interest, duration, accounts[0], accounts[1]);
}