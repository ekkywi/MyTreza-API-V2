const transactionService = require("../../services/transaction.service");
const exportService = require("../../services/export.service");

exports.exportTransactions = async (req, res, next) => {
    try {
        // 1. Fetch transactions using the same powerful filter logic
        // We force limit to be very high (e.g., 10000) to get all data
        const query = { ...req.query, limit: 10000, page: 1 };

        const result = await transactionService.findAll(req.user.id, query);
        const transactions = result.items;

        // 2. Generate CSV
        const csvString = exportService.generateCsv(transactions);

        // 3. Send Response
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="transactions.csv"'
        );
        res.status(200).send(csvString);
    } catch (err) {
        next(err);
    }
};
