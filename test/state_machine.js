const { expectRevert, time } = require("@openzeppelin/test-helpers");
const _stateMachine = artifacts.require("StateMachine");

const State = {
    PENDING: 0,
    ACTIVE: 1,
    CLOSED: 2
}

contract("StateMachine", (accounts) => {
    let stateMachine = null;
    const borrower = accounts[0];
    const lender = accounts[1];
    const otherAccount = accounts[2];
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
        const state = await stateMachine.state();

        assert(_borrower === borrower);
        assert(_lender === lender);
        assert(_amount.toNumber() === amount);
        assert(_interest.toNumber() === interest);
        assert(state.toNumber() === State.PENDING);
    });

    it("should NOT let anyone but the lender lend", async() => {
        await expectRevert(
            stateMachine.fund({ from: otherAccount, value: amount }),
            "only lender can lend"
        );

    });

    it("should NOT let the lender lend anything other than the loan amount", async() => {
        await expectRevert(
            stateMachine.fund({ from: lender, value: amount - 100 }),
            "can only lend the exact amount"
        );
    });

    it("should allow lender to fund the smart contract", async() => {
        const borrowerStartBalance = await web3.eth.getBalance(borrower);
        const borrowerStartBalanceBN = web3.utils.toBN(borrowerStartBalance);
        await stateMachine.fund({ from: lender, value: amount });
        const borrowerNewBalance = await web3.eth.getBalance(borrower);
        const borrowerNewBalanceBN = web3.utils.toBN(borrowerNewBalance);
        const state = await stateMachine.state();

        assert(borrowerNewBalanceBN.sub(borrowerStartBalanceBN).toNumber() === amount);
        assert(state.toNumber() === State.ACTIVE);
    });

    it("should NOT let anyone but the borrower reimburse the lender", async() => {
        await expectRevert(
            stateMachine.reimburse({ from: otherAccount, value: amount }),
            "only borrower can reimburse"
        );
    });

    it("should NOT let the borrower to reimburse less than the amount + interest", async() => {
        await expectRevert(
            stateMachine.reimburse({ from: borrower, value: amount }),
            "borrower needs to reimburse amount + interest"
        );
    });

    it("should NOT let borrower repay until maturity time", async() => {
        await expectRevert(
            stateMachine.reimburse({ from: borrower, value: amount + interest }),
            "loan hasn't matured yet"
        );
    })

    it("should allow the borrower to reimburse the lender", async() => {
        await time.increase(duration + 100);
        const lenderStartBalance = await web3.eth.getBalance(lender);
        const lenderStartBalanceBN = web3.utils.toBN(lenderStartBalance);
        await stateMachine.reimburse({ from: borrower, value: amount + interest });
        const lenderNewBalance = await web3.eth.getBalance(lender);
        const lenderNewBalanceBN = web3.utils.toBN(lenderNewBalance);
        const state = await stateMachine.state();

        assert(lenderNewBalanceBN.sub(lenderStartBalanceBN).toNumber() === amount + interest);
        assert(state.toNumber() === State.CLOSED);
    });




})