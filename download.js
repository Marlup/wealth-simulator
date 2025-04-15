import {
    simulationParams,
    simulate
  } from './main.js';

function downloadData(type) {
    const params = simulationParams || {};
    const timestamp = new Date().toISOString();

    let filename = "";
    let jsonContent = {};

    const sim_results = simulate();

    if (type === 'all') {
        filename = "all_data.json";
        jsonContent = {
            generated_at: timestamp,
            parameters: params,
            data: {
                grossEarnings: sim_results.grossEarnings ?? [],
                taxEarnings: sim_results.taxEarnings ?? [],
                netEarnings: sim_results.netEarnings ?? [],
                balances: sim_results.balances ?? []
            }
        };
    } else {
        const dataMap = {
            gross: { key: 'grossEarnings', label: 'gross_earning.json' },
            tax: { key: 'taxEarnings', label: 'tax_earning.json' },
            net: { key: 'netEarnings', label: 'net_earning.json' },
            balance: { key: 'balances', label: 'balance.json' }
        };

        const selected_data = dataMap[type];
        if (!selected_data) {
            console.error("Invalid type for download:", type);
            return;
        }

        filename = selected_data.label;
        jsonContent = {
            generated_at: timestamp,
            parameters: params,
            [selected_data.key]: sim_results[selected_data.key] ?? []
        };
    }

    const blob = new Blob(
        [JSON.stringify(jsonContent, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);  // Clean up the URL object after download
}

// Attach event listeners to all buttons
document.getElementById("btn-gross")?.addEventListener("click", () => downloadData("gross"));
document.getElementById("btn-tax")?.addEventListener("click", () => downloadData("tax"));
document.getElementById("btn-net")?.addEventListener("click", () => downloadData("net"));
document.getElementById("btn-balance")?.addEventListener("click", () => downloadData("balance"));
document.getElementById("btn-all")?.addEventListener("click", () => downloadData("all"));
