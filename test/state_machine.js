const { expectRevert, time } = require("@openzeppelin/test-helpers");
const _stateMachine = artifacts.require("StateMachine");

contract("StateMachine", (accounts) => {
    let stateMachine = null;
    const borrower = accounts[0];
    const lender = accounts[1];
    const amount = 1000;
    const interest = 10;
    const duration = 10000;

    before(async() => {
        stateMachine = await _stateMachine.new(amount, interest, duration, borrower, lender);
    });

    it("should initialize loan with correct values", async() => {
        const _borrower = await stateMachine.borrower();
        const _lender = await stateMachine.lender();
        const _amount = await stateMachine.amount();
        const _interest = await stateMachine.interest();

        assert(_borrower === borrower);
        assert(_lender === lender);
        assert(_amount.toNumber() === amount);
        assert(_interest.toNumber() === interest);
    });
})