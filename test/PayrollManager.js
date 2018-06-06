
const BigNumber = web3.BigNumber
const signer = require("eth-signer")
const should = require("chai")
    .use(require("chai-as-promised"))
    .should()
const expect = require("chai").expect
const eur = require("./helpers/ether")

// --- Handled contracts
const PayrollManager = artifacts.require("./payroll/PayrollManager.sol")
const EURToken = artifacts.require("./token/EURToken.sol")

// Contracts
let payroll = null
let eurToken = null

// Agents
let owner = null
let employee_1 = { yearlyEURSalary : eur(120000) }
let employee_2 = { yearlyEURSalary : eur(240000) }
let employee_3 = { yearlyEURSalary : eur(320000) }

contract("PayrollManager", async accounts => {

    before( async () => {

        owner = accounts[0]
        employee_1.account = accounts[1]
        employee_2.account = accounts[2]
        employee_3.account = accounts[3]
        oracle = accounts[4]

        eurToken = await EURToken.new({ from: owner })
        payroll = await PayrollManager.new(eurToken.address, oracle, { from: owner })

    })

    context('Manage employees', () => {
        
        it("should only allow add a new employee by the owner", async () => {
            await payroll.addEmployee(
                employee_1.account,
                [],
                employee_1.yearlyEURSalary,
                { from: employee_1.account }
            ).should.be.rejectedWith("VM Exception")
        })

        it("should deny a new employee with an invalid address", async () => {
            await payroll.addEmployee(
                "0x0",
                [],
                employee_1.yearlyEURSalary,
                { from: owner }
            ).should.be.rejectedWith("VM Exception")
        })

        it("should add a new employee", async () => {
            const { logs } = await payroll.addEmployee(
                employee_1.account,
                [],
                employee_1.yearlyEURSalary,
                { from: owner }
            )
            const event = logs.find(e => e.event === "LogEmployeeAdded")
            const args = event.args
            expect(args).to.include.all.keys([
                "accountAddress",
                "employeeId",
                "initialYearlyEURSalary"
            ])
            assert.equal(args.accountAddress, employee_1.account, "Employee's account must be registered")
            assert.equal(args.employeeId, BigNumber(1), "The employee must be the first employee" )
            assert.equal(args.initialYearlyEURSalary, employee_1.yearlyEURSalary, "The yearly salary must be the expected")
            employee_1.employeeId = args.employeeId
        })

        it("should deny add an employee with an existing account", async () => {
            await payroll.addEmployee(
                employee_1.account,
                [],
                employee_1.yearlyEURSalary,
                { from: owner }
            ).should.be.rejectedWith("VM Exception")
        })

    })

})