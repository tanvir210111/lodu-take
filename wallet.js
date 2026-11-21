// Wallet & Withdrawal Management System (English)
class WalletManager {
    constructor() {
        this.STORAGE_KEY = 'lodu_game_wallet_v1';
        this.MIN_WITHDRAW_AMOUNT = 200;
        this.REWARD_PER_LEVEL = 20;
        this.data = this.loadData();
    }

    loadData() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.warn('Could not load wallet from storage', e);
        }
        return {
            balance: 0,
            totalEarned: 0,
            withdrawals: []
        };
    }

    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Could not save wallet', e);
        }
    }

    getBalance() {
        return this.data.balance;
    }

    addLevelReward(level) {
        this.data.balance += this.REWARD_PER_LEVEL;
        this.data.totalEarned += this.REWARD_PER_LEVEL;
        this.saveData();
        return this.data.balance;
    }

    canWithdraw(amount) {
        return amount >= this.MIN_WITHDRAW_AMOUNT && amount <= this.data.balance;
    }

    withdraw(amount, method, account) {
        if (!this.canWithdraw(amount)) {
            return {
                success: false,
                message: `Minimum withdrawal is 200 BDT and you must have sufficient balance!`
            };
        }

        if (!account || account.trim().length < 11) {
            return {
                success: false,
                message: `Please provide a valid 11-digit mobile account number!`
            };
        }

        this.data.balance -= amount;
        const tx = {
            id: 'TXN' + Date.now().toString().slice(-6),
            amount: amount,
            method: method,
            account: account,
            date: new Date().toLocaleDateString('en-US'),
            status: 'Pending'
        };

        this.data.withdrawals.push(tx);
        this.saveData();

        return {
            success: true,
            tx: tx,
            message: `৳ ${amount} BDT withdrawal request (${method.toUpperCase()}) submitted successfully!`
        };
    }
}

window.walletManager = new WalletManager();
