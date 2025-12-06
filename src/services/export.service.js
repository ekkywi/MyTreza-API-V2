exports.generateCsv = (transactions) => {
    // 1. Define Headers
    const headers = [
        "Date",
        "Wallet",
        "Type",
        "Category",
        "Amount",
        "Description",
    ];

    // 2. Map Data to Rows
    const rows = transactions.map((t) => {
        const date = t.date.toISOString().split("T")[0]; // YYYY-MM-DD
        const wallet = t.wallet ? t.wallet.name : "-";
        const type = t.type;
        const category = t.category ? t.category.name : "-";
        const amount = t.amount;
        // Escape quotes in description
        const description = t.description
            ? `"${t.description.replace(/"/g, '""')}"`
            : "";

        return [date, wallet, type, category, amount, description].join(",");
    });

    // 3. Combine Header + Rows
    return [headers.join(","), ...rows].join("\n");
};
